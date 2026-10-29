# Republic States of America Website

Static multi-page website for the fictional Republic States of America government portal.

## Pages

- `index.html`
- `services.html`
- `visiting.html`
- `about.html`
- `official-websites.html`
- `cbp.html`
- `emergency.html`
- `contact.html`
- `search.html`
- `citizenship.html`
- `greencard.html`
- `passport.html`

## Contact and application backend

`worker.js` sends contact messages and application survey responses through Resend to `hello@felixfeger.com`. Application forms collect a name, email address, and the listed survey answers only. The Worker accepts an allowlist of survey fields and does not keep an OTP store.

The application pages link to the hosted Autentik sign-in page at `https://login.republicstates.xyz`. This is a hosted sign-in link; a complete OIDC callback/session flow requires an Autentik OAuth2/OIDC application and its client ID and redirect URI.

Required Worker secret:

- `RESEND_API_KEY`

The contact page and application pages call `https://workername.felixfeger46.workers.dev`.

## Emergency page

Edit `emergency-data.js` to update `emergency.html`.

- Set `noCurrentEmergencies: true` to display "No current emergencies."
- Set `noCurrentEmergencies: false` and edit the `emergencies` list to display active alerts.
