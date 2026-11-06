/* ============ HERO EFFECTS ============ */
(function () {
  const hero = document.querySelector(".hero");
  if (!hero || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  /* ไอคอนลอยขยับตามเมาส์/นิ้ว + แสงสปอตไลต์ตามตัวชี้ */
  hero.addEventListener("pointermove", e => {
    const r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    hero.style.setProperty("--mx", (x - .5) * 2);
    hero.style.setProperty("--my", (y - .5) * 2);
    hero.style.setProperty("--px", (x * 100) + "%");
    hero.style.setProperty("--py", (y * 100) + "%");
    hero.style.setProperty("--glow", .9);
  });
  hero.addEventListener("pointerleave", () => {
    ["--mx", "--my"].forEach(k => hero.style.setProperty(k, 0));
    hero.style.setProperty("--glow", 0);
  });
  hero.querySelectorAll(".fl").forEach(el => el.style.setProperty("--d", el.dataset.d));

  /* ปุ่มดึงดูดตามเมาส์ */
  hero.querySelectorAll(".hero-cta .pill-btn").forEach(b => {
    b.addEventListener("pointermove", e => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px, ${(e.clientY - r.top - r.height / 2) * .3}px)`;
    });
    b.addEventListener("pointerleave", () => { b.style.transform = ""; });
  });

  /* ตัวเลขสถิติวิ่งขึ้น */
  const el = document.getElementById("statItems");
  let busy = false;
  if (el) new MutationObserver(() => {
    if (busy) return;
    const to = parseInt(el.textContent, 10);
    if (!(to > 0)) return;
    busy = true;
    const t0 = performance.now();
    const step = t => {
      const k = Math.min(1, (t - t0) / 900);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step); else setTimeout(() => { busy = false; }, 50);
    };
    requestAnimationFrame(step);
  }).observe(el, { childList: true, characterData: true, subtree: true });
})();
