const toggle = document.querySelector(".nav-toggle");
const links = document.querySelector(".nav-links");

toggle.addEventListener("click", () => {
  const open = links.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
});

links.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", false);
  }
});

document.getElementById("year").textContent = new Date().getFullYear();

const root = document.documentElement;
const themeToggle = document.querySelector(".theme-toggle");
const THEME_KEY = "theme";

function storeTheme(value) {
  try {
    localStorage.setItem(THEME_KEY, value);
  } catch (e) {}
}

function updateThemeLabel() {
  const isDark = (root.getAttribute("data-theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
  themeToggle.setAttribute("aria-label", isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
}

/* Nombre del inicio: CSS decide qué palabra se ve; aquí solo se escribe letra por letra al cambiar de modo */
const heroNames = {
  light: document.querySelector(".hero-name-light"),
  dark: document.querySelector(".hero-name-dark"),
};
const heroNameText = {
  light: heroNames.light.textContent,
  dark: heroNames.dark.textContent,
};
// 55 palabras por minuto, a 5 caracteres por palabra
const TYPE_MS = 60000 / (55 * 5);
let typingTimer = null;

function typeHeroName(theme) {
  clearTimeout(typingTimer);
  heroNames.light.textContent = heroNameText.light;
  heroNames.dark.textContent = heroNameText.dark;
  if (reducedMotion) return;

  const el = heroNames[theme];
  const full = heroNameText[theme];
  let i = 0;
  (function step() {
    el.textContent = full.slice(0, ++i);
    if (i < full.length) typingTimer = setTimeout(step, TYPE_MS);
  })();
}

themeToggle.addEventListener("click", () => {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const current = root.getAttribute("data-theme") || (prefersDark ? "dark" : "light");
  const next = current === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  typeHeroName(next);
  storeTheme(next);
  updateThemeLabel();
  target = next === "dark" ? 1 : 0;
  if (reducedMotion) renderParticles(performance.now(), 0);
});

updateThemeLabel();

const contactForm = document.getElementById("contact-form");
if (contactForm) {
  const formStatus = contactForm.querySelector(".form-status");
  const submitBtn = contactForm.querySelector("button[type=submit]");

  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    formStatus.textContent = "Enviando…";
    formStatus.className = "form-status";

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(contactForm))),
      });
      const data = await res.json();

      if (data.success) {
        formStatus.textContent = "¡Gracias! Tu mensaje fue enviado, te responderé pronto.";
        formStatus.classList.add("is-success");
        contactForm.reset();
      } else {
        throw new Error(data.message || "Envío rechazado");
      }
    } catch (err) {
      formStatus.textContent = "No se pudo enviar el mensaje. Intenta de nuevo o escríbeme por LinkedIn.";
      formStatus.classList.add("is-error");
    } finally {
      submitBtn.disabled = false;
    }
  });
}

/* ---------- Escena de fondo: niebla, estrellas y partículas ---------- */
const NS = "http://www.w3.org/2000/svg";
const reducedMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
const scene = document.getElementById("scene");

function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

function rng(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* La ilustración mide 1024 x 767. Se recorta manteniendo el horizonte y los árboles encuadrados. */
const SCENE_W = 1024, SCENE_H = 767, SCENE_AR = SCENE_W / SCENE_H;
function fitScene() {
  const asp = window.innerWidth / window.innerHeight;
  if (asp >= SCENE_AR) {
    const h = SCENE_W / asp, y0 = (SCENE_H - h) * 0.5;
    scene.setAttribute("viewBox", "0 " + y0.toFixed(1) + " " + SCENE_W + " " + h.toFixed(1));
  } else {
    const w = SCENE_H * asp, x0 = Math.max(0, Math.min(SCENE_W - w, 330 - w / 2));
    scene.setAttribute("viewBox", x0.toFixed(1) + " 0 " + w.toFixed(1) + " " + SCENE_H);
  }
}

/* Niebla sobre el agua: manchas alargadas con semilla fija (mismo resultado en cada carga) */
const rw = rng(77);
function wisps(g, n, yMin, yRange) {
  for (let i = 0; i < n; i++) {
    el("ellipse", {
      cx: (-150 + rw() * 1650).toFixed(0), cy: (yMin + rw() * yRange).toFixed(0),
      rx: (90 + rw() * 150).toFixed(0), ry: (7 + rw() * 15).toFixed(0),
      fill: "url(#wispG)", opacity: (0.5 + rw() * 0.5).toFixed(2)
    }, g);
  }
}
wisps(document.getElementById("wispsA"), 18, 492, 100);
wisps(document.getElementById("wispsB"), 14, 520, 90);

/* Estrellas, solo visibles de noche (controlado por --star-op) */
const starsGroup = document.getElementById("stars");
const r3 = rng(99);
for (let s = 0; s < 80; s++) {
  el("circle", {
    cx: (r3() * 1024).toFixed(0), cy: (r3() * 330).toFixed(0),
    r: (0.4 + r3() * 0.9).toFixed(2), opacity: (0.25 + r3() * 0.7).toFixed(2)
  }, starsGroup);
}

/* Abejas (día) y luciérnagas (noche): la misma partícula se transforma gradualmente */
const fxCanvas = document.getElementById("fx");
const fxCtx = fxCanvas.getContext("2d");
let fxW = 0, fxH = 0, parts = [];
let target = root.getAttribute("data-theme") === "dark" ? 1 : 0;
let mix = target;

function makeParticle() {
  return {
    x: Math.random() * fxW, y: fxH * (0.25 + Math.random() * 0.72),
    a: Math.random() * Math.PI * 2,
    sp: 0.55 + Math.random() * 0.8,
    ph: Math.random() * 6.28, fr: 0.5 + Math.random() * 1.1,
    sz: 0.8 + Math.random() * 0.9
  };
}

function resizeScene() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  fxW = window.innerWidth; fxH = window.innerHeight;
  fxCanvas.width = Math.round(fxW * dpr); fxCanvas.height = Math.round(fxH * dpr);
  fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const n = Math.round(Math.min(64, Math.max(22, fxW / 22)));
  while (parts.length < n) parts.push(makeParticle());
  parts.length = n;
  fitScene();
}

function renderParticles(now, dt) {
  fxCtx.clearRect(0, 0, fxW, fxH);
  mix += (target - mix) * Math.min(1, 0.035 * dt);
  if (Math.abs(target - mix) < 0.002) mix = target;
  const tsec = now / 1000;

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];

    const speed = p.sp * (1.9 * (1 - mix) + 0.3 * mix);
    p.a += (Math.random() - 0.5) * (0.95 * (1 - mix) + 0.14 * mix) * dt;
    if (mix < 0.5 && Math.random() < 0.012 * dt) p.a += (Math.random() - 0.5) * 2.6;
    p.x += Math.cos(p.a) * speed * dt;
    p.y += Math.sin(p.a) * speed * dt + Math.sin(tsec * p.fr + p.ph) * 0.1 * mix * dt;

    if (p.x < -12) p.x = fxW + 12; else if (p.x > fxW + 12) p.x = -12;
    if (p.y < fxH * 0.12) { p.y = fxH * 0.12; p.a = Math.PI / 2 + (Math.random() - 0.5); }
    if (p.y > fxH + 8) { p.y = fxH + 8; p.a = -Math.PI / 2 + (Math.random() - 0.5); }

    const ab = 1 - mix;
    if (ab > 0.01) {
      fxCtx.globalAlpha = ab;
      fxCtx.strokeStyle = "rgba(58,55,32,.35)";
      fxCtx.lineWidth = 1;
      fxCtx.beginPath();
      fxCtx.moveTo(p.x - Math.cos(p.a) * 5 * p.sz, p.y - Math.sin(p.a) * 5 * p.sz);
      fxCtx.lineTo(p.x, p.y);
      fxCtx.stroke();
      fxCtx.fillStyle = "#34311b";
      fxCtx.beginPath(); fxCtx.arc(p.x, p.y, 1.5 * p.sz + 0.4, 0, 6.2832); fxCtx.fill();
      fxCtx.fillStyle = "#d9b84f";
      fxCtx.beginPath(); fxCtx.arc(p.x + Math.cos(p.a) * 0.9, p.y + Math.sin(p.a) * 0.9, 0.7 * p.sz, 0, 6.2832); fxCtx.fill();
    }

    const fl = mix;
    if (fl > 0.01) {
      const b = Math.pow(Math.max(0, Math.sin(tsec * p.fr * 1.5 + p.ph)), 3) * 0.9 + 0.06;
      const r = 17 * p.sz;
      fxCtx.globalCompositeOperation = "lighter";
      const gr = fxCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      gr.addColorStop(0, "rgba(226,246,130," + (b * fl).toFixed(3) + ")");
      gr.addColorStop(1, "rgba(226,246,130,0)");
      fxCtx.globalAlpha = 1;
      fxCtx.fillStyle = gr;
      fxCtx.beginPath(); fxCtx.arc(p.x, p.y, r, 0, 6.2832); fxCtx.fill();
      fxCtx.fillStyle = "rgba(255,255,205," + Math.min(1, b * fl * 1.2).toFixed(3) + ")";
      fxCtx.beginPath(); fxCtx.arc(p.x, p.y, 1 * p.sz + 0.3, 0, 6.2832); fxCtx.fill();
      fxCtx.globalCompositeOperation = "source-over";
    }
  }
  fxCtx.globalAlpha = 1;
}

let fxLast = performance.now();
let fxRafId = null;
function fxLoop(now) {
  const dt = Math.min(40, now - fxLast) / 16.67;
  fxLast = now;
  renderParticles(now, dt);
  fxRafId = requestAnimationFrame(fxLoop);
}
function startFxLoop() {
  if (fxRafId !== null || reducedMotion) return;
  fxLast = performance.now();
  fxRafId = requestAnimationFrame(fxLoop);
}
function stopFxLoop() {
  if (fxRafId !== null) cancelAnimationFrame(fxRafId);
  fxRafId = null;
}

resizeScene();
window.addEventListener("resize", () => {
  resizeScene();
  if (reducedMotion) renderParticles(performance.now(), 0);
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopFxLoop();
  else startFxLoop();
});

if (reducedMotion) {
  renderParticles(performance.now(), 0);
} else {
  startFxLoop();
}
