document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menuBtn");
  const mnav = document.getElementById("mnav");

  const closeMenu = () => {
    if (!menuBtn || !mnav) return;
    menuBtn.setAttribute("aria-expanded", "false");
    mnav.style.display = "none";
  };

  const openMenu = () => {
    if (!menuBtn || !mnav) return;
    menuBtn.setAttribute("aria-expanded", "true");
    mnav.style.display = "";
  };

  if (menuBtn && mnav) {
    const isHidden =
      (mnav.style.display && mnav.style.display === "none") ||
      window.getComputedStyle(mnav).display === "none";
    menuBtn.setAttribute("aria-expanded", isHidden ? "false" : "true");

    menuBtn.addEventListener("click", () => {
      const expanded = menuBtn.getAttribute("aria-expanded") === "true";
      expanded ? closeMenu() : openMenu();
    });

    document.addEventListener("click", (e) => {
      const t = e.target;
      if (!mnav.contains(t) && !menuBtn.contains(t)) closeMenu();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });

    const mqMenu = window.matchMedia("(min-width: 981px)");
    const handleDesktop = (ev) => {
      if (ev.matches) closeMenu();
    };
    if (mqMenu.addEventListener) mqMenu.addEventListener("change", handleDesktop);
    else mqMenu.addListener(handleDesktop);
  }

  const yearEl = document.getElementById("y");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  function resolvePanel(btn) {
    let id = btn.getAttribute("data-target") || btn.getAttribute("aria-controls");
    let panel = id ? document.getElementById(id) : null;
    if (!panel) {
      const scope = btn.closest("section") || document;
      panel = scope.querySelector(".collapsible");
      if (panel && panel.id) {
        btn.setAttribute("data-target", panel.id);
        btn.setAttribute("aria-controls", panel.id);
      }
    }
    return panel;
  }

  document.querySelectorAll(".collapsible").forEach(panel => {
    panel.setAttribute("data-collapsed", "true");
    panel.setAttribute("aria-hidden", "true");
  });

  document.querySelectorAll(".foot-toggle").forEach(btn => {
    const panel = resolvePanel(btn);
    if (!panel) return;

    btn.setAttribute("aria-expanded", "false");
    btn.style.display = "";

    if ((btn.tagName === "SPAN" || btn.getAttribute("role") === "button") && !btn.hasAttribute("tabindex")) {
      btn.setAttribute("tabindex", "0");
    }

    const toggle = () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      const next = !expanded;
      btn.setAttribute("aria-expanded", String(next));
      panel.setAttribute("data-collapsed", next ? "false" : "true");
      panel.setAttribute("aria-hidden", next ? "false" : "true");
    };

    btn.addEventListener("click", toggle);
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });
  });

  const sliderContainer = document.getElementById("slider-container");
  const prevBtn = document.querySelector(".prev-btn");
  const nextBtn = document.querySelector(".next-btn");

  const slides = [
    ["images/1.webp"],
    ["images/3.webp", "images/4.webp"],
    ["images/5.webp"],
    ["images/6.webp"],
    ["images/7.webp"]
  ];

  let currentIndex = 0;
  let interval;

  function showSlide(index) {
    sliderContainer.style.opacity = 0; // fade out
    setTimeout(() => {
      currentIndex = (index + slides.length) % slides.length;
      sliderContainer.innerHTML = ""; // clear previous slide

      const slide = slides[currentIndex];

      // Add class based on number of images
      sliderContainer.className = slide.length === 1 ? "single" : "double";

      slide.forEach(src => {
        const img = document.createElement("img");
        img.src = src;
        img.alt = "Featured product";
        sliderContainer.appendChild(img);
      });

      sliderContainer.style.opacity = 1; // fade in
    }, 500);
  }


  function nextSlide() { showSlide(currentIndex + 1); resetInterval(); }
  function prevSlide() { showSlide(currentIndex - 1); resetInterval(); }

  function startAutoSlide() {
    interval = setInterval(() => nextSlide(), 5000);
  }

  function resetInterval() {
    clearInterval(interval);
    startAutoSlide();
  }

  // initial display
  sliderContainer.style.transition = "opacity 0.5s ease-in-out";
  sliderContainer.style.opacity = 1;
  showSlide(currentIndex);

  nextBtn.addEventListener("click", nextSlide);
  prevBtn.addEventListener("click", prevSlide);
  startAutoSlide();

});
