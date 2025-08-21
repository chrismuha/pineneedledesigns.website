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
      if (expanded) closeMenu();
      else openMenu();
    });

    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!mnav.contains(target) && !menuBtn.contains(target)) {
        closeMenu();
      }
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
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const mqFooter = window.matchMedia("(max-width: 768px)");

  function needsToggle(panel, thresholdPx = 140) {
    if (!panel) return false;
    const prev = panel.getAttribute("data-collapsed");
    panel.setAttribute("data-collapsed", "false");
    const tall = panel.scrollHeight > thresholdPx;
    panel.setAttribute("data-collapsed", prev == null ? "true" : prev);
    return tall;
  }

  function initGenericToggle(btn) {
    const id = btn.getAttribute("data-target");
    const panel = document.getElementById(id);
    if (!panel) return;

    function setState(expanded) {
      btn.setAttribute("aria-expanded", String(expanded));
      panel.setAttribute("data-collapsed", expanded ? "false" : "true");
      if (!btn.classList.contains("icon-plusminus")) {
        btn.textContent = expanded ? "Read less" : "Read more";
      }
      btn.setAttribute("aria-label", expanded ? "Collapse section" : "Expand section");
    }


    function evaluate() {
      if (!mqFooter.matches) {
        setState(true);
        btn.style.display = "none";
        return;
      }
      const showBtn = needsToggle(panel, 140);
      if (!showBtn) {
        setState(true);
        btn.style.display = "none";
      } else {
        setState(false);
        btn.style.display = "";
      }
    }

    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      setState(!expanded);
    });

    evaluate();
    const onChange = () => evaluate();
    if (mqFooter.addEventListener) mqFooter.addEventListener("change", onChange);
    else mqFooter.addListener(onChange);
    window.addEventListener("resize", onChange);
  }

  document
    .querySelectorAll(".foot-toggle:not(.icon-plusminus)")
    .forEach(initGenericToggle);

  (function initSection1PlusMinus() {
    const btn = document.querySelector(".foot-toggle.icon-plusminus");
    if (!btn) return;
    const targetId = btn.getAttribute("data-target") || "foot-about";
    const panel = document.getElementById(targetId);
    if (!panel) return;

    function setState(expanded) {
      btn.setAttribute("aria-expanded", String(expanded));
      btn.setAttribute("aria-label", expanded ? "Collapse section" : "Expand section");
      panel.setAttribute("data-collapsed", expanded ? "false" : "true");
    }

    function evaluate() {
      if (!mqFooter.matches) {
        setState(true);
        btn.style.display = "none";
        return;
      }
      const showBtn = needsToggle(panel, 140);
      if (!showBtn) {
        setState(true);
        btn.style.display = "none";
      } else {
        setState(false);
        btn.style.display = "";
      }
    }

    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      setState(!expanded);
    });

    evaluate();
    const onChange = () => evaluate();
    if (mqFooter.addEventListener) mqFooter.addEventListener("change", onChange);
    else mqFooter.addListener(onChange);
    window.addEventListener("resize", onChange);
  })();
});
