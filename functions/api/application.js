const RECIPIENT = "hello@felixfeger.com";
const APPLICATION_FIELDS = {
  "Citizenship Application": ["citizenshipStatement", "additionalComments"],
  "Green Card Application": ["residenceReason", "plans", "additionalComments"],
  "Passport Application": ["travelReason", "additionalComments"]
};

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid request body." }, 400);

  const applicationType = clean(body.applicationType, 80);
  const allowedFields = APPLICATION_FIELDS[applicationType];
  const name = clean(body.name, 120);
  const email = clean(body.email, 254);
  if (!allowedFields || !name || !validEmail(email)) {
    return json({ error: "Application type, name, and valid email are required." }, 400);
  }

  const responses = allowedFields
    .map((field) => [field, clean(body[field], 2000)])
    .filter(([, value]) => value);
  if (responses.length === 0) {
    return json({ error: "Please complete the application survey." }, 400);
  }

  const result = await sendEmail(env, {
    to: RECIPIENT,
    reply_to: email,
    subject: `RSA ${applicationType}`,
    text: [
      `Name: ${name}`,
      `Email: ${email}`,
      ...responses.map(([field, value]) => `${label(field)}: ${value}`)
    ].join("\n")
  });
  if (!result.ok) return json({ error: "Unable to send application." }, 502);
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

function label(value) {
  return String(value)
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
}

function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}
