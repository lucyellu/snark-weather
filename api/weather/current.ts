import { getConditionLabel } from "../_shared/wmo-codes.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);
  const city = req.query.city as string | undefined;

  if (isNaN(lat) || isNaN(lon)) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set(
      "current",
      "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,uv_index,visibility,precipitation,weather_code,is_day"
    );
    url.searchParams.set("wind_speed_unit", "kmh");
    url.searchParams.set("temperature_unit", "celsius");
    url.searchParams.set("timezone", "auto");

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Open-Meteo error: ${response.status}`);

    const data = (await response.json()) as {
      timezone: string;
      current: {
        temperature_2m: number;
        apparent_temperature: number;
        relative_humidity_2m: number;
        wind_speed_10m: number;
        wind_direction_10m: number;
        uv_index: number;
        visibility: number;
        precipitation: number;
        weather_code: number;
        is_day: number;
      };
    };

    const c = data.current;
    res.json({
      timezone: data.timezone,
      city: city ?? `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
      lat,
      lon,
      temperature: Math.round(c.temperature_2m),
      feelsLike: Math.round(c.apparent_temperature),
      humidity: Math.round(c.relative_humidity_2m),
      windSpeed: Math.round(c.wind_speed_10m),
      windDirection: Math.round(c.wind_direction_10m),
      uvIndex: Math.round(c.uv_index),
      visibility: Math.round(c.visibility / 1000),
      precipitation: c.precipitation,
      weatherCode: c.weather_code,
      conditionLabel: getConditionLabel(c.weather_code),
      isDay: c.is_day === 1,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
}
