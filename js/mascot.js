/* ============ มาสคอตร้าน (รูปจริง 2 อารมณ์) ============
   wow   = ปกติ/ตกใจ/สงสัย   → ตอนรอ, ตอนเกิดข้อผิดพลาด, สินค้าหมด
   happy = ยกนิ้ว ดีใจ        → ตอนกด, ใส่ตะกร้า, สั่งซื้อ/บันทึกสำเร็จ */
(function () {
  /* แอดมินปิดมาสคอตได้ที่ ระบบแอดมิน > ตั้งค่าร้าน */
  try {
    const cfg = JSON.parse(localStorage.getItem("phumin-sb-settings") || "null");
    if (cfg && cfg.mascot && cfg.mascot.enabled === false) return;
  } catch (e) {}
  const IMG = { wow: "images/mascot-wow.png", happy: "images/mascot-happy.png" };
  const LINES = [
    "สวัสดีค่ะ! กดดูสินค้าได้เลย",
    "ทุกชิ้นทดสอบทุกปุ่มก่อนส่งนะ",
    "มีรีวิวจากลูกค้าจริงให้ดูด้วย",
    "ติดตามพัสดุได้ที่เมนูเลย",
    "ชอบเมาส์ตัวไหนบอกน้องได้นะ",
    "มีรับประกันร้าน 30–90 วัน"
  ];
  const GOOD = ["เยี่ยมเลย!", "เรียบร้อยค่ะ!", "สำเร็จแล้วนะ!", "ดีมากเลย!"];
  const OOPS = ["เอ๊ะ! ลองเช็กอีกทีนะ", "อุ๊ย! มีอะไรผิดนิดหน่อย", "เอ๊ะ! ยังไม่ได้เลยนะ"];
  const pick = a => a[Math.floor(Math.random() * a.length)];

  const el = document.createElement("button");
  el.id = "mascot";
  el.type = "button";
  el.setAttribute("aria-label", "มาสคอตร้าน กดเพื่อคุยด้วย");
  el.innerHTML = `
    <span class="mk-bubble" role="status" aria-live="polite"></span>
    <span class="mk-body"><span class="mk-wrap">
      <img class="mk-img mk-wow" src="${IMG.wow}" alt="" draggable="false">
      <img class="mk-img mk-happy" src="${IMG.happy}" alt="" draggable="false">
    </span></span>`;
  document.body.appendChild(el);
  const bubble = el.querySelector(".mk-bubble");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const inAdmin = () => document.body.classList.contains("view-admin");

  let hideT = 0, moodT = 0;
  function say(text, ms = 3200) {
    bubble.textContent = text;
    el.classList.add("talk");
    clearTimeout(hideT);
    hideT = setTimeout(() => el.classList.remove("talk"), ms);
  }
  function hop() { el.classList.remove("hop"); void el.offsetWidth; el.classList.add("hop"); }
  function shake() { el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); }
  function mood(m, ms = 2600) {
    el.classList.toggle("happy", m === "happy");
    clearTimeout(moodT);
    if (m === "happy") moodT = setTimeout(() => el.classList.remove("happy"), ms);
  }
  const happy = (text, ms) => { mood("happy", ms || 2600); hop(); say(text || pick(GOOD), ms || 2600); };
  const wow = text => { mood("wow"); shake(); say(text || pick(OOPS), 2800); };

  /* กดมาสคอต → ยกนิ้ว + คุย */
  let last = -1;
  el.addEventListener("click", () => {
    let i; do { i = Math.floor(Math.random() * LINES.length); } while (i === last);
    last = i; happy(LINES[i], 3200);
  });

  /* ฟังฟังก์ชัน toast ของเว็บ: สำเร็จ = ดีใจ, ผิดพลาด = ตกใจ */
  if (typeof window.toast === "function") {
    const orig = window.toast;
    window.toast = function (msg, icon) {
      const r = orig.apply(this, arguments);
      if (!inAdmin()) {
        if (icon === "check" || icon === "party-popper") happy(icon === "party-popper" ? "ขอบคุณที่อุดหนุนนะคะ!" : null);
        else if (icon === "alert-circle" || icon === "circle-x") wow();
      }
      return r;
    };
  }

  /* ทักตอนว่าง ๆ */
  if (!reduce) setInterval(() => {
    if (document.hidden || el.classList.contains("talk") || inAdmin()) return;
    if (Math.random() < .5) { hop(); say(pick(LINES), 2800); }
  }, 22000);
  setTimeout(() => { if (!inAdmin()) happy(LINES[0], 3000); }, 1800);

  /* ===== ลูกเล่นเพิ่ม ===== */
  const SECTION_LINES = {
    catalog: "ลองกรองหมวดดูนะ มีทั้งคีย์บอร์ด เมาส์ หูฟัง",
    reviews: "รีวิวจริงจากลูกค้าอยู่ตรงนี้เลย",
    track: "ใส่เลขออเดอร์ติดตามพัสดุได้นะ",
    consign: "มีของมือสอง? ฝากขายกับเราได้เลย",
    contact: "ทักมาถามได้ทุกช่องทางนะคะ"
  };
  const seen = new Set();

  /* 1) ลอยอีโมจิเด้งขึ้นตอนกด */
  function burst(n) {
    if (reduce) return;
    const r = el.getBoundingClientRect(), set = ["❤️", "✨", "⭐", "💖"];
    for (let i = 0; i < n; i++) {
      const p = document.createElement("span");
      p.className = "mk-fx";
      p.textContent = pick(set);
      p.style.left = (r.left + r.width / 2) + "px";
      p.style.top = (r.top + r.height * .3) + "px";
      p.style.setProperty("--dx", ((Math.random() - .5) * 120).toFixed(0) + "px");
      p.style.setProperty("--dy", (-60 - Math.random() * 70).toFixed(0) + "px");
      p.style.animationDelay = (i * 45) + "ms";
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1400 + i * 45);
    }
  }
  el.addEventListener("click", () => { if (!dragMoved) burst(5); });

  /* 2) กดรัว ๆ 5 ครั้ง → หมุนตัว */
  let taps = [];
  el.addEventListener("click", () => {
    if (dragMoved) return;
    const now = Date.now();
    taps = taps.filter(t => now - t < 1800); taps.push(now);
    if (taps.length >= 5) {
      taps = [];
      el.classList.remove("spin"); void el.offsetWidth; el.classList.add("spin");
      burst(14); say("วี้ววว! เวียนหัวแล้วนะ", 2600);
      setTimeout(() => el.classList.remove("spin"), 900);
    }
  });

  /* 3) ลากไปวางตรงไหนก็ได้ (จำตำแหน่งไว้) */
  let dragMoved = false, drag = null;
  try {
    const sv = JSON.parse(localStorage.getItem("mk-pos") || "null");
    if (sv) place(sv.x, sv.y);
  } catch (e) {}
  function place(x, y) {
    const w = el.offsetWidth || 80, h = el.offsetHeight || 90;
    x = Math.max(4, Math.min(innerWidth - w - 4, x));
    y = Math.max(4, Math.min(innerHeight - h - 4, y));
    el.style.left = x + "px"; el.style.top = y + "px"; el.style.bottom = "auto";
    el.classList.toggle("on-right", x > innerWidth / 2);
  }
  el.addEventListener("pointerdown", e => {
    try { el.setPointerCapture(e.pointerId); } catch (err) {}
    const r = el.getBoundingClientRect();
    drag = { ox: e.clientX - r.left, oy: e.clientY - r.top, sx: e.clientX, sy: e.clientY };
    dragMoved = false;
  });
  addEventListener("pointermove", e => {
    if (!drag) return;
    if (!dragMoved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 8) return;
    if (!dragMoved) { dragMoved = true; el.classList.add("dragging"); say("ยกน้องไปไหนคะ?", 1800); }
    place(e.clientX - drag.ox, e.clientY - drag.oy);
  });
  ["pointerup", "pointercancel"].forEach(t => addEventListener(t, endDrag));
  function endDrag() {
    if (!drag) return;
    drag = null;
    if (dragMoved) {
      el.classList.remove("dragging"); hop(); say("ตรงนี้ก็สบายดีนะ", 1800);
      try { const r = el.getBoundingClientRect(); localStorage.setItem("mk-pos", JSON.stringify({ x: r.left, y: r.top })); } catch (e) {}
      setTimeout(() => { dragMoved = false; }, 0);
    }
  }
  addEventListener("resize", () => { if (el.style.top) place(parseFloat(el.style.left), parseFloat(el.style.top)); });

  /* 4) พูดตามส่วนที่ลูกค้าเลื่อนไปถึง */
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => es.forEach(en => {
      const id = en.target.id;
      if (!en.isIntersecting || seen.has(id) || inAdmin()) return;
      seen.add(id); hop(); say(SECTION_LINES[id], 3000);
    }), { threshold: .35 });
    Object.keys(SECTION_LINES).forEach(id => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* 5) นิ่งนาน → หลับ (zZz) ขยับเมาส์/แตะ → ตื่น */
  let sleepT = 0;
  function wake() {
    clearTimeout(sleepT);
    if (el.classList.contains("sleep")) { el.classList.remove("sleep"); hop(); say("อ๊ะ! ตื่นแล้วค่ะ", 1800); }
    sleepT = setTimeout(() => { if (!inAdmin() && !document.hidden) { el.classList.add("sleep"); say("zZz...", 2200); } }, 45000);
  }
  ["pointermove", "keydown", "scroll", "touchstart"].forEach(ev => addEventListener(ev, wake, { passive: true }));
  wake();

  /* 6) ชี้เมาส์ที่น้อง → ทักทาย */
  let hoverT = 0;
  el.addEventListener("pointerenter", e => {
    if (e.pointerType !== "mouse") return;
    if (el.classList.contains("talk") || el.classList.contains("sleep")) return;
    clearTimeout(hoverT); hoverT = setTimeout(() => say("กดที่น้องได้นะ มีของเล่นซ่อนอยู่~", 2200), 400);
  });
  el.addEventListener("pointerleave", () => clearTimeout(hoverT));
})();
