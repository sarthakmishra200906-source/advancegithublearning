const app = document.getElementById("app");
const footerStatus = document.getElementById("footer-status");
const navLinks = Array.from(document.querySelectorAll("[data-route]"));

const storageKeys = {
  user: "sarthakStudioUser",
  session: "sarthakStudioSession",
};

const sampleFeatures = [
  {
    title: "Dynamic routing",
    text: "Hash-based navigation swaps content instantly without reloading the page.",
  },
  {
    title: "Account flow",
    text: "Register, log in, and land on a dashboard that reflects your stored profile.",
  },
  {
    title: "Shared layout",
    text: "The header and footer stay constant while the main content changes with JS.",
  },
];

const dashboardNotes = [
  {
    label: "Today’s goal",
    value: "Ship a polished SPA shell",
  },
  {
    label: "Layout mode",
    value: "Responsive glass panels",
  },
  {
    label: "Content source",
    value: "JavaScript render functions",
  },
];

const dashboardJokeApiUrl =
  window.DASHBOARD_JOKE_API_URL ||
  "https://official-joke-api.appspot.com/random_joke";

const fallbackJokes = [
  "Why do developers hate nature? It has too many bugs.",
  "A SQL query walks into a bar and asks: can I join you?",
  "Why did the JavaScript developer go broke? Because he used up all his cache.",
  "I told my computer I needed a break, and it said: no problem, I will go to sleep.",
];

let activeJokeRequestId = 0;

function getSessionUser() {
  return JSON.parse(localStorage.getItem(storageKeys.session) || "null");
}

function getRegisteredUser() {
  return JSON.parse(localStorage.getItem(storageKeys.user) || "null");
}

function saveUser(user) {
  localStorage.setItem(storageKeys.user, JSON.stringify(user));
  localStorage.setItem(storageKeys.session, JSON.stringify(user));
}

function setSession(user) {
  localStorage.setItem(storageKeys.session, JSON.stringify(user));
}

function logout() {
  localStorage.removeItem(storageKeys.session);
  navigate("home");
}

function navigate(route) {
  window.location.hash = route;
}

function currentRoute() {
  return window.location.hash.replace("#", "") || "home";
}

function updateNav(route) {
  navLinks.forEach((link) => {
    const active = link.getAttribute("href") === `#${route}`;
    link.classList.toggle("active", active);
    link.setAttribute("aria-current", active ? "page" : "false");
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getDashboardStats(user) {
  const nameSeed = (user?.name || "Guest").length;
  return [
    { label: "Projects", value: 8 + (nameSeed % 5) },
    { label: "Streak", value: 12 + (nameSeed % 7) },
    { label: "Tasks", value: 24 + (nameSeed % 11) },
  ];
}

function getFallbackJoke() {
  return fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)];
}

function normalizeJokePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  if (payload.setup && payload.punchline) {
    return {
      setup: payload.setup,
      punchline: payload.punchline,
      source: payload.source || "API",
    };
  }

  if (payload.joke) {
    return {
      setup: payload.joke,
      punchline: payload.category || "",
      source: payload.source || "API",
    };
  }

  if (payload.value) {
    return {
      setup: payload.value,
      punchline: "",
      source: payload.source || "API",
    };
  }

  if (payload.text) {
    return {
      setup: payload.text,
      punchline: "",
      source: payload.source || "API",
    };
  }

  return null;
}

async function fetchDashboardJoke() {
  const response = await fetch(dashboardJokeApiUrl, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const joke = normalizeJokePayload(payload);

  if (joke) {
    return joke;
  }

  throw new Error("Unsupported joke payload");
}

function jokeMarkup(joke, isFallback = false) {
  const sourceLabel = isFallback ? "Local fallback" : joke.source || "API";

  return `
    <article class="dashboard-card joke-panel">
      <div class="joke-header">
        <div>
          <p class="eyebrow">Daily joke</p>
          <h3>Fresh content on every dashboard load</h3>
        </div>
        <button class="secondary" type="button" data-action="refresh-joke">Refresh joke</button>
      </div>
      <p class="joke-copy">${escapeHtml(joke.setup)}</p>
      ${joke.punchline ? `<p class="joke-punchline">${escapeHtml(joke.punchline)}</p>` : ""}
      <p class="joke-meta">Source: ${escapeHtml(sourceLabel)}</p>
    </article>
  `;
}

function setDashboardJokeState(html) {
  const jokeSlot = document.querySelector("[data-joke-slot]");
  if (jokeSlot) {
    jokeSlot.innerHTML = html;
  }
}

async function loadDashboardJoke() {
  const requestId = ++activeJokeRequestId;
  setDashboardJokeState(`
    <article class="dashboard-card joke-panel">
      <p class="eyebrow">Daily joke</p>
      <h3>Loading a fresh joke...</h3>
      <p class="muted">Fetching from your API endpoint.</p>
      <p class="joke-meta">Please wait.</p>
    </article>
  `);

  try {
    const joke = await fetchDashboardJoke();
    if (requestId !== activeJokeRequestId) {
      return;
    }

    setDashboardJokeState(jokeMarkup(joke));
  } catch {
    if (requestId !== activeJokeRequestId) {
      return;
    }

    setDashboardJokeState(jokeMarkup({ setup: getFallbackJoke(), punchline: "" }, true));
  }
}

function homeView() {
  const guest = getSessionUser() || getRegisteredUser();
  const greeting = guest
    ? `Welcome back, ${guest.name}.`
    : "Build your account and step into the dashboard.";

  const featuresMarkup = sampleFeatures
    .map(
      (feature) => `
    <article class="feature-card">
      <h3>${escapeHtml(feature.title)}</h3>
      <p>${escapeHtml(feature.text)}</p>
    </article>
  `,
    )
    .join("");

  return `
    <section class="panel hero-grid">
      <div class="hero-copy">
        <p class="eyebrow">Single page experience</p>
        <h1>One layout. Three account flows. All rendered in JavaScript.</h1>
        <p>${escapeHtml(greeting)} This site keeps the header and footer fixed while the main area swaps between home, login, register, and dashboard views.</p>
        <div class="hero-actions">
          <button class="primary" data-action="goto" data-target="register">Create account</button>
          <button class="secondary" data-action="goto" data-target="dashboard">Open dashboard</button>
        </div>
        <ul class="hero-list">
          <li>Separate HTML, CSS, and JavaScript files</li>
          <li>Responsive layout for desktop and mobile</li>
          <li>Dynamic content with reusable render functions</li>
        </ul>
      </div>
      <aside class="hero-visual">
        <div class="dashboard-banner">
          <p class="eyebrow">Live status</p>
          <h2>${escapeHtml(guest ? guest.name : "Guest visitor")}</h2>
          <p>${escapeHtml(guest ? "Your session is active and ready for dashboard actions." : "Sign up or log in to unlock your dashboard.")}</p>
        </div>
        <div class="stats-grid">
          ${dashboardNotes
            .map(
              (note) => `
            <div class="stats-card">
              <p class="muted">${escapeHtml(note.label)}</p>
              <div class="stat-value">${escapeHtml(note.value)}</div>
            </div>
          `,
            )
            .join("")}
        </div>
      </aside>
    </section>
    <section class="feature-grid" aria-label="Website features">
      ${featuresMarkup}
    </section>
  `;
}

function loginView(message = "") {
  const registered = getRegisteredUser();
  return `
    <section class="panel form-card">
      <p class="eyebrow">Welcome back</p>
      <h2>Login</h2>
      <p>Use your saved profile to enter the dashboard.</p>
      <form class="form-grid" data-form="login">
        <div class="field">
          <label for="login-email">Email</label>
          <input id="login-email" name="email" type="email" placeholder="name@example.com" value="${escapeHtml(registered?.email || "")}" required />
        </div>
        <div class="field">
          <label for="login-password">Password</label>
          <input id="login-password" name="password" type="password" placeholder="Enter your password" required />
        </div>
        <div class="form-actions">
          <button class="primary" type="submit">Login</button>
          <button class="secondary" type="button" data-action="goto" data-target="register">Need an account?</button>
        </div>
      </form>
      ${message ? `<p class="message ${message.type || ""}">${escapeHtml(message.text)}</p>` : ""}
    </section>
  `;
}

function registerView(message = "") {
  const registered = getRegisteredUser();
  return `
    <section class="panel form-card">
      <p class="eyebrow">Join now</p>
      <h2>Register</h2>
      <p>Create a profile and the dashboard will pick it up automatically.</p>
      <form class="form-grid" data-form="register">
        <div class="form-row">
          <div class="field">
            <label for="register-name">Full name</label>
            <input id="register-name" name="name" type="text" placeholder="Sarthak" value="${escapeHtml(registered?.name || "")}" required />
          </div>
          <div class="field">
            <label for="register-role">Role</label>
            <select id="register-role" name="role" required>
              <option value="Creator">Creator</option>
              <option value="Learner">Learner</option>
              <option value="Builder">Builder</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="field">
            <label for="register-email">Email</label>
            <input id="register-email" name="email" type="email" placeholder="name@example.com" value="${escapeHtml(registered?.email || "")}" required />
          </div>
          <div class="field">
            <label for="register-password">Password</label>
            <input id="register-password" name="password" type="password" placeholder="Create a password" required />
          </div>
        </div>
        <div class="field">
          <label for="register-bio">Short bio</label>
          <textarea id="register-bio" name="bio" rows="4" placeholder="Tell us what you are building">${escapeHtml(registered?.bio || "")}</textarea>
        </div>
        <div class="form-actions">
          <button class="primary" type="submit">Register</button>
          <button class="secondary" type="button" data-action="goto" data-target="login">Already registered?</button>
        </div>
      </form>
      ${message ? `<p class="message ${message.type || ""}">${escapeHtml(message.text)}</p>` : ""}
    </section>
  `;
}

function dashboardView(message = "") {
  const user = getSessionUser() || getRegisteredUser();

  if (!user) {
    return `
      <section class="panel form-card">
        <p class="eyebrow">Protected area</p>
        <h2>Dashboard</h2>
        <p>You need an account session before the dashboard becomes available.</p>
        <div class="form-actions">
          <button class="primary" type="button" data-action="goto" data-target="login">Login</button>
          <button class="secondary" type="button" data-action="goto" data-target="register">Register</button>
        </div>
      </section>
    `;
  }

  const stats = getDashboardStats(user);

  return `
    <section class="panel">
      <div class="dashboard-banner">
        <p class="eyebrow">Dashboard</p>
        <h2>Hi ${escapeHtml(user.name)}, your workspace is active.</h2>
        <p>${escapeHtml(user.bio || `Your ${user.role.toLowerCase()} profile is loaded and ready for the next step.`)}</p>
      </div>

      <div class="dashboard-layout dashboard-layout--active" style="margin-top: 18px;">
        <article class="dashboard-card">
          <h3>Profile summary</h3>
          <p class="muted">Role: ${escapeHtml(user.role)}</p>
          <p class="muted">Email: ${escapeHtml(user.email)}</p>
          <div class="stats-grid" style="margin-top: 16px;">
            ${stats
              .map(
                (stat) => `
              <div class="stats-card">
                <p class="muted">${escapeHtml(stat.label)}</p>
                <div class="stat-value">${escapeHtml(stat.value)}</div>
              </div>
            `,
              )
              .join("")}
          </div>
        </article>

        <aside class="timeline-card">
          <h3>Next actions</h3>
          <div class="timeline">
            <div class="timeline-item">
              <span class="timeline-dot"></span>
              <div>
                <strong>Review onboarding</strong>
                <p>Use the dashboard as the landing area after login.</p>
              </div>
            </div>
            <div class="timeline-item">
              <span class="timeline-dot"></span>
              <div>
                <strong>Update profile</strong>
                <p>Change the register form to see the content update dynamically.</p>
              </div>
            </div>
            <div class="timeline-item">
              <span class="timeline-dot"></span>
              <div>
                <strong>Sign out anytime</strong>
                <p>Clear the session and return to the homepage.</p>
              </div>
            </div>
          </div>
          <div class="form-actions" style="margin-top: 18px;">
            <button class="secondary" type="button" data-action="logout">Logout</button>
          </div>
        </aside>
      </div>
      <div data-joke-slot class="dashboard-joke-slot" style="margin-top: 18px;">
        <article class="dashboard-card joke-panel">
          <p class="eyebrow">Daily joke</p>
          <h3>Loading a fresh joke...</h3>
          <p class="muted">Fetching from your API endpoint.</p>
          <p class="joke-meta">Please wait.</p>
        </article>
      </div>
      ${message ? `<p class="message ${message.type || ""}" style="margin-top: 18px;">${escapeHtml(message.text)}</p>` : ""}
    </section>
  `;
}

function render(route = currentRoute(), message = "") {
  updateNav(route);

  let html = "";
  let status = "";

  if (route === "login") {
    html = loginView(message);
    status = "Login page loaded.";
  } else if (route === "register") {
    html = registerView(message);
    status = "Register page loaded.";
  } else if (route === "dashboard") {
    html = dashboardView(message);
    status = "Dashboard loaded.";
  } else {
    html = homeView();
    status = "Home page loaded.";
  }

  app.innerHTML = html;
  footerStatus.textContent = status;

  const hasDashboardUser = route === "dashboard" && (getSessionUser() || getRegisteredUser());
  if (hasDashboardUser) {
    loadDashboardJoke();
  }
}

document.addEventListener("click", (event) => {
  const navButton = event.target.closest("[data-action='goto']");
  if (navButton) {
    navigate(navButton.dataset.target);
    return;
  }

  const logoutButton = event.target.closest("[data-action='logout']");
  if (logoutButton) {
    logout();
    return;
  }

  const refreshJokeButton = event.target.closest("[data-action='refresh-joke']");
  if (refreshJokeButton) {
    loadDashboardJoke();
  }
});

document.addEventListener("submit", (event) => {
  const form = event.target.closest("form[data-form]");
  if (!form) {
    return;
  }

  event.preventDefault();
  const data = new FormData(form);

  if (form.dataset.form === "register") {
    const user = {
      name: data.get("name").trim(),
      email: data.get("email").trim(),
      password: data.get("password"),
      role: data.get("role"),
      bio: data.get("bio").trim(),
    };

    if (!user.name || !user.email || !user.password) {
      render("register", {
        type: "error",
        text: "All required fields must be completed.",
      });
      return;
    }

    saveUser(user);
    render("dashboard", {
      text: "Registration saved. Your dashboard is ready.",
    });
    return;
  }

  if (form.dataset.form === "login") {
    const savedUser = getRegisteredUser();
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");

    if (
      !savedUser ||
      savedUser.email !== email ||
      savedUser.password !== password
    ) {
      render("login", {
        type: "error",
        text: "Login failed. Check your email and password, or register first.",
      });
      return;
    }

    setSession(savedUser);
    render("dashboard", { text: "Login successful. Welcome back." });
  }
});

window.addEventListener("hashchange", () => {
  render(currentRoute());
});

window.addEventListener("load", () => {
  const route = currentRoute();
  const protectedRoutes = new Set(["dashboard"]);

  if (protectedRoutes.has(route) && !getSessionUser() && !getRegisteredUser()) {
    navigate("login");
    return;
  }

  if (!window.location.hash) {
    navigate("home");
    return;
  }

  render(route);
});
