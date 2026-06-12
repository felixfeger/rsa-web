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
    description: "Browse Republic States services by topic, common task, life event, records, benefits, taxes, public safety, business, and civic requests.",
    keywords: "services permits benefits taxes records public safety licenses applications business complaints assistance life events"
  },
  {
    title: "Visiting the Republic States",
    url: "visiting.html",
    description: "Visitor information for travel documents, airport arrivals, customs, transit, parks, public places, roads, and emergency alerts.",
    keywords: "visiting travel tourism entry transportation parks california airport transit rail customs emergency"
  },
  {
    title: "Customs and Immigration",
    url: "cbp.html",
    description: "Customs, border protection, inspection process, restricted items, declarations, port of entry, and immigration visitor guidance.",
    keywords: "cbp customs border immigration visitor entry declaration passport green card citizenship airport restricted prohibited inspection"
  },
  {
    title: "Emergency Information",
    url: "emergency.html",
    description: "Current Republic States emergency alerts, statuses, affected areas, and public safety instructions.",
    keywords: "emergency emergencies alerts status public safety warning advisory evacuation"
  },
  {
    title: "About the Republic States",
    url: "about.html",
    description: "Learn about the fictional Republic States, its capital, government structure, public administration, identity, and website purpose.",
    keywords: "about republic states america rsa death star city government administration capital agencies fictional"
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
    description: "Contact the Republic States Government without an OTP code for general messages.",
    keywords: "contact resend email support message"
  },
  {
    title: "Citizenship Application",
    url: "citizenship.html",
    description: "Apply for Republic States citizenship with email OTP access.",
    keywords: "citizenship application otp resident nationality"
  },
  {
    title: "Green Card Application",
    url: "greencard.html",
    description: "Apply for Republic States permanent resident status with email OTP access.",
    keywords: "green card greencard permanent resident application otp"
  },
  {
    title: "Passport Application",
    url: "passport.html",
    description: "Apply for a Republic States passport with email OTP access.",
    keywords: "passport travel document application otp"
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

function setupContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const status = form.querySelector(".form-status");
  const submitButton = form.querySelector("[data-submit-contact]");
  const workerUrl = form.dataset.workerUrl || "";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    if (!workerUrl) {
      status.textContent = "Contact backend URL is missing.";
      return;
    }

    submitButton.disabled = true;
    status.textContent = "Sending message...";
    try {
      const response = await fetch(`${workerUrl}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("Message could not be sent.");
      form.reset();
      status.textContent = "Message sent. Thank you for contacting the Republic States Government.";
    } catch (error) {
      status.textContent = error.message;
    } finally {
      submitButton.disabled = false;
    }
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
      if (!email) {
        status.textContent = "Enter your email address first.";
        return;
      }
      requestButton.disabled = true;
      status.textContent = "Sending OTP code...";
      try {
        const response = await fetch(`${workerUrl}/request-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        if (!response.ok) throw new Error("Could not send the OTP code.");
        status.textContent = "Check your email for a six-digit code.";
      } catch (error) {
        status.textContent = error.message;
      } finally {
        requestButton.disabled = false;
      }
    });

    verifyButton?.addEventListener("click", async () => {
      const email = emailInput.value.trim();
      const otp = otpInput.value.trim();
      if (!email || !otp) {
        status.textContent = "Enter your email and OTP code.";
        return;
      }
      verifyButton.disabled = true;
      status.textContent = "Verifying OTP code...";
      try {
        const response = await fetch(`${workerUrl}/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp })
        });
        if (!response.ok) throw new Error("Invalid or expired OTP code.");
        emailHidden.value = email;
        otpHidden.value = otp;
        applicationForm.hidden = false;
        status.textContent = `${type} unlocked. Complete the form below.`;
      } catch (error) {
        status.textContent = error.message;
      } finally {
        verifyButton.disabled = false;
      }
    });

    applicationForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(applicationForm).entries());
      payload.applicationType = type;
      const submitButton = applicationForm.querySelector("button[type='submit']");
      submitButton.disabled = true;
      status.textContent = "Sending application...";
      try {
        const response = await fetch(`${workerUrl}/application`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error("Application could not be sent.");
        applicationForm.reset();
        applicationForm.hidden = true;
        otpInput.value = "";
        status.textContent = "Application sent. Thank you.";
      } catch (error) {
        status.textContent = error.message;
      } finally {
        submitButton.disabled = false;
      }
    });
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
    const automaticOfficial = automaticOfficialDomains.some((root) => domain === root || domain.endsWith(`.${root}`));

    status.classList.toggle("not-official", !description && !automaticOfficial);
    if (automaticOfficial) {
      status.textContent = `${domain} is listed as official because it ends with citymetro.xyz or republicstates.xyz. Always double check the full address before sharing information.`;
    } else if (description) {
      status.textContent = `${domain} is listed as official: ${description}. Always double check the address before sharing information.`;
    } else if (domain) {
      status.textContent = `${domain} is not on this official website list. Do not submit sensitive information unless you can verify it another way.`;
    } else {
      status.textContent = "Enter a website address to check.";
    }
  });
}

function setupEmergencyPage() {
  const list = document.querySelector("[data-emergency-list]");
  const heading = document.querySelector("[data-emergency-heading]");
  const message = document.querySelector("[data-emergency-message]");
  const updated = document.querySelector("[data-emergency-updated]");
  if (!list || !heading || !message) return;

  const data = window.rsaEmergencyData || {};
  const emergencies = Array.isArray(data.emergencies) ? data.emergencies : [];

  if (updated) {
    updated.textContent = data.lastUpdated ? `Last updated: ${data.lastUpdated}` : "";
  }

  if (data.noCurrentEmergencies || emergencies.length === 0) {
    heading.textContent = "No current emergencies";
    message.textContent = data.message || "There are no current Republic States emergency alerts.";
    list.innerHTML = "";
    return;
  }

  heading.textContent = `${emergencies.length} current ${emergencies.length === 1 ? "emergency" : "emergencies"}`;
  message.textContent = data.message || "Review the active emergency information below.";
  list.innerHTML = emergencies.map((item) => `
    <article class="emergency-card">
      <div class="emergency-card-header">
        <h2>${item.title || "Emergency alert"}</h2>
        <span class="status-pill">${item.status || "Active"}</span>
      </div>
      <dl class="emergency-meta">
        <div><dt>Severity</dt><dd>${item.severity || "Not specified"}</dd></div>
        <div><dt>Area</dt><dd>${item.area || "Republic States"}</dd></div>
        <div><dt>Updated</dt><dd>${item.updated || data.lastUpdated || "Not specified"}</dd></div>
      </dl>
      <p>${item.summary || ""}</p>
      <p><strong>Instructions:</strong> ${item.instructions || "Monitor official updates and follow public safety directions."}</p>
    </article>
  `).join("");
}

setupBanner();
setupSearch();
setupContactForm();
setupApplicationForms();
setupOfficialChecker();
setupEmergencyPage();
