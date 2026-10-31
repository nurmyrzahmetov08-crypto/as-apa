// Админ-панельге арналған API: жауаптар тізімі және өшіру (құпия сөзбен)
import { getStore } from "@netlify/blobs";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

function safeEqual(a, b) {
  a = String(a); b = String(b);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export default async (req) => {
  const secret = Netlify.env.get("ADMIN_PASSWORD");
  if (!secret) return json({ ok: false, error: "no_password_set" }, 500);

  const auth = req.headers.get("authorization") || "";
  const given = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!given || !safeEqual(given, secret)) {
    await new Promise((r) => setTimeout(r, 800)); // құпия сөзді теруді баяулату
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  const store = getStore({ name: "rsvp", consistency: "strong" });

  if (req.method === "GET") {
    const { blobs } = await store.list();
    const items = (await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })))).filter(Boolean);
    items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return json({ ok: true, items });
  }

  if (req.method === "DELETE") {
    const id = new URL(req.url).searchParams.get("id");
    if (!id || !/^[\w-]{5,40}$/.test(id)) return json({ ok: false, error: "bad_id" }, 400);
    await store.delete(id);
    return json({ ok: true });
  }

  return json({ ok: false, error: "method" }, 405);
};

export const config = { path: "/api/admin" };
