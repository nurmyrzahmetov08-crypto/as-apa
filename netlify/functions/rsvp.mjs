// Қонақтың жауабын қабылдап, Netlify Blobs базасына сақтайды
import { getStore } from "@netlify/blobs";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

const clean = (v, max) =>
  String(v ?? "").replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

export default async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "method" }, 405);

  let body = {};
  const type = req.headers.get("content-type") || "";
  try {
    if (type.includes("application/json")) body = await req.json();
    else body = Object.fromEntries(new URLSearchParams(await req.text()));
  } catch {
    return json({ ok: false, error: "bad_request" }, 400);
  }

  // Спам-тұзақ: бос болуы тиіс
  if (body.company) return json({ ok: true });

  const fullname = clean(body.fullname, 80);
  const attend = body.attend === "Келемін" ? "Келемін" : body.attend === "Келе алмаймын" ? "Келе алмаймын" : "";
  let guests = parseInt(body.guests, 10);
  if (!Number.isFinite(guests)) guests = 0;
  guests = attend === "Келемін" ? Math.min(20, Math.max(1, guests)) : 0;
  const phone = clean(body.phone, 20);
  const note = clean(body.note, 300);
  const invited = clean(body.invited, 60);

  if (fullname.length < 2 || !attend) return json({ ok: false, error: "validation" }, 422);

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const entry = { id, fullname, attend, guests, phone, note, invited, createdAt: new Date().toISOString() };

  const store = getStore({ name: "rsvp", consistency: "strong" });
  await store.setJSON(id, entry);
  return json({ ok: true, id });
};

export const config = { path: "/api/rsvp" };
