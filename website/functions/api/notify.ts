// Cloudflare Pages Function — POST /api/notify
// Stores the subscriber as a Resend contact (global contacts model) and
// sends the confirmation email.
// Env var (set in CF Pages dashboard, encrypted): RESEND_API_KEY

interface Env {
  RESEND_API_KEY: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.toLowerCase().trim() ?? "";
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return Response.json({ ok: false, error: "invalid email" }, { status: 400 });
  }

  const headers = {
    Authorization: `Bearer ${env.RESEND_API_KEY}`,
    "Content-Type": "application/json",
  };

  const contact = await fetch("https://api.resend.com/contacts", {
    method: "POST",
    headers,
    body: JSON.stringify({ email, unsubscribed: false }),
  }).catch(() => null);
  // 409 = already a contact, fine
  if (!contact || (!contact.ok && contact.status !== 409)) {
    return Response.json({ ok: false, error: "storage error" }, { status: 502 });
  }

  const sent = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify({
      from: "wip <rfc@wip-scm.org>",
      to: [email],
      subject: "You're on the wip list",
      text: "Sealed. You'll get one email when there is a binary. Nothing else, ever.\n\n— wip-scm.org",
    }),
  }).catch(() => null);
  if (!sent?.ok) {
    return Response.json({ ok: false, error: "email send failed" }, { status: 502 });
  }

  return Response.json({ ok: true });
}
