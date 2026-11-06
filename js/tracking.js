/* ============ ติดตามการจัดส่ง ============ */
const CARRIERS = ["ไปรษณีย์ไทย", "Kerry Express", "Flash Express", "J&T Express", "Shopee Express", "Ninja Van", "อื่นๆ"];
const STEP_KEYS = ["pending", "paid", "shipped", "delivered"];
const digitsOnly = s => String(s || "").replace(/\D/g, "");

function stepsHtml(status) {
  if (status === "cancelled") return `<div class="trk-cancel">${ic("circle-x")} ออเดอร์นี้ถูกยกเลิก</div>`;
  const cur = Math.max(0, STEP_KEYS.indexOf(status || "pending"));
  const ratio = (cur / (STEP_KEYS.length - 1)).toFixed(3);
  const icons = { pending: "clock", paid: "banknote", shipped: "truck", delivered: "package" };
  return `<ol class="trk" style="--p:${ratio}">${STEP_KEYS.map((k, i) => `
    <li class="${i <= cur ? "done" : ""}${i === cur ? " now" : ""}" style="--i:${i}">
      <span></span><div>${ic(icons[k], "trk-ic")}<b>${ORDER_STATUS[k]}</b></div>
    </li>`).join("")}</ol>`;
}
/* แสดงในหน้า "คำสั่งซื้อ" ของลูกค้า */
function shipLine(o) {
  if (o.status === "cancelled") return "";
  return `<div class="ship-box">${stepsHtml(o.status)}${o.ship
    ? `<div class="muted">ขนส่ง ${esc(o.ship.carrier)} · เลขพัสดุ <b>${esc(o.ship.no)}</b></div>`
    : `<div class="muted">ยังไม่มีเลขพัสดุ</div>`}</div>`;
}
/* ช่องกรอกเลขพัสดุ (แอดมิน) */
function shipForm(o) {
  if (o.status === "cancelled") return "";
  return `<div class="ship-form" data-oid="${o.id}">
    <select class="sel" data-carrier><option value="">เลือกขนส่ง</option>${CARRIERS.map(c => `<option ${o.ship?.carrier === c ? "selected" : ""}>${c}</option>`).join("")}</select>
    <input data-trackno placeholder="เลขพัสดุ" value="${esc(o.ship?.no || "")}">
    <button class="adm-btn dark" data-ship-save type="button">บันทึกการจัดส่ง</button>
  </div>`;
}

/* โหมดที่ยังไม่รองรับการติดตาม: ซ่อนเมนูและหน้านี้ */
if (!B.trackOrder) {
  document.querySelectorAll('[data-nav="track"]').forEach(a => a.hidden = true);
  $("track").hidden = true;
}
/* ผลลัพธ์: การ์ดพร้อมไทม์ไลน์ และเลขพัสดุคัดลอกได้ */
function resultHtml(r, code) {
  const d = r.created_at ? new Date(toMs(r.created_at)).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) : "";
  return `<article class="trk-card">
    <header class="trk-head"><div><small>รหัสออเดอร์</small><b>${esc(code.trim().toUpperCase())}</b></div>${d ? `<small>${d}</small>` : ""}</header>
    ${stepsHtml(r.status)}
    ${r.ship
      ? `<div class="trk-ship">
          <div class="trk-carrier">${ic("truck")}<span>${esc(r.ship.carrier)}</span></div>
          <div class="trk-no-row"><code class="trk-no">${esc(r.ship.no)}</code>
            <button class="trk-copy" type="button" data-copy="${esc(r.ship.no)}">${ic("copy")} คัดลอก</button></div>
          <small class="muted">นำเลขนี้ไปเช็กกับขนส่งได้โดยตรง</small>
        </div>`
      : `<p class="trk-wait">${ic("clock")} ยังไม่มีเลขพัสดุ ทางร้านจะอัปเดตเมื่อจัดส่งแล้ว</p>`}
    <div class="trk-items">${r.items.map(t => `<span>${esc(t)}</span>`).join("")}</div>
  </article>`;
}
function showEmpty() {
  $("trkResult").innerHTML = `<div class="trk-empty">${ic("package")}<p>ผลการติดตามจะแสดงที่นี่</p></div>`;
  icons();
}
showEmpty();

document.addEventListener("click", async e => {
  const c = e.target.closest("[data-copy]");
  if (!c) return;
  try { await navigator.clipboard.writeText(c.dataset.copy); }
  catch { const t = document.createElement("textarea"); t.value = c.dataset.copy; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); }
  toast("คัดลอกเลขพัสดุแล้ว", "check");
});

$("trkForm").addEventListener("submit", async e => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target));
  if (!f.code.trim() || digitsOnly(f.phone).length < 9) return ($("trkErr").textContent = "กรอกรหัสออเดอร์และเบอร์โทรให้ครบ");
  try {
    const r = await B.trackOrder(f.code, f.phone);
    if (!r) { showEmpty(); return ($("trkErr").textContent = "ไม่พบคำสั่งซื้อนี้ หรือเบอร์ไม่ตรงกับที่ใช้สั่งซื้อ"); }
    $("trkErr").textContent = "";
    $("trkResult").innerHTML = resultHtml(r, f.code);
    icons();
  } catch (ex) { $("trkErr").textContent = errMsg(ex); }
});
