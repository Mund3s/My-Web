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

themeToggle.addEventListener("click", () => {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const current = root.getAttribute("data-theme") || (prefersDark ? "dark" : "light");
  const next = current === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  storeTheme(next);
  updateThemeLabel();
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
