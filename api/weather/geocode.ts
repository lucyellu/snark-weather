export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const city = req.query.city as string | undefined;

  if (!city || city.trim().length === 0) {
    res.status(400).json({ error: "City parameter is required" });
    return;
  }

  try {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", city);
    url.searchParams.set("count", "1");
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Geocoding error: ${response.status}`);

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
  } catch {
    res.status(500).json({ error: "Failed to geocode city" });
  }
}
