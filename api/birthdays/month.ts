import { allBirthdays } from "../_shared/birthday-book.js";

// GET /api/birthdays/month?month=10  ->  { birthdays: [...] } for that calendar month (any year)
export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const month = parseInt(req.query.month as string, 10);
  if (!(month >= 1 && month <= 12)) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }
  const birthdays = allBirthdays()
    .filter((b) => b.month === month)
    .sort((a, b) => a.day - b.day || a.name.localeCompare(b.name));
  res.json({ birthdays });
}
