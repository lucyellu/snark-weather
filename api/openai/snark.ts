const SNARK_MOODS = [
  "deadpan",
  "cheerfully smug",
  "mock-dramatic",
  "dryly amused",
  "playfully sarcastic",
  "wry",
];

const CACHE_MS = 10 * 60 * 1000;
const cache = new Map<string, { commentary: string; at: number }>();

// Free and keyless, but anonymous callers are rate limited (~1 request / 15s per IP)
// and it rejects `system` params, so the instructions travel inside the prompt text.
async function pollinations(prompt: string): Promise<string | null> {
  const url = new URL(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`);
  url.searchParams.set("model", process.env.POLLINATIONS_MODEL ?? "openai-fast");
  url.searchParams.set("seed", String(Math.floor(Math.random() * 1_000_000)));
  const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!r.ok) return null;
  return (await r.text()) || null;
}

// Optional, more reliable backup: set GROQ_API_KEY (free tier) to enable.
async function groq(system: string, user: string): Promise<string | null> {
  if (!process.env.GROQ_API_KEY) return null;
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      model: process.env.GROQ_MODEL ?? "openai/gpt-oss-20b",
      max_tokens: 400,
      reasoning_effort: "low",
      temperature: 0.9,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!r.ok) return null;
  const data = (await r.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? null;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const {
    temperature,
    feelsLike,
    conditionLabel,
    city,
    humidity,
    windSpeed,
    uvIndex,
    isDay,
    precipitation,
    dailyHigh,
    dailyLow,
    precipitationChance,
    tomorrowCondition,
    birthdays,
  } = req.body ?? {};

  if (
    temperature === undefined ||
    !conditionLabel ||
    !city ||
    humidity === undefined ||
    windSpeed === undefined ||
    uvIndex === undefined
  ) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const mood = SNARK_MOODS[Math.floor(Math.random() * SNARK_MOODS.length)];

  const forecastDetails = [
    dailyHigh !== undefined && dailyLow !== undefined
      ? `today's high ${Math.round(dailyHigh)}°C, low ${Math.round(dailyLow)}°C`
      : null,
    precipitationChance !== undefined && precipitationChance > 10
      ? `${Math.round(precipitationChance)}% chance of precipitation`
      : null,
    tomorrowCondition ? `tomorrow looks ${tomorrowCondition}` : null,
  ]
    .filter(Boolean)
    .join("; ");

  // First names, e.g. "Jane (turning 34)", from the Birthday Book when someone has a birthday today
  const birthdayList: string[] = Array.isArray(birthdays)
    ? birthdays.filter((b: unknown): b is string => typeof b === "string" && b.length > 0 && b.length < 60).slice(0, 5)
    : [];
  const birthdayNote = birthdayList.length
    ? ` It is also the birthday of ${birthdayList.join(", ")} today: wish them a happy birthday by name, tying it to the weather (e.g. a cake in the rain), all in that one short sentence.`
    : "";

  const systemPrompt = `You are SNARK, a witty weather sidekick. Reply with ONE short, funny sentence (max ${birthdayList.length ? 30 : 20} words) about the weather right now, with a useful nudge (umbrella, layers, sunscreen) if relevant.${birthdayNote} Dry and clever, playful rather than mean or gloomy. No markdown, no emojis, no quotes. Celsius only. Tone: ${mood}.`;

  const userPrompt = `${city}: ${conditionLabel}, ${Math.round(temperature)}°C (feels ${feelsLike !== undefined ? Math.round(feelsLike) : "?"}°C), humidity ${humidity}%, wind ${Math.round(windSpeed)} km/h, UV ${uvIndex}, ${isDay ? "day" : "night"}${precipitation ? `, ${precipitation} mm rain` : ""}${forecastDetails ? `. ${forecastDetails}` : ""}.`;

  const cacheKey = `${city}|${conditionLabel}|${Math.round(temperature)}|${isDay}|${birthdayList.join(",")}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_MS && !req.query?.fresh) {
    res.json({ commentary: hit.commentary, mood });
    return;
  }

  try {
    const prompt = `${systemPrompt}

Weather: ${userPrompt}

Your one-sentence reply:`;
    const raw =
      (await pollinations(prompt).catch(() => null)) ??
      (await groq(systemPrompt, userPrompt).catch(() => null));
    if (!raw) throw new Error("No provider answered");

    const text = raw.trim().replace(/^["“]|["”]$/g, "");
    const commentary = text.length > 240 ? `${text.slice(0, 237).trimEnd()}...` : text;
    cache.set(cacheKey, { commentary, at: Date.now() });
    if (cache.size > 200) cache.delete(cache.keys().next().value as string);

    res.json({ commentary, mood });
  } catch {
    res.json({
      commentary:
        "My weather circuits are napping. Look out the window?",
      mood: "deadpan",
    });
  }
}
