document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menuBtn");
  const mnav = document.getElementById("mnav");

  const closeMenu = () => {
    if (!menuBtn || !mnav) return;
    menuBtn.setAttribute("aria-expanded", "false");
    mnav.classList.remove("mobile-nav--open");
  };

  const openMenu = () => {
    if (!menuBtn || !mnav) return;
    menuBtn.setAttribute("aria-expanded", "true");
    mnav.classList.add("mobile-nav--open");
  };

  if (menuBtn && mnav) {
    closeMenu();

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

    const mqSmall = window.matchMedia("(max-width: 980px)");
    const handleSmall = (ev) => {
      if (ev.matches) closeMenu();
    };
    if (mqSmall.addEventListener) mqSmall.addEventListener("change", handleSmall);
    else mqSmall.addListener(handleSmall);

    mnav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });
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

  if (sliderContainer && prevBtn && nextBtn) {
    const slides = [
      ["images/1a.webp", "images/2b.PNG", "images/3.JPG"],
      ["images/4.webp"],
      ["images/5.webp"]
    ];

    let currentIndex = 0;
    let interval;

    function showSlide(index) {
      sliderContainer.style.opacity = 0;

      setTimeout(() => {
        currentIndex = (index + slides.length) % slides.length;
        sliderContainer.innerHTML = "";

        const slide = slides[currentIndex];

        // Reset classes
        sliderContainer.className = "";

        if (slide.length === 1) sliderContainer.classList.add("single");
        if (slide.length === 2) sliderContainer.classList.add("double");
        if (slide.length === 3) sliderContainer.classList.add("triple");

        slide.forEach(src => {
          const wrapper = document.createElement("div");
          wrapper.className = "slide-item";

          const img = document.createElement("img");
          img.src = src;
          img.alt = "Featured product";

          wrapper.appendChild(img);
          sliderContainer.appendChild(wrapper);
        });


        sliderContainer.style.opacity = 1;
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
  }

  const collectionPages = [
    "adirondack-bridal.html",
    "boot-bands.html",
    "bracelets.html",
    "chic-jewelry.html",
    "cuffs.html",
    "earrings.html",
    "hat-bands.html",
    "jackets.html",
    "jeans.html",
    "necklaces.html",
    "pooch-smooches.html",
    "purses.html",
    "shirts.html",
    "shorts.html",
    "upcycled-denim.html",
    "vests.html"
  ];

  const setupCollectionPagination = () => {
    const actions = document.querySelector(".product-actions");
    if (!actions) return;
    const backLink = actions.querySelector(".back-link");
    const nextLink = actions.querySelector(".btn-next");
    if (!backLink || !nextLink) return;

    const currentFile = window.location.pathname.split("/").pop() || "index.html";
    const currentIndex = collectionPages.indexOf(currentFile);
    if (currentIndex === -1) return;

    const updateLink = (link, target, withDisabledAttr = false) => {
      if (target) {
        link.setAttribute("href", target);
        link.classList.remove("disabled");
        link.removeAttribute("aria-disabled");
        link.removeAttribute("tabindex");
        if (withDisabledAttr) link.removeAttribute("disabled");
      } else {
        link.removeAttribute("href");
        link.classList.add("disabled");
        link.setAttribute("aria-disabled", "true");
        link.setAttribute("tabindex", "-1");
        if (withDisabledAttr) link.setAttribute("disabled", "true");
      }
    };

    updateLink(backLink, collectionPages[currentIndex - 1]);
    updateLink(nextLink, collectionPages[currentIndex + 1], true);
  };

  setupCollectionPagination();

});
