/* ============ รีวิวและเครดิตการขาย ============ */
const starsTxt = n => "★".repeat(n) + "☆".repeat(5 - n);
let rvDraft = { rating: 5, img: "" };

/* ตัวเลขวิ่งขึ้นตอนเปิดหน้ารีวิว */
function countUp(root) {
  if (!root || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  root.querySelectorAll("[data-to]").forEach(el => {
    const to = parseFloat(el.dataset.to), dec = +(el.dataset.dec || 0), t0 = performance.now();
    const step = t => {
      const k = Math.min(1, (t - t0) / 800), v = to * (1 - Math.pow(1 - k, 3));
      el.textContent = v.toFixed(dec);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}
window.addEventListener("hashchange", () => { if (location.hash === "#reviews") countUp($("rvSummary")); });

async function renderReviews() {
  if (!B.listReviews) { $("reviews").hidden = true; document.querySelector('[data-nav="reviews"]').hidden = true; return; }
  if (B.refresh) await B.refresh();
  const rv = B.listReviews(), cr = B.listCredits(), s = B.salesStats();
  const avg = rv.length ? rv.reduce((n, r) => n + r.rating, 0) / rv.length : 0;
  $("rvSummary").innerHTML = `
    <div><strong ${rv.length ? `data-to="${avg}" data-dec="1"` : ""}>${rv.length ? avg.toFixed(1) : "–"}</strong><small class="${rv.length ? "gold" : ""}">${rv.length ? starsTxt(Math.round(avg)) : "ยังไม่มีคะแนน"}</small></div>
    <div><strong data-to="${rv.length}">${rv.length}</strong><small>รีวิว</small></div>
    <div><strong data-to="${s.sold}">${s.sold}</strong><small>ชิ้นที่ขายแล้ว</small></div>
    <div><strong data-to="${s.customers}">${s.customers}</strong><small>ลูกค้า</small></div>`;
  if (location.hash === "#reviews") countUp($("rvSummary"));
  $("rvList").innerHTML = rv.length ? rv.map(r => `
    <article class="rv-card" style="--i:${rv.indexOf(r)}">
      <div class="rv-stars">${starsTxt(r.rating)}</div>
      <p>${esc(r.text)}</p>
      ${r.img ? `<img class="rv-img" src="${r.img}" alt="รูปจากรีวิว" data-rvimg>` : ""}
      <div class="rv-by"><b>${esc(r.name)}</b>${r.product ? ` · ${esc(r.product)}` : ""}<br><small>${new Date(r.created_at).toLocaleDateString("th-TH")}</small></div>
    </article>`).join("") : `<div class="empty" style="padding:40px 0"><p>ยังไม่มีรีวิว เป็นคนแรกที่รีวิวสิ</p></div>`;
  $("crBlock").hidden = !cr.length;
  $("crList").innerHTML = cr.map((c, i) => `<figure class="cr-item" data-cr="${i}"><img src="${c.img}" alt="${esc(c.caption || "เครดิตการขาย")}" loading="lazy">${c.caption ? `<figcaption>${esc(c.caption)}</figcaption>` : ""}</figure>`).join("");
}

function openReviewForm() {
  rvDraft = { rating: 5, img: "" };
  $("reviewBody").innerHTML = `
    <form id="rvForm" novalidate class="form-grid">
      <div class="field"><label>ชื่อที่แสดง</label><input name="name" placeholder="เช่น คุณสมชาย" value="${esc(user?.name || "")}"></div>
      <div><span class="field-label">ให้คะแนน</span><div class="rv-pick" id="rvPick">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-star="${n}" class="on">★</button>`).join("")}</div></div>
      <div class="field"><label>สินค้าที่ซื้อ (ไม่บังคับ)</label><input name="product" list="rvProds" placeholder="พิมพ์หรือเลือกสินค้า"><datalist id="rvProds">${products.map(p => `<option value="${esc(p.name)}">`).join("")}</datalist></div>
      <div class="field"><label>รีวิวของคุณ</label><textarea name="text" placeholder="สภาพสินค้า การจัดส่ง การบริการ"></textarea></div>
      <div><label class="adm-btn" style="cursor:pointer;display:inline-block">แนบรูป (ไม่บังคับ)<input type="file" accept="image/*" class="adm-file" id="rvFile"></label> <small id="rvFileTxt" class="muted"></small></div>
      <div class="form-err" id="rvErr"></div>
      <button class="btn-main" type="submit">ส่งรีวิว</button>
      <p class="note">รีวิวจะแสดงหลังแอดมินตรวจสอบแล้ว</p>
    </form>`;
  openModal("reviewModal");
}

$("rvWrite").addEventListener("click", openReviewForm);
$("reviewBody").addEventListener("click", e => {
  const s = e.target.closest("[data-star]");
  if (!s) return;
  rvDraft.rating = +s.dataset.star;
  $("rvPick").querySelectorAll("button").forEach((b, i) => b.classList.toggle("on", i < rvDraft.rating));
});
$("reviewBody").addEventListener("change", async e => {
  if (e.target.id !== "rvFile" || !e.target.files[0]) return;
  try { rvDraft.img = await shrinkImg(e.target.files[0]); $("rvFileTxt").textContent = "แนบรูปแล้ว ✓"; }
  catch (ex) { $("rvErr").textContent = errMsg(ex); }
});
$("reviewBody").addEventListener("submit", async e => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target));
  if (f.name.trim().length < 2) return ($("rvErr").textContent = "กรุณากรอกชื่อ");
  if (f.text.trim().length < 5) return ($("rvErr").textContent = "กรุณาเขียนรีวิวอย่างน้อย 5 ตัวอักษร");
  try {
    await B.addReview({ name: f.name.trim(), rating: rvDraft.rating, product: f.product.trim(), text: f.text.trim(), img: rvDraft.img });
    closeAll(); toast("ส่งรีวิวแล้ว รอแอดมินอนุมัติ", "check");
  } catch (ex) { $("rvErr").textContent = errMsg(ex); }
});
document.addEventListener("click", e => {
  const img = e.target.closest("[data-rvimg]"), cr = e.target.closest("[data-cr]");
  if (img) { LB.list = [img.src]; LB.i = 0; }
  else if (cr) { LB.list = B.listCredits().map(c => c.img); LB.i = +cr.dataset.cr; }
  else return;
  $("lb").classList.add("show"); lbShow();
});
renderReviews();
