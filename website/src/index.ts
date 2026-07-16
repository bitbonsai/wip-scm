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
  const email = parsed.data.email.toLowerCase().trim();
  try {
    await db.insert(signups).values({ email }).onConflictDoNothing();
  } catch {
    return c.json({ ok: false, error: "storage error" }, 500);
  }

  if (process.env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? "wip <rfc@wip-scm.org>",
        to: [email],
        subject: "You're on the wip list",
        text: "Sealed. You'll get one email when there is a binary. Nothing else, ever.\n\n— wip-scm.org",
      }),
    }).catch(() => null);
    if (!res?.ok) {
      return c.json({ ok: false, error: "email send failed" }, 502);
    }
  }

  return c.json({ ok: true });
});

app.use("/*", serveStatic({ root: "./public" }));

export default {
  port: Number(process.env.PORT ?? 9010),
  fetch: app.fetch,
};

console.log(`wip-scm.org dev server → http://localhost:${process.env.PORT ?? 9010}`);
