const RECIPIENT = "hello@felixfeger.com";

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid request body." }, 400);

  const name = clean(body.name, 120);
  const email = clean(body.email, 254);
  const topic = clean(body.topic, 120);
  const message = clean(body.message, 4000);

  if (!name || !validEmail(email) || !topic || !message) {
    return json({ error: "Name, valid email, topic, and message are required." }, 400);
  }

  const result = await sendEmail(env, {
    to: RECIPIENT,
    reply_to: email,
    subject: `RSA contact: ${topic}`,
    text: [`Name: ${name}`, `Email: ${email}`, `Topic: ${topic}`, "", message].join("\n")
  });
  if (!result.ok) return json({ error: "Unable to send contact message." }, 502);
  return json({ ok: true });
}

async function sendEmail(env, payload) {
  if (!env.RESEND_API_KEY) return new Response("Email service is not configured.", { status: 500 });
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.MAIL_FROM || "Republic States Project <noreply@republicstates.xyz>",
      ...payload
    })
  });
}

function clean(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}
