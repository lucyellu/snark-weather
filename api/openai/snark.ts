const SNARK_MOODS = [
  "deadpan",
  "cheerfully smug",
  "mock-dramatic",
  "dryly amused",
  "playfully sarcastic",
  "wry",
];

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

  const systemPrompt = `You are SNARK, a witty weather sidekick. Reply with ONE short, funny sentence (max 20 words) about the weather right now, with a useful nudge (umbrella, layers, sunscreen) if relevant. Dry and clever, playful rather than mean or gloomy. No markdown, no emojis, no quotes. Celsius only. Tone: ${mood}.`;

  const userPrompt = `${city}: ${conditionLabel}, ${Math.round(temperature)}°C (feels ${feelsLike !== undefined ? Math.round(feelsLike) : "?"}°C), humidity ${humidity}%, wind ${Math.round(windSpeed)} km/h, UV ${uvIndex}, ${isDay ? "day" : "night"}${precipitation ? `, ${precipitation} mm rain` : ""}${forecastDetails ? `. ${forecastDetails}` : ""}.`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL ?? "openai/gpt-oss-20b",
        max_tokens: 400,
        reasoning_effort: "low",
        temperature: 0.9,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) throw new Error(`Groq error: ${response.status}`);

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const commentary =
      data.choices[0]?.message?.content?.trim() ??
      "The weather exists. Make of that what you will.";

    res.json({ commentary, mood });
  } catch {
    res.json({
      commentary:
        "My weather circuits are napping. Look out the window?",
      mood: "deadpan",
    });
  }
}
