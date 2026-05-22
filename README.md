# Republic States of America Website

Static multi-page website for the fictional Republic States of America government portal.

## Pages

- `index.html`
- `services.html`
- `visiting.html`
- `about.html`
- `official-websites.html`
- `cbp.html`
- `contact.html`
- `search.html`
- `citizenship.html`
- `greencard.html`
- `passport.html`

## Contact backend

`worker.js` contains a Cloudflare Worker that sends contact emails and OTP-protected application forms through Resend. The contact page does not require OTP. Citizenship, green card, and passport applications do require OTP.

Required Worker bindings and secrets:

- `RESEND_API_KEY`
- `OTP_CODES`, a Cloudflare KV namespace for application OTP verification

Name the Worker file `worker.js`. The contact page and application pages are configured to call `https://workername.felixfeger46.workers.dev`.
