import { getConditionLabel } from "../_shared/wmo-codes.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);

  if (isNaN(lat) || isNaN(lon)) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set(
      "daily",
      "temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,wind_speed_10m_max,uv_index_max"
    );
    url.searchParams.set(
      "hourly",
      "temperature_2m,weather_code,precipitation_probability,wind_speed_10m"
    );
    url.searchParams.set("wind_speed_unit", "kmh");
    url.searchParams.set("temperature_unit", "celsius");
    url.searchParams.set("forecast_days", "7");

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Open-Meteo error: ${response.status}`);

    const data = (await response.json()) as {
      daily: {
        time: string[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        weather_code: number[];
        precipitation_sum: number[];
        wind_speed_10m_max: number[];
        uv_index_max: number[];
      };
      hourly: {
        time: string[];
        temperature_2m: number[];
        weather_code: number[];
        precipitation_probability: number[];
        wind_speed_10m: number[];
      };
    };

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const daily = data.daily.time.map((date, i) => ({
      date,
      dayLabel:
        i === 0 ? "Today" : dayNames[new Date(date + "T12:00:00").getDay()],
      tempMax: Math.round(data.daily.temperature_2m_max[i]),
      tempMin: Math.round(data.daily.temperature_2m_min[i]),
      weatherCode: data.daily.weather_code[i],
      conditionLabel: getConditionLabel(data.daily.weather_code[i]),
      precipitationSum: data.daily.precipitation_sum[i],
      windSpeedMax: Math.round(data.daily.wind_speed_10m_max[i]),
      uvIndexMax: Math.round(data.daily.uv_index_max[i]),
    }));

    const now = new Date();
    const hourly = data.hourly.time
      .map((time, i) => ({
        time,
        temperature: Math.round(data.hourly.temperature_2m[i]),
        weatherCode: data.hourly.weather_code[i],
        precipitationProbability: data.hourly.precipitation_probability[i],
        windSpeed: Math.round(data.hourly.wind_speed_10m[i]),
      }))
      .filter((h) => new Date(h.time) >= now)
      .slice(0, 24);

    res.json({ daily, hourly });
  } catch {
    res.status(500).json({ error: "Failed to fetch forecast" });
  }
}
