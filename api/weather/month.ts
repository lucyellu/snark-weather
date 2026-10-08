import { getConditionLabel } from "../_shared/wmo-codes.js";

// GET /api/weather/month?lat=..&lon=..&year=2026&month=10
// Daily weather for every day of the month that Open-Meteo can answer for: the
// archive for older months, past_days + the 16-day forecast for the current window.
// Days it cannot cover (e.g. far-future months) are simply left out.

interface Daily {
  time: string[];
  weather_code: (number | null)[];
  temperature_2m_max: (number | null)[];
  temperature_2m_min: (number | null)[];
}

const pad = (n: number) => String(n).padStart(2, "0");

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);
  const year = parseInt(req.query.year as string, 10);
  const month = parseInt(req.query.month as string, 10);
  if (isNaN(lat) || isNaN(lon) || !(year >= 1940 && year <= 2100) || !(month >= 1 && month <= 12)) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const first = `${year}-${pad(month)}-01`;
  const last = `${year}-${pad(month)}-${pad(lastDay)}`;

  // The forecast endpoint reaches 92 days back; the archive is better for anything older.
  const daysAgo = (Date.now() - Date.UTC(year, month, 0)) / 86_400_000;
  const useArchive = daysAgo > 85;

  try {
    const url = new URL(useArchive ? "https://archive-api.open-meteo.com/v1/archive" : "https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min");
    url.searchParams.set("temperature_unit", "celsius");
    url.searchParams.set("timezone", "auto");
    if (useArchive) {
      url.searchParams.set("start_date", first);
      url.searchParams.set("end_date", last);
    } else {
      url.searchParams.set("past_days", "92");
      url.searchParams.set("forecast_days", "16");
    }

    const response = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`Open-Meteo error: ${response.status}`);
    const data = (await response.json()) as { daily: Daily };

    const days = data.daily.time
      .map((date, i) => ({
        date,
        weatherCode: data.daily.weather_code[i],
        tempMax: data.daily.temperature_2m_max[i],
        tempMin: data.daily.temperature_2m_min[i],
      }))
      .filter((d) => d.date >= first && d.date <= last && d.weatherCode !== null && d.tempMax !== null && d.tempMin !== null)
      .map((d) => ({
        date: d.date,
        weatherCode: d.weatherCode as number,
        conditionLabel: getConditionLabel(d.weatherCode as number),
        tempMax: Math.round(d.tempMax as number),
        tempMin: Math.round(d.tempMin as number),
      }));

    res.json({ year, month, days });
  } catch {
    res.status(500).json({ error: "Failed to fetch monthly weather" });
  }
}
