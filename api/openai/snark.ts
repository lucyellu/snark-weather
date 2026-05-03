const SNARK_MOODS = [
  "disappointed",
  "disgusted",
  "gleeful",
  "ominous",
  "condescending",
  "existential",
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

  const systemPrompt = `You are SNARK, a sarcastic weather AI with the personality of a grumpy, slightly unhinged radio meteorologist who deeply resents having to report weather. You're like CARROT Weather's evil twin. Generate a 3–5 sentence daily weather briefing that covers current conditions, the day's expected range, precipitation outlook, and anything else the user should know before leaving the house. Be darkly funny, condescending, and dry — but the information must be genuinely accurate and useful. No markdown, no bullet points, no line breaks. Speak in flowing prose as if it's a morning radio segment. Use dry wit and light flavourful phrases. Never be encouraging. Always find something to complain about. All temperatures in Celsius. Current mood: ${mood}.`;

  const userPrompt = `Generate a snarky daily weather briefing for ${city}. Right now: ${conditionLabel}, ${Math.round(temperature)}°C (feels like ${feelsLike !== undefined ? Math.round(feelsLike) : "?"}°C), humidity ${humidity}%, wind ${Math.round(windSpeed)} km/h, UV index ${uvIndex}, ${isDay ? "daytime" : "nighttime"}${precipitation ? `, ${precipitation} mm precipitation` : ""}${forecastDetails ? `. Forecast: ${forecastDetails}` : ""}. Write a flowing 3–5 sentence morning briefing the listener can hear while getting ready. Keep it informative but withering.`;

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        max_tokens: 350,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) throw new Error(`DeepSeek error: ${response.status}`);

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const commentary =
      data.choices[0]?.message?.content ??
      "The weather exists. How disappointing for everyone.";

    res.json({ commentary, mood });
  } catch {
    res.json({
      commentary:
        "My circuits are too disgusted by this weather to comment. You're on your own.",
      mood: "disgusted",
    });
  }
}
