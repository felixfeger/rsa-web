const MAIL_FROM = "Republic States Government <noreply@republicstates.xyz>";
const CONTACT_TO = "felix@citymetro.xyz";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return cors(new Response(null, { status: 204 }));
    }

    if (url.pathname === "/contact" && request.method === "POST") {
      const body = await request.json();
      const name = clean(body.name);
      const email = clean(body.email);
      const topic = clean(body.topic);
      const messageBody = clean(body.message);

      if (!name || !email || !email.includes("@") || !topic || !messageBody) {
        return cors(json({ error: "Name, email, topic, and message are required." }, 400));
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
      const email = clean(body.email).toLowerCase();
      const otp = clean(body.otp);
      const expected = env.OTP_CODES ? await env.OTP_CODES.get(email) : null;

      if (!expected || expected !== otp) {
        return cors(json({ error: "Invalid or expired OTP code." }, 401));
      }

      const applicationType = clean(body.applicationType) || "Application";
      const lines = Object.entries(body)
        .filter(([key]) => !["otp"].includes(key))
        .map(([key, value]) => `${label(key)}: ${clean(value)}`);

      const resendResponse = await sendEmail(env, {
        to: CONTACT_TO,
        reply_to: email,
        subject: `RSA ${applicationType}`,
        text: lines.join("\n")
      });

      if (!resendResponse.ok) {
        return cors(json({ error: "Unable to send application." }, 502));
      }

      await env.OTP_CODES.delete(email);
      return cors(json({ ok: true }));
    }

    if (url.pathname === "/verify-otp" && request.method === "POST") {
      const { email, otp } = await request.json();
      const normalizedEmail = String(email || "").trim().toLowerCase();
      const expected = env.OTP_CODES ? await env.OTP_CODES.get(normalizedEmail) : null;

      if (!expected || expected !== String(otp || "").trim()) {
        return cors(json({ error: "Invalid or expired OTP code." }, 401));
      }

      return cors(json({ ok: true }));
    }

    if (url.pathname === "/request-otp" && request.method === "POST") {
      const { email } = await request.json();
      if (!email || !String(email).includes("@")) {
        return cors(json({ error: "A valid email is required." }, 400));
      }
      if (!env.OTP_CODES) {
        return cors(json({ error: "OTP storage is not configured." }, 500));
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const code = String(Math.floor(100000 + Math.random() * 900000));
      await env.OTP_CODES.put(normalizedEmail, code, { expirationTtl: 600 });

      const resendResponse = await sendEmail(env, {
        to: normalizedEmail,
        subject: "Your Republic States verification code",
        text: `Your Republic States Government verification code is ${code}. It expires in 10 minutes.`
      });

      if (!resendResponse.ok) {
        return cors(json({ error: "Unable to send OTP email." }, 502));
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
      from: MAIL_FROM,
      ...payload
    })
  });
}

function clean(value) {
  return String(value || "").trim();
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
