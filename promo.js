/* ============ ป็อปอัปโปรโมชัน ============ */
(function () {
  if (typeof PROMO === "undefined" || !PROMO.enabled) return;
  const KEY = "phumin-sb-promo-" + PROMO.id;
  let seen = false; try { seen = !!localStorage.getItem(KEY); } catch {}
  if (seen) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const wrap = document.createElement("div");
  wrap.id = "promo";
  wrap.className = "promo";
  wrap.setAttribute("role", "dialog");
  wrap.setAttribute("aria-modal", "true");
  wrap.setAttribute("aria-label", PROMO.title);
  wrap.innerHTML = `
    <div class="promo-card">
      <button class="promo-x" type="button" aria-label="ปิด">${ic("x")}</button>
      <div class="promo-gift">${ic("party-popper")}</div>
      <small class="promo-badge"></small>
      <h3 class="promo-title"></h3>
      <p class="promo-text"></p>
      <a class="pill-btn solid promo-cta" href="${PROMO.href}"></a>
      <button class="promo-later" type="button">ไว้ทีหลัง</button>
    </div>`;
  wrap.querySelector(".promo-badge").textContent = PROMO.badge;
  wrap.querySelector(".promo-title").textContent = PROMO.title;
  wrap.querySelector(".promo-text").textContent = PROMO.text;
  wrap.querySelector(".promo-cta").textContent = PROMO.cta;
  if (!reduce) for (let i = 0; i < 16; i++) {
    const c = document.createElement("i");
    c.className = "confetti";
    c.style.left = (5 + Math.random() * 90) + "%";
    c.style.animationDelay = (Math.random() * .4) + "s";
    c.style.animationDuration = (1.6 + Math.random() * 1) + "s";
    c.style.setProperty("--c", ["#f2b8b8", "#b8d8f2", "#f7e3a1", "#b8e6c9", "#d9c8f2"][i % 5]);
    wrap.appendChild(c);
  }
  document.body.appendChild(wrap);
  icons();

  function close(remember = true) {
    wrap.classList.remove("show");
    if (remember) try { localStorage.setItem(KEY, "1"); } catch {}
    setTimeout(() => wrap.remove(), 350);
    document.removeEventListener("keydown", onKey);
  }
  function onKey(e) { if (e.key === "Escape") close(); }
  wrap.addEventListener("click", e => {
    if (e.target === wrap || e.target.closest(".promo-x, .promo-later")) close();
    if (e.target.closest(".promo-cta")) close();
  });
  document.addEventListener("keydown", onKey);

  /* แสดงเมื่อพร้อม: หน้าแรก ไม่มีกล่องอื่นเปิดอยู่ */
  function tryShow() {
    const busy = /view-(reviews|track|admin|contact)/.test(document.body.className) ||
      document.querySelector(".modal.show, .drawer.open, .lb.show, #authModal.show");
    if (busy) return setTimeout(tryShow, 2000);
    requestAnimationFrame(() => wrap.classList.add("show"));
  }
  setTimeout(tryShow, PROMO.delay || 6000);
})();
