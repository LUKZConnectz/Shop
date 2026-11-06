/* ============ โหมดกลางคืน ============ */
(function () {
  const KEY = "phumin-sb-theme";
  const sys = matchMedia("(prefers-color-scheme: dark)");
  const MOON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  const SUN = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';

  function stored() { try { return localStorage.getItem(KEY); } catch { return null; } }
  function apply(t) {
    document.documentElement.dataset.theme = t;
    const b = document.getElementById("themeBtn");
    if (!b) return;
    b.innerHTML = t === "dark" ? SUN : MOON;
    b.setAttribute("aria-label", t === "dark" ? "สลับเป็นโหมดกลางวัน" : "สลับเป็นโหมดกลางคืน");
  }
  document.addEventListener("click", e => {
    if (!e.target.closest("#themeBtn")) return;
    const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem(KEY, t); } catch {}
    apply(t);
  });
  apply(stored() || (sys.matches ? "dark" : "light"));
})();
