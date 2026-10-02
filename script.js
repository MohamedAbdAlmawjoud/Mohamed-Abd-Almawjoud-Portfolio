// =========================================================
// Portfolio script
// 1. Theme toggle
// 2. Mobile menu
// 3. Active nav link
// 4. Scroll animation
// 5. Placeholder project images
// 6. Contact form (UI only)
// 7. Footer year
// =========================================================


// ---------- 1. Theme toggle ----------
// The correct theme is already set by a small script in <head>.
// Here we only handle the button and saving the choice.

const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");

function getSavedTheme() {
  try {
    return sessionStorage.getItem("theme");
  } catch (e) {
    return null; // storage can be blocked in some browsers
  }
}

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  const next = theme === "dark" ? "light" : "dark";
  themeToggle.setAttribute("aria-label", "Switch to " + next + " theme");
}

function saveTheme(theme) {
  try {
    sessionStorage.setItem("theme", theme);
  } catch (e) {
    // ignore: the theme just won't be remembered
  }
}

applyTheme(root.getAttribute("data-theme") || "dark");

themeToggle.addEventListener("click", function () {
  const current = root.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  saveTheme(next);
});

// If the visitor never chose a theme, follow the system when it changes
if (window.matchMedia) {
  const systemQuery = window.matchMedia("(prefers-color-scheme: light)");
  const onSystemChange = function (e) {
    if (!getSavedTheme()) {
      applyTheme(e.matches ? "light" : "dark");
    }
  };
  if (systemQuery.addEventListener) {
    systemQuery.addEventListener("change", onSystemChange);
  }
}


// ---------- 2. Mobile menu ----------

const menuToggle = document.getElementById("menu-toggle");
const navMenu = document.getElementById("nav-menu");

function setMenu(open) {
  navMenu.classList.toggle("open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

menuToggle.addEventListener("click", function () {
  setMenu(!navMenu.classList.contains("open"));
});

// Close the menu after choosing a link
navMenu.querySelectorAll("a").forEach(function (link) {
  link.addEventListener("click", function () {
    setMenu(false);
  });
});

// Close with the Escape key
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && navMenu.classList.contains("open")) {
    setMenu(false);
    menuToggle.focus();
  }
});

// Close if the window grows back to desktop size
window.addEventListener("resize", function () {
  if (window.innerWidth > 720) {
    setMenu(false);
  }
});


// ---------- 3. Active nav link ----------
// Highlights the link of the section currently on screen.

const navLinks = document.querySelectorAll(".nav-link");
const trackedSections = [];

navLinks.forEach(function (link) {
  const section = document.querySelector(link.getAttribute("href"));
  if (section) {
    trackedSections.push({ link: link, section: section });
  }
});

function updateActiveLink() {
  const offset = 120; // a bit below the navbar
  const scrollPos = window.scrollY + offset;
  let current = trackedSections[0];

  trackedSections.forEach(function (item) {
    if (item.section.offsetTop <= scrollPos) {
      current = item;
    }
  });

  // At the very bottom of the page, highlight the last link
  const atBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 4;
  if (atBottom) {
    current = trackedSections[trackedSections.length - 1];
  }

  navLinks.forEach(function (link) {
    link.classList.remove("active");
    link.removeAttribute("aria-current");
  });

  if (current) {
    current.link.classList.add("active");
    current.link.setAttribute("aria-current", "true");
  }
}

let scrollTicking = false;
window.addEventListener("scroll", function () {
  if (!scrollTicking) {
    window.requestAnimationFrame(function () {
      updateActiveLink();
      scrollTicking = false;
    });
    scrollTicking = true;
  }
});

window.addEventListener("resize", updateActiveLink);
updateActiveLink();


// ---------- 4. Scroll animation ----------
// Elements with the "reveal" class fade in once when they enter the screen.

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target); // animate only once
        }
      });
    },
    { threshold: 0.12 }
  );

  revealItems.forEach(function (item) {
    observer.observe(item);
  });
} else {
  // Very old browsers: just show everything
  revealItems.forEach(function (item) {
    item.classList.add("visible");
  });
}


// ---------- 5. Placeholder project images ----------
// If an image file is missing, show a simple placeholder with the project name.
// To use a real screenshot: put the file in the images/ folder with the name
// used in index.html (for example images/snacktrack.png).

function makePlaceholder(label) {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">' +
    '<rect width="640" height="360" fill="#3A3F47"/>' +
    '<text x="320" y="172" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" fill="#D5D9DF">' +
    label +
    "</text>" +
    '<text x="320" y="206" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#9AA1AB">' +
    "Screenshot coming soon" +
    "</text>" +
    "</svg>";
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

function usePlaceholder(img) {
  if (img.dataset.placeholderApplied) return; // avoid looping if something fails
  img.dataset.placeholderApplied = "true";
  img.src = makePlaceholder(img.dataset.placeholder || "Project");
}

document.querySelectorAll("img[data-placeholder]").forEach(function (img) {
  img.addEventListener("error", function () {
    usePlaceholder(img);
  });

  // The error may have already happened before this script ran
  if (img.complete && img.naturalWidth === 0) {
    usePlaceholder(img);
  }
});


// ---------- 6. Contact form (Formspree) ----------

const form = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");

function showError(input, message) {
  const field = input.closest(".field");
  field.classList.toggle("invalid", Boolean(message));
  field.querySelector(".error").textContent = message;
  input.setAttribute("aria-invalid", message ? "true" : "false");
}

function validateField(input) {
  const value = input.value.trim();

  if (value === "") {
    showError(input, "Please fill in this field.");
    return false;
  }

  if (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    showError(input, "Please enter a valid email address.");
    return false;
  }

  showError(input, "");
  return true;
}

const formFields = form.querySelectorAll("input, textarea");

// Clear an error as soon as the visitor fixes it
formFields.forEach(function (input) {
  input.addEventListener("input", function () {
    if (input.closest(".field").classList.contains("invalid")) {
      validateField(input);
    }
  });
});

form.addEventListener("submit", async function (e) {
  e.preventDefault();
  formStatus.textContent = "";

  let allValid = true;
  let firstInvalid = null;

  formFields.forEach(function (input) {
    if (!validateField(input)) {
      allValid = false;
      if (!firstInvalid) firstInvalid = input;
    }
  });

  if (!allValid) {
    firstInvalid.focus();
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "Sending…";

  try {
    const response = await fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw new Error("Form submission failed");
    }

    formStatus.textContent = "Thanks! Your message has been sent.";
    form.reset();
    formFields.forEach(function (input) {
      showError(input, "");
    });
  } catch (error) {
    formStatus.textContent = "Sorry, your message could not be sent. Please try again or email me directly.";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Send message";
  }
});


// ---------- 7. Footer year ----------

document.getElementById("year").textContent = new Date().getFullYear();
