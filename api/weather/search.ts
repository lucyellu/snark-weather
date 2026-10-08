// Returns up to 8 matching places so the user can pick the right one
// (e.g. Vancouver, BC vs Vancouver, WA).
export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const q = ((req.query.q as string | undefined) ?? "").trim();
  if (q.length < 2) {
    res.json({ results: [] });
    return;
  }

  try {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", q);
    url.searchParams.set("count", "8");
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Geocoding error: ${response.status}`);

    const data = (await response.json()) as {
      results?: Array<{
        name: string;
        latitude: number;
        longitude: number;
        country?: string;
        admin1?: string;
        timezone?: string;
        population?: number;
      }>;
    };

    res.json({
      results: (data.results ?? []).map((r) => ({
        name: r.name,
        region: r.admin1 ?? null,
        country: r.country ?? null,
        lat: r.latitude,
        lon: r.longitude,
        timezone: r.timezone ?? null,
        population: r.population ?? null,
      })),
    });
  } catch {
    res.status(500).json({ error: "Failed to search places" });
  }
}
