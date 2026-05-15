const pages = [
  {
    title: "Home",
    url: "index.html",
    description: "Republic States of America government portal, services, travel, and official site guidance.",
    keywords: "home government republic states rsa rs services visiting official websites contact"
  },
  {
    title: "All Government Services",
    url: "services.html",
    description: "Find services for identity records, permits, benefits, taxes, public safety, and civic requests.",
    keywords: "services permits benefits taxes records public safety licenses"
  },
  {
    title: "Visiting the Republic States",
    url: "visiting.html",
    description: "Visitor information for travel, ports of entry, parks, roads, and public transportation.",
    keywords: "visiting travel tourism entry transportation parks california"
  },
  {
    title: "About the Republic States",
    url: "about.html",
    description: "Learn about the Republic States, its capital, institutions, and public purpose.",
    keywords: "about republic states america rsa death star city government"
  },
  {
    title: "Official Websites",
    url: "official-websites.html",
    description: "How to identify official Republic States government websites ending in republicstates.xyz.",
    keywords: "official websites republicstates.xyz security domains government"
  },
  {
    title: "Contact Us",
    url: "contact.html",
    description: "Contact the Republic States Government and request an email OTP verification code.",
    keywords: "contact resend otp email verification support"
  }
];

const officialWebsites = {
  "citymetro.xyz": "City Metro Transit, State-Owned Public Transit Provider for Lego City County",
  "dot.citymetro.xyz": "Republic States Railways, State Railway Agency/DOT",
  "lccity.republicstates.xyz": "City of Lego City, Republic States",
  "lccounty.republicstates.xyz": "County of Lego City, Republic States",
  "lcpolice.wordpress.com": "Lego City Police Department, Lego City, Republic States",
  "lcsdonline.wordpress.com": "Lego City Sheriff's Department, Lego City County, Republic States",
  "republicstatesgov.xyz": "Republic States of America Official Website, RSA",
  "rhp.republicstates.xyz": "Republic Highway Patrol, Federal Police, RSA",
  "police.citymetro.xyz": "City Metro Transit Police",
  "fire.republicstates.xyz": "Republic States Fire Dept and Lego City County Fire Dept.",
  "airport.citymetro.xyz": "Felix Lego City International Airport"
};

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

  target.innerHTML = matches.length
    ? matches.map((page) => `
        <article class="result-item">
          <h3><a href="${page.url}">${page.title}</a></h3>
          <p>${page.description}</p>
        </article>
      `).join("")
    : `<p>No results found for <strong>${query}</strong>.</p>`;
}

function setupSearch() {
  document.querySelectorAll("[data-site-search]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = form.querySelector("input[type='search']");
      const query = input?.value || "";
      const localResults = document.querySelector("[data-search-results]");
      if (localResults) {
        runSearch(query, localResults);
        return;
      }
      window.location.href = `search.html?q=${encodeURIComponent(query)}`;
    });
  });

  const searchPageResults = document.querySelector("[data-search-results]");
  const searchPageInput = document.querySelector("[data-search-input]");
  if (searchPageResults && searchPageInput) {
    const query = new URLSearchParams(window.location.search).get("q") || "";
    searchPageInput.value = query;
    runSearch(query, searchPageResults);
  }
}

function setupContactOtp() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const status = form.querySelector(".form-status");
  const otpStep = form.querySelector("[data-otp-step]");
  const requestButton = form.querySelector("[data-request-otp]");
  const submitButton = form.querySelector("[data-submit-contact]");
  const workerUrl = form.dataset.workerUrl || "";

  requestButton?.addEventListener("click", async () => {
    const email = form.email.value.trim();
    if (!email) {
      status.textContent = "Enter your email address first.";
      return;
    }
    if (!workerUrl || workerUrl.includes("YOUR-WORKER")) {
      status.textContent = "OTP backend is ready in cloudflare-worker.js. Add your deployed Worker URL to enable live email codes.";
      otpStep.hidden = false;
      return;
    }

    requestButton.disabled = true;
    status.textContent = "Sending verification code...";
    try {
      const response = await fetch(`${workerUrl}/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (!response.ok) throw new Error("Could not send code.");
      otpStep.hidden = false;
      status.textContent = "Check your email for a six-digit code.";
    } catch (error) {
      status.textContent = error.message;
    } finally {
      requestButton.disabled = false;
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    if (!workerUrl || workerUrl.includes("YOUR-WORKER")) {
      status.textContent = "Demo mode: your message is ready, but the Worker URL has not been deployed yet.";
      return;
    }

    submitButton.disabled = true;
    status.textContent = "Verifying code and sending message...";
    try {
      const response = await fetch(`${workerUrl}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("Verification failed or message could not be sent.");
      form.reset();
      otpStep.hidden = true;
      status.textContent = "Message sent. Thank you for contacting the Republic States Government.";
    } catch (error) {
      status.textContent = error.message;
    } finally {
      submitButton.disabled = false;
    }
  });
}

function normalizeWebsite(value) {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "";
  try {
    const withProtocol = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    return new URL(withProtocol).hostname.replace(/^www\./, "");
  } catch {
    return trimmed.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}

function setupOfficialChecker() {
  const form = document.querySelector("[data-official-checker]");
  const status = document.querySelector("[data-checker-status]");
  if (!form || !status) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const domain = normalizeWebsite(form.website.value || "");
    const description = officialWebsites[domain];

    status.classList.toggle("not-official", !description);
    if (description) {
      status.textContent = `${domain} is listed as official: ${description}. Always double check the address before sharing information.`;
    } else if (domain) {
      status.textContent = `${domain} is not on this official website list. Do not submit sensitive information unless you can verify it another way.`;
    } else {
      status.textContent = "Enter a website address to check.";
    }
  });
}

setupBanner();
setupSearch();
setupContactOtp();
setupOfficialChecker();
