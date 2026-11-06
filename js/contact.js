/* ============ โปรไฟล์ติดต่อร้าน ============ */
(function () {
  const host = document.querySelector("footer#contact");
  if (!host) return;

  /* ใส่เบอร์จริงใน SHOP.phone ถ้ายังเป็น 08X-XXX-XXXX จะไม่แสดงการ์ดโทร */
  const hasPhone = !!SHOP.phone && !/X/i.test(SHOP.phone);
  const digits = (SHOP.phone || "").replace(/\D/g, "");
  const lineUrl = "https://line.me/R/ti/p/" + encodeURIComponent(SHOP.line || "");

  const hl = document.querySelector("header .logo-img");
  const logoSrc = hl ? hl.src : "";

  const cp = document.createElement("div");
  cp.className = "cp";
  cp.innerHTML = `
    <div class="cp-head">
      ${logoSrc ? `<img class="cp-logo" src="${logoSrc}" alt="Phumin">` : '<div class="cp-avatar"><span>P</span></div>'}
      <div class="cp-id">
        <h3 class="cp-name">Phumin</h3>
        <p class="cp-desc">ร้านคีย์บอร์ด เมาส์ และอุปกรณ์เสริมมือสองคัดคุณภาพ ทดสอบทุกชิ้นก่อนส่ง</p>
        <span class="cp-open" id="cpOpen"><i></i><span></span></span>
      </div>
    </div>
    <div class="cp-cards">
      ${hasPhone ? `<a class="cp-card" href="tel:${digits}">${ic("phone")}<small>โทรหาร้าน</small><b>${esc(SHOP.phone)}</b></a>` : ""}
      <a class="cp-card" href="${lineUrl}" target="_blank" rel="noopener">${ic("message-circle")}<small>LINE</small><b>${esc(SHOP.line || "")}</b></a>
      ${SHOP.fb ? `<a class="cp-card" href="${esc(SHOP.fb)}" target="_blank" rel="noopener">${ic("layout-grid")}<small>Facebook</small><b>เพจร้าน Phumin</b></a>` : ""}
      <div class="cp-card">${ic("clock")}<small>เวลาทำการ</small><b>${esc(SHOP.hours || "")}</b></div>
    </div>
    <div class="cp-actions">
      ${hasPhone ? `<button class="pill-btn" type="button" data-cp-copy="${esc(SHOP.phone)}">${ic("copy")} คัดลอกเบอร์</button>` : ""}
      ${SHOP.fb ? `<a class="pill-btn" href="${esc(SHOP.fb)}" target="_blank" rel="noopener">${ic("layout-grid")} เพจ Facebook</a>` : ""}
      <a class="pill-btn solid" href="#track">${ic("truck")} ติดตามพัสดุ</a>
    </div>`;
  host.appendChild(cp);

  /* เปิด/ปิดร้านตามเวลาไทย (จันทร์–เสาร์ 10:00–19:00) */
  const th = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
  const d = th.getDay(), h = th.getHours();
  const open = d >= 1 && d <= 6 && h >= 10 && h < 19;
  const badge = cp.querySelector("#cpOpen");
  badge.classList.toggle("on", open);
  badge.querySelector("span").textContent = open ? "เปิดอยู่ตอนนี้" : "ปิดอยู่ตอนนี้";

  cp.addEventListener("click", async e => {
    const b = e.target.closest("[data-cp-copy]");
    if (!b) return;
    try { await navigator.clipboard.writeText(b.dataset.cpCopy); }
    catch { const t = document.createElement("textarea"); t.value = b.dataset.cpCopy; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); }
    toast("คัดลอกเบอร์แล้ว", "check");
  });

  /* การ์ดเอียงตามเมาส์เล็กน้อย */
  cp.querySelectorAll(".cp-card").forEach(c => {
    c.addEventListener("pointermove", e => {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      c.style.transform = `perspective(600px) rotateX(${-y * 6}deg) rotateY(${x * 8}deg) translateY(-3px)`;
    });
    c.addEventListener("pointerleave", () => { c.style.transform = ""; });
  });
  icons();
})();
