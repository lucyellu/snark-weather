import { Router } from "express";
import { z } from "zod/v4";
import {
  GetCurrentWeatherQueryParams,
  GetWeatherForecastQueryParams,
  GeocodeCityQueryParams,
} from "@workspace/api-zod";

const router = Router();

const WMO_CODES: Record<number, string> = {
  0: "Clear Sky",
  1: "Mainly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Icy Fog",
  51: "Light Drizzle",
  53: "Drizzle",
  55: "Heavy Drizzle",
  61: "Light Rain",
  63: "Rain",
  65: "Heavy Rain",
  71: "Light Snow",
  73: "Snow",
  75: "Heavy Snow",
  77: "Snow Grains",
  80: "Light Showers",
  81: "Showers",
  82: "Heavy Showers",
  85: "Snow Showers",
  86: "Heavy Snow Showers",
  95: "Thunderstorm",
  96: "Thunderstorm with Hail",
  99: "Severe Thunderstorm",
};

function getConditionLabel(code: number): string {
  return WMO_CODES[code] ?? "Unknown";
}

router.get("/current", async (req, res) => {
  const parsed = GetCurrentWeatherQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  const { lat, lon, city } = parsed.data;

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

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Open-Meteo error: ${response.status}`);
    }

    const data = (await response.json()) as {
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
  } catch (err) {
    req.log.error({ err }, "Failed to fetch weather");
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

router.get("/forecast", async (req, res) => {
  const parsed = GetWeatherForecastQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  const { lat, lon } = parsed.data;

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
    if (!response.ok) {
      throw new Error(`Open-Meteo error: ${response.status}`);
    }

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
      dayLabel: i === 0 ? "Today" : dayNames[new Date(date + "T12:00:00").getDay()],
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
  } catch (err) {
    req.log.error({ err }, "Failed to fetch forecast");
    res.status(500).json({ error: "Failed to fetch forecast" });
  }
});

router.get("/geocode", async (req, res) => {
  const parsed = GeocodeCityQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  const { city } = parsed.data;

  try {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", city);
    url.searchParams.set("count", "1");
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Geocoding error: ${response.status}`);
    }

    const data = (await response.json()) as {
      results?: Array<{
        name: string;
        latitude: number;
        longitude: number;
        country: string;
      }>;
    };

    if (!data.results || data.results.length === 0) {
      res.status(404).json({ error: "City not found" });
      return;
    }

    const result = data.results[0];
    res.json({
      city: result.name,
      lat: result.latitude,
      lon: result.longitude,
      country: result.country,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to geocode city");
    res.status(500).json({ error: "Failed to geocode city" });
  }
});

export default router;
