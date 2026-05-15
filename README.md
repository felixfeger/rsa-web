# Republic States of America Website

Static multi-page website for the fictional Republic States of America government portal.

## Pages

- `index.html`
- `services.html`
- `visiting.html`
- `about.html`
- `official-websites.html`
- `contact.html`
- `search.html`

## Contact backend

`worker.js` contains a Cloudflare Worker that sends contact emails through Resend. It also keeps an OTP request endpoint for a future specific form; the contact page does not require OTP.

Required Worker bindings and secrets:

- `RESEND_API_KEY`
- `OTP_CODES`, a Cloudflare KV namespace, only needed when the future OTP form is used

Name the Worker file `worker.js`. The contact page is configured to call `https://workername.felixfeger46.workers.dev`.
