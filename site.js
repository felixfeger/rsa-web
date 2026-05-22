const pages = [
  { title: "Home", url: "index.html", description: "Republic States of America government portal, services, travel, and official site guidance.", keywords: "home government republic states rsa rs services visiting official websites contact" },
  { title: "All Government Services", url: "services.html", description: "Find services for identity records, permits, benefits, taxes, public safety, and civic requests.", keywords: "services permits benefits taxes records public safety licenses applications" },
  { title: "Visiting the Republic States", url: "visiting.html", description: "Visitor information for travel, ports of entry, parks, roads, and public transportation.", keywords: "visiting travel tourism entry transportation parks california" },
  { title: "About the Republic States", url: "about.html", description: "Learn about the Republic States, its capital, institutions, and public purpose.", keywords: "about republic states america rsa death star city government" },
  { title: "Official Websites", url: "official-websites.html", description: "Check official Republic States and City Metro domains.", keywords: "official websites republicstates.xyz citymetro.xyz security domains government" },
  { title: "Contact Us", url: "contact.html", description: "Contact the Republic States Government without an OTP code for general messages.", keywords: "contact resend email support message" },
  { title: "Citizenship Application", url: "citizenship.html", description: "Apply for Republic States citizenship with email OTP access.", keywords: "citizenship application otp resident nationality" },
  { title: "Green Card Application", url: "greencard.html", description: "Apply for Republic States permanent resident status with email OTP access.", keywords: "green card greencard permanent resident application otp" },
  { title: "Passport Application", url: "passport.html", description: "Apply for a Republic States passport with email OTP access.", keywords: "passport travel document application otp" }
];

const officialWebsites = {
  "lcpolice.wordpress.com": "Lego City Police Department, Lego City, Republic States",
  "lcsdonline.wordpress.com": "Lego City Sheriff's Department, Lego City County, Republic States",
  "republicstatesgov.xyz": "Republic States of America Official Website, RSA"
};
const automaticOfficialDomains = ["citymetro.xyz", "republicstates.xyz"];

function setupBanner() {
  const banner = document.querySelector(".official-banner");
  const button = document.querySelector(".banner-button");
  if (!banner || !button) return;
  button.addEventListener("click", () => {
    const expanded = banner.getAttribute("aria-expanded") === "true";
    banner.setAttribute("aria-expanded", String(!expanded));
    button.setAttribute("aria-expanded", String(!expanded));
  });
}

function runSearch(query, target) {
  const q = query.trim().toLowerCase();
  target.innerHTML = "";
  if (!q) return;
  const matches = pages.filter((page) => {
    const haystack = `${page.title} ${page.description} ${page.keywords}`.toLowerCase();
    return haystack.includes(q) || q.split(/\s+/).every((part) => haystack.includes(part));
  });
  target.innerHTML = matches.length ? matches.map((page) => `<article class="result-item"><h3><a href="${page.url}">${page.title}</a></h3><p>${page.description}</p></article>`).join("") : `<p>No results found for <strong>${query}</strong>.</p>`;
}

function setupSearch() {
  document.querySelectorAll("[data-site-search]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = form.querySelector("input[type='search']");
      const query = input?.value || "";
      const localResults = document.querySelector("[data-search-results]");
      if (localResults) return runSearch(query, localResults);
      window.location.href = `search.html?q=${encodeURIComponent(query)}`;
    });
  });
  const results = document.querySelector("[data-search-results]");
  const input = document.querySelector("[data-search-input]");
  if (results && input) {
    const query = new URLSearchParams(window.location.search).get("q") || "";
    input.value = query;
    runSearch(query, results);
  }
}

function setupContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;
  const status = form.querySelector(".form-status");
  const submitButton = form.querySelector("[data-submit-contact]");
  const workerUrl = form.dataset.workerUrl || "";
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    if (!workerUrl) return status.textContent = "Contact backend URL is missing.";
    submitButton.disabled = true;
    status.textContent = "Sending message...";
    try {
      const response = await fetch(`${workerUrl}/contact`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error("Message could not be sent.");
      form.reset();
      status.textContent = "Message sent. Thank you for contacting the Republic States Government.";
    } catch (error) { status.textContent = error.message; }
    finally { submitButton.disabled = false; }
  });
}

function setupApplicationForms() {
  document.querySelectorAll("[data-application-page]").forEach((page) => {
    const workerUrl = page.dataset.workerUrl || "";
    const type = page.dataset.applicationType || "Application";
    const emailInput = page.querySelector("[data-otp-email]");
    const otpInput = page.querySelector("[data-otp-code]");
    const requestButton = page.querySelector("[data-request-application-otp]");
    const verifyButton = page.querySelector("[data-verify-application-otp]");
    const applicationForm = page.querySelector("[data-application-form]");
    const status = page.querySelector("[data-application-status]");
    const emailHidden = page.querySelector("[data-application-email]");
    const otpHidden = page.querySelector("[data-application-otp]");

    requestButton?.addEventListener("click", async () => {
      const email = emailInput.value.trim();
      if (!email) return status.textContent = "Enter your email address first.";
      requestButton.disabled = true; status.textContent = "Sending OTP code...";
      try {
        const response = await fetch(`${workerUrl}/request-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
        if (!response.ok) throw new Error("Could not send the OTP code.");
        status.textContent = "Check your email for a six-digit code.";
      } catch (error) { status.textContent = error.message; }
      finally { requestButton.disabled = false; }
    });

    verifyButton?.addEventListener("click", async () => {
      const email = emailInput.value.trim();
      const otp = otpInput.value.trim();
      if (!email || !otp) return status.textContent = "Enter your email and OTP code.";
      verifyButton.disabled = true; status.textContent = "Verifying OTP code...";
      try {
        const response = await fetch(`${workerUrl}/verify-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, otp }) });
        if (!response.ok) throw new Error("Invalid or expired OTP code.");
        emailHidden.value = email; otpHidden.value = otp; applicationForm.hidden = false;
        status.textContent = `${type} unlocked. Complete the form below.`;
      } catch (error) { status.textContent = error.message; }
      finally { verifyButton.disabled = false; }
    });

    applicationForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(applicationForm).entries());
      payload.applicationType = type;
      const submitButton = applicationForm.querySelector("button[type='submit']");
      submitButton.disabled = true; status.textContent = "Sending application...";
      try {
        const response = await fetch(`${workerUrl}/application`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error("Application could not be sent.");
        applicationForm.reset(); applicationForm.hidden = true; otpInput.value = "";
        status.textContent = "Application sent. Thank you.";
      } catch (error) { status.textContent = error.message; }
      finally { submitButton.disabled = false; }
    });
  });
}

function normalizeWebsite(value) {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "";
  try { return new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`).hostname.replace(/^www\./, ""); }
  catch { return trimmed.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]; }
}

function setupOfficialChecker() {
  const form = document.querySelector("[data-official-checker]");
  const status = document.querySelector("[data-checker-status]");
  if (!form || !status) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const domain = normalizeWebsite(form.website.value || "");
    const automatic = automaticOfficialDomains.some((root) => domain === root || domain.endsWith(`.${root}`));
    const description = officialWebsites[domain];
    status.classList.toggle("not-official", !automatic && !description);
    if (automatic) status.textContent = `${domain} is listed as official because it ends with citymetro.xyz or republicstates.xyz. Always double check the full address before sharing information.`;
    else if (description) status.textContent = `${domain} is listed as official: ${description}. Always double check the address before sharing information.`;
    else if (domain) status.textContent = `${domain} is not on this official website list. Do not submit sensitive information unless you can verify it another way.`;
    else status.textContent = "Enter a website address to check.";
  });
}

setupBanner(); setupSearch(); setupContactForm(); setupApplicationForms(); setupOfficialChecker();
