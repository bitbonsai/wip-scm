import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { z } from "zod";
import { db, signups } from "./db";

const app = new Hono();

const notifySchema = z.object({
  email: z.string().email().max(254),
});

app.post("/api/notify", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = notifySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ ok: false, error: "invalid email" }, 400);
  }
  try {
    await db
      .insert(signups)
      .values({ email: parsed.data.email.toLowerCase().trim() })
      .onConflictDoNothing();
  } catch {
    return c.json({ ok: false, error: "storage error" }, 500);
  }
  return c.json({ ok: true });
});

app.use("/*", serveStatic({ root: "./public" }));

export default {
  port: Number(process.env.PORT ?? 9010),
  fetch: app.fetch,
};

console.log(`wip-scm.org dev server → http://localhost:${process.env.PORT ?? 9010}`);
