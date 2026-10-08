import { Router } from "express";
import OpenAI from "openai";
import { GenerateSnarkBody } from "@workspace/api-zod";

const llm = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "missing-key",
  baseURL: "https://api.groq.com/openai/v1",
});

const router = Router();

const SNARK_MOODS = [
  "deadpan",
  "cheerfully smug",
  "mock-dramatic",
  "dryly amused",
  "playfully sarcastic",
  "wry",
];

router.post("/snark", async (req, res) => {
  const parsed = GenerateSnarkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
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
  } = parsed.data;

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
    const response = await llm.chat.completions.create({
      model: process.env.GROQ_MODEL ?? "openai/gpt-oss-20b",
      max_tokens: 400,
      reasoning_effort: "low",
      temperature: 0.9,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const commentary = response.choices[0]?.message?.content?.trim() ?? "The weather exists. Make of that what you will.";

    res.json({ commentary, mood });
  } catch (err) {
    req.log.error({ err }, "Failed to generate snark");
    res.json({
      commentary: "My weather circuits are napping. Look out the window?",
      mood: "deadpan",
    });
  }
});

export default router;
