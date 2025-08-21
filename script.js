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
      if (expanded) {
        closeMenu();
      } else {
        openMenu();
      }
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

    const mq = window.matchMedia("(min-width: 981px)");
    const handleDesktop = (ev) => {
      if (ev.matches) {
        closeMenu();
      }
    };
    mq.addEventListener ? mq.addEventListener("change", handleDesktop) : mq.addListener(handleDesktop);
  }

  const yearEl = document.getElementById("y");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
});

(function () {
  const mq = window.matchMedia('(max-width: 768px)');

  function initToggle(btn) {
    const id = btn.getAttribute('data-target');
    const panel = document.getElementById(id);
    if (!panel) return;

    function evaluate() {
      if (!mq.matches) {
        panel.setAttribute('data-collapsed', 'false');
        btn.setAttribute('aria-expanded', 'true');
        btn.style.display = 'none';
        return;
      }
      const prev = panel.getAttribute('data-collapsed');
      panel.setAttribute('data-collapsed', 'false');
      const needsToggle = panel.scrollHeight > 140;
      panel.setAttribute('data-collapsed', prev);

      btn.style.display = needsToggle ? '' : 'none';
      if (needsToggle && (prev === null || prev === 'true')) {
        btn.textContent = 'Read more';
        btn.setAttribute('aria-expanded', 'false');
        panel.setAttribute('data-collapsed', 'true');
      }
    }

    btn.addEventListener('click', () => {
      const isCollapsed = panel.getAttribute('data-collapsed') !== 'false';
      panel.setAttribute('data-collapsed', isCollapsed ? 'false' : 'true');
      btn.textContent = isCollapsed ? 'Read less' : 'Read more';
      btn.setAttribute('aria-expanded', String(isCollapsed ? true : false));
    });

    evaluate();
    window.addEventListener('resize', evaluate);
  }

  document.querySelectorAll('.foot-toggle').forEach(initToggle);
})();

(function () {
  const btn = document.querySelector('#foot-section-1 .foot-toggle');
  const panel = document.getElementById(btn?.dataset.target || '');

  if (!btn || !panel) return;

  const mq = window.matchMedia('(max-width: 768px)');

  function setState(expanded) {
    btn.setAttribute('aria-expanded', String(expanded));
    panel.setAttribute('data-collapsed', expanded ? 'false' : 'true');
  }

  function evaluate() {
    if (!mq.matches) {
      setState(true);
    } else {
      setState(false);
    }
  }

  btn.addEventListener('click', () => {
    const isExpanded = btn.getAttribute('aria-expanded') === 'true';
    setState(!isExpanded);
  });

  evaluate();
  window.addEventListener('resize', evaluate);
})();
