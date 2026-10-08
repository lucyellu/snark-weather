import type { Config } from "@netlify/functions";
import current from "../../api/weather/current";
import forecast from "../../api/weather/forecast";
import geocode from "../../api/weather/geocode";
import search from "../../api/weather/search";
import snark from "../../api/openai/snark";

type Handler = (req: any, res: any) => Promise<void> | void;

const routes: Record<string, Handler> = {
  "/api/weather/current": current,
  "/api/weather/forecast": forecast,
  "/api/weather/geocode": geocode,
  "/api/weather/search": search,
  "/api/openai/snark": snark,
};

// Adapts the Vercel-style (req, res) handlers in /api to Netlify's Request/Response.
export default async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const handler = routes[url.pathname.replace(/\/$/, "")];
  if (!handler) return Response.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.json().catch(() => undefined);
  }
  const req = {
    method: request.method,
    query: Object.fromEntries(url.searchParams),
    body,
  };

  return new Promise<Response>((resolve) => {
    let status = 200;
    const res = {
      status(code: number) {
        status = code;
        return res;
      },
      json(data: unknown) {
        resolve(Response.json(data, { status }));
      },
    };
    Promise.resolve(handler(req, res)).catch(() =>
      resolve(Response.json({ error: "Internal error" }, { status: 500 })),
    );
  });
};

export const config: Config = { path: "/api/*" };
