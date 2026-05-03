# snark-weather

A snarky AI-powered weather app inspired by [CARROT Weather](https://www.meetcarrot.com/weather/). Built with Replit.

SNARK is your grumpy, slightly unhinged radio meteorologist who deeply resents having to report weather. Every forecast comes with a darkly funny, condescending 3–5 sentence briefing — accurate information delivered with maximum withering commentary.

## Features

- Current conditions — temperature, feels like, humidity, wind, UV index, visibility
- Hourly and 7-day forecast
- AI-generated snarky weather briefing (powered by DeepSeek) with randomized moods: disappointed, gleeful, ominous, condescending, existential...
- Text-to-speech so SNARK can read the briefing aloud
- City search + browser geolocation
- 6 pastel color themes (Peach, Blush, Tangerine, Mint, Sky, Lavender)
- Commentary cached in localStorage so SNARK doesn't repeat themselves on refresh

## Stack

- **Frontend**: React + TypeScript + Tailwind + Framer Motion
- **Backend**: Express 5 + TypeScript
- **Weather data**: [Open-Meteo](https://open-meteo.com/) (free, no API key required)
- **Snark engine**: DeepSeek API
- **Monorepo**: pnpm workspaces

## Running locally

```bash
# Install dependencies
pnpm install

# Start the API server
pnpm --filter @workspace/api-server run dev

# In another terminal, start the frontend
pnpm --filter @workspace/weather-app run dev
```

Set `DEEPSEEK_API_KEY` in your environment (or a `.env` file in `artifacts/api-server/`) to enable the snark commentary. Without it, SNARK falls back to a canned insult.
