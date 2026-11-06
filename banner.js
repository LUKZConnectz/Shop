/* ============ แบนเนอร์รูปภาพแบบเลื่อน ============ */
(function () {
  const root = document.getElementById("top");
  const track = document.getElementById("bnTrack");
  if (!root || !track || typeof BANNER === "undefined" || !BANNER.slides.length) return;
  const slides = BANNER.slides, n = slides.length;
  const dotsEl = document.getElementById("bnBars"), countEl = document.getElementById("bnCount");
  root.style.setProperty("--ms", (BANNER.ms || 5000) + "ms");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

  track.innerHTML = slides.map((s, i) => {
    const img = `<img src="${esc(s.img)}" alt="${esc(s.alt || "แบนเนอร์")}" width="2000" height="500" decoding="async" draggable="false" ${i ? 'loading="lazy"' : ""}>`;
    return `<div class="bn-slide" role="group" aria-roledescription="slide" aria-label="${i + 1} จาก ${n}">${s.href ? `<a href="${esc(s.href)}" draggable="false">${img}</a>` : img}</div>`;
  }).join("");
  dotsEl.innerHTML = slides.map((_, i) => `<button type="button" role="tab" aria-label="สไลด์ที่ ${i + 1}" data-i="${i}"><span></span></button>`).join("");
  if (n < 2) root.classList.add("single");

  let cur = 0, timer = 0, paused = false;
  function go(i, user) {
    cur = (i + n) % n;
    track.style.transform = `translateX(${-cur * 100}%)`;
    [...track.children].forEach((el, k) => { el.setAttribute("aria-hidden", k === cur ? "false" : "true"); el.inert = k !== cur; });
    [...dotsEl.children].forEach((d, k) => { d.classList.remove("on"); d.setAttribute("aria-selected", k === cur); });
    void dotsEl.offsetWidth; dotsEl.children[cur].classList.add("on");
    countEl.textContent = String(cur + 1).padStart(2, "0") + " / " + String(n).padStart(2, "0");
    if (user) restart();
  }
  function restart() {
    clearInterval(timer);
    if (reduce || n < 2 || paused) return;
    timer = setInterval(() => { if (!document.hidden) go(cur + 1); }, BANNER.ms || 5000);
  }
  document.getElementById("bnPrev").addEventListener("click", () => go(cur - 1, true));
  document.getElementById("bnNext").addEventListener("click", () => go(cur + 1, true));
  dotsEl.addEventListener("click", e => { const b = e.target.closest("[data-i]"); if (b) go(+b.dataset.i, true); });
  root.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") go(cur - 1, true);
    if (e.key === "ArrowRight") go(cur + 1, true);
  });
  root.addEventListener("mouseenter", () => { paused = true; root.classList.add("paused"); clearInterval(timer); });
  root.addEventListener("mouseleave", () => { paused = false; root.classList.remove("paused"); go(cur); restart(); });
  root.addEventListener("focusin", () => { paused = true; clearInterval(timer); });
  root.addEventListener("focusout", () => { paused = false; restart(); });

  /* ปัดซ้าย-ขวา (นิ้วและเมาส์) */
  const view = root.querySelector(".bn-view");
  let sx = 0, sy = 0, dx = 0, down = false, lock = "";
  view.addEventListener("pointerdown", e => { down = true; sx = e.clientX; sy = e.clientY; dx = 0; lock = ""; track.style.transition = "none"; });
  view.addEventListener("pointermove", e => {
    if (!down) return;
    dx = e.clientX - sx;
    if (!lock && Math.hypot(dx, e.clientY - sy) > 8) lock = Math.abs(dx) > Math.abs(e.clientY - sy) ? "x" : "y";
    if (lock === "x") track.style.transform = `translateX(calc(${-cur * 100}% + ${dx}px))`;
  });
  let moved = false;
  view.addEventListener("click", e => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  const end = () => {
    if (!down) return; down = false; track.style.transition = "";
    moved = lock === "x" && Math.abs(dx) > 6; setTimeout(() => { moved = false; }, 0);
    if (lock === "x" && Math.abs(dx) > view.offsetWidth * .12) go(cur + (dx < 0 ? 1 : -1), true); else go(cur);
  };
  view.addEventListener("pointerup", end); view.addEventListener("pointercancel", end); view.addEventListener("pointerleave", end);
  view.addEventListener("dragstart", e => e.preventDefault());

  go(0); restart();
  try { if (typeof renderIcons === "function") renderIcons(); } catch (e) {}
})();
