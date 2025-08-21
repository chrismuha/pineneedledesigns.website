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

  const mqFooter = window.matchMedia("(max-width: 768px)");

  function needsToggle(panel, thresholdPx = 140) {
    if (!panel) return false;
    const prevCollapsed = panel.getAttribute("data-collapsed");
    const prevAria = panel.getAttribute("aria-hidden");
    const prevInlineDisplay = panel.style.display;
    panel.setAttribute("data-collapsed", "false");
    panel.setAttribute("aria-hidden", "false");
    if (getComputedStyle(panel).display === "none") {
      panel.style.display = "block";
    }
    const tall = panel.scrollHeight > thresholdPx;
    if (prevCollapsed === null) panel.removeAttribute("data-collapsed");
    else panel.setAttribute("data-collapsed", prevCollapsed);
    if (prevAria === null) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", prevAria);
    panel.style.display = prevInlineDisplay;
    return tall;
  }

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

  function setState(btn, panel, expanded) {
    btn.setAttribute("aria-expanded", String(expanded));
    panel.setAttribute("data-collapsed", expanded ? "false" : "true");
    panel.setAttribute("aria-hidden", expanded ? "false" : "true");
    if (!btn.classList.contains("icon-plusminus")) {
      btn.textContent = expanded ? "Read less" : "Read more";
    }
  }

  function evaluate(btn, panel) {
    if (panel.dataset.force === "true") {
      setState(btn, panel, false);
      btn.style.display = "";
      return;
    }
    if (!mqFooter.matches) {
      setState(btn, panel, true);
      btn.style.display = "none";
      return;
    }
    const show = needsToggle(panel, 140);
    if (!show) {
      setState(btn, panel, true);
      btn.style.display = "none";
    } else {
      setState(btn, panel, false);
      btn.style.display = "";
    }
  }

  function initToggle(btn) {
    const panel = resolvePanel(btn);
    if (!panel) return;
    if (!panel.classList.contains("collapsible")) panel.classList.add("collapsible");
    if ((btn.tagName === "SPAN" || btn.getAttribute("role") === "button") && !btn.hasAttribute("tabindex")) {
      btn.setAttribute("tabindex", "0");
    }
    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      setState(btn, panel, !expanded);
    });
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        btn.click();
      }
    });
    evaluate(btn, panel);
    const onChange = () => evaluate(btn, panel);
    const debounce = (fn, d = 120) => {
      let t;
      return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), d); };
    };
    const debouncedOnChange = debounce(onChange, 120);
    if (mqFooter.addEventListener) mqFooter.addEventListener("change", onChange);
    else mqFooter.addListener(onChange);
    window.addEventListener("resize", debouncedOnChange);
  }

  document.querySelectorAll(".foot-toggle").forEach(initToggle);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      document.querySelectorAll(".foot-toggle").forEach((btn) => {
        const panel = resolvePanel(btn);
        if (panel) evaluate(btn, panel);
      });
    }).catch(() => { });
  }
});
