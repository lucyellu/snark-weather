# snark-weather

**[Try it live →](https://snark-weather.netlify.app/)**

A snarky AI-powered weather app inspired by [CARROT Weather](https://www.meetcarrot.com/weather/). Built with Replit.

SNARK is your grumpy, slightly unhinged radio meteorologist who deeply resents having to report weather. Every forecast comes with a single short, witty line — accurate, useful, and a little cheeky.

## Screenshots

<p align="center">
  <img src="snark_screenshot (2).jpg" alt="Desktop view" width="100%" />
</p>

<p align="center">
  <img src="snark_screenshot (1).jpg" alt="Mobile view — full scroll" width="30%" />
  &nbsp;&nbsp;&nbsp;
  <img src="snark_screenshot (4).jpg" alt="Mobile view — hero" width="30%" />
  &nbsp;&nbsp;&nbsp;
  <img src="snark_screenshot (3).jpg" alt="Desktop view — hero" width="30%" />
</p>

## Features

- Current conditions — temperature, feels like, humidity, wind, UV index, visibility
- Hourly and 7-day forecast
- One-liner AI weather quip (powered by Pollinations, no API key) with randomized tones: deadpan, smug, mock-dramatic, wry...
- Text-to-speech so SNARK can read the briefing aloud
- City search with a picker (shows region, country and local time, so you get the right Vancouver) + browser geolocation
- Settings: choose the timezone used for the clock, date and hourly forecast
- 6 pastel color themes (Peach, Blush, Tangerine, Hunter green, Sky, Lilac)
- Commentary cached in localStorage so SNARK doesn't repeat themselves on refresh

## Stack

- **Frontend**: React + TypeScript + Tailwind + Framer Motion
- **Backend**: Express 5 + TypeScript
- **Weather data**: [Open-Meteo](https://open-meteo.com/) (free, no API key required)
- **Snark engine**: [Pollinations](https://pollinations.ai) free text API (no key needed)
- **Hosting**: Netlify (static site + one function wrapping `api/`)
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

Quips come from Pollinations' free keyless endpoint, which rate-limits anonymous callers. For reliable output set an optional `GROQ_API_KEY` (free tier) as a backup provider.

## Running locally

```
pnpm install
launch-snark-weather.bat # Windows: API on :8787, web on :5173
```

## Deploying

Netlify builds from `netlify.toml`. No environment variables are required.
