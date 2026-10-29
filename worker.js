const CONTACT_TO = "hello@felixfeger.com";
const APPLICATION_FIELDS = {
  "Citizenship Application": ["citizenshipStatement", "additionalComments"],
  "Green Card Application": ["residenceReason", "plans", "additionalComments"],
  "Passport Application": ["travelReason", "additionalComments"]
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return cors(new Response(null, { status: 204 }));
    }

    if (url.pathname === "/contact" && request.method === "POST") {
      const body = await request.json();
      const name = clean(body.name, 120);
      const email = clean(body.email, 254);
      const topic = clean(body.topic, 120);
      const messageBody = clean(body.message, 4000);

      if (!name || !validEmail(email) || !topic || !messageBody) {
        return cors(json({ error: "Name, valid email, topic, and message are required." }, 400));
      }

      const message = [
        `Name: ${name}`,
        `Email: ${email}`,
        `Topic: ${topic}`,
        "",
        messageBody
      ].join("\n");

      const resendResponse = await sendEmail(env, {
        to: CONTACT_TO,
        reply_to: email,
        subject: `RSA contact: ${topic}`,
        text: message
      });

      if (!resendResponse.ok) {
        return cors(json({ error: "Unable to send contact message." }, 502));
      }

      return cors(json({ ok: true }));
    }

    if (url.pathname === "/application" && request.method === "POST") {
      const body = await request.json();
      const applicationType = clean(body.applicationType, 80);
      const allowedFields = APPLICATION_FIELDS[applicationType];
      const name = clean(body.name, 120);
      const email = clean(body.email, 254);

      if (!allowedFields || !name || !validEmail(email)) {
        return cors(json({ error: "Application type, name, and valid email are required." }, 400));
      }

      const values = allowedFields
        .map((field) => [field, clean(body[field], 2000)])
        .filter(([, value]) => value);
      if (values.length === 0) {
        return cors(json({ error: "Please complete the application survey." }, 400));
      }

      const lines = [
        `Name: ${name}`,
        `Email: ${email}`,
        ...values.map(([field, value]) => `${label(field)}: ${value}`)
      ];
      const resendResponse = await sendEmail(env, {
        to: CONTACT_TO,
        reply_to: email,
        subject: `RSA ${applicationType}`,
        text: lines.join("\n")
      });

      if (!resendResponse.ok) {
        return cors(json({ error: "Unable to send application." }, 502));
      }

      return cors(json({ ok: true }));
    }

    return cors(json({ error: "Not found." }, 404));
  }
};

async function sendEmail(env, payload) {
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
    headers: { "Content-Type": "application/json" }
  });
}

function cors(response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new Response(response.body, { status: response.status, headers });
}
