/* ============ ADMIN ============ */
const isAdmin = () => !!user && (USE_SB ? user.admin === true : ADMIN_EMAILS.includes(String(user.email).toLowerCase()));
let adminTab = "dash";

function trashHtml() {
  const t = B.adminDeletedProducts();
  if (!t.length) return "";
  return `<div class="trash"><h4>ถังขยะ (${t.length})</h4>${t.map(p => `
    <div class="adm-row trash-row" data-id="${p.id}">
      <div class="adm-name"><div>${esc(p.name)}<small>${esc(p.brand)} · ${esc(catLabel(p.cat))}</small></div></div>
      <span></span><span></span>
      <span><button class="adm-btn" data-restore>กู้คืน</button> <button class="adm-btn" data-purge>ลบถาวร</button></span>
    </div>`).join("")}</div>`;
}

/* แถบย้อนกลับหลังลบ (6 วินาที) */
function showUndo(text, onUndo) {
  document.querySelectorAll(".undo").forEach(n => n.remove());
  const el = document.createElement("div");
  el.className = "undo";
  el.innerHTML = `<span>${esc(text)}</span><button type="button">ย้อนกลับ</button><i class="undo-bar"></i>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  const close = () => { el.classList.remove("show"); setTimeout(() => el.remove(), 350); };
  const timer = setTimeout(close, 6000);
  el.querySelector("button").onclick = () => { clearTimeout(timer); close(); onUndo(); };
}

function openAdmin() {
  if (!isAdmin()) return toast("ไม่มีสิทธิ์แอดมิน", "alert-circle");
  closeAll();
  location.hash = "#admin";
}
/* เข้าหน้าแอดมินผ่าน #admin (เฉพาะแอดมิน) */
function enterAdmin() {
  if (location.hash !== "#admin") return;
  if (!isAdmin()) {
    $("adminBody").innerHTML = `<div class="empty" style="padding:60px 0"><p>หน้านี้สำหรับแอดมินเท่านั้น</p></div>`;
    return;
  }
  renderAdmin("dash");
}
window.addEventListener("hashchange", enterAdmin);

let draft = { id: 0, imgs: [] };
async function renderAdmin(tab = adminTab, p = {}) {
  adminTab = tab;
  if (B.refresh) await B.refresh();
  const tabs = [["dash", "ภาพรวม"], ["prods", "สินค้า"], ["orders", "คำสั่งซื้อ"], ["cust", "ลูกค้า"], ["cs", "ฝากขาย"], ["rv", "รีวิว/เครดิต"], ["set", "ข้อมูลร้าน"], ["bn", "แบนเนอร์"], ["mk", "มาสคอต"], ["pr", "โปรโมชัน"]];
  $("adminBody").innerHTML = `<div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${k === tab || (k === "prods" && tab === "edit") ? "on" : ""}" data-adm="${k}">${l}</button>`).join("")}</div><div id="admBody" style="margin-top:14px"></div>`;
  const box = $("admBody");
  try {
    if (["cust", "set", "bn", "mk", "pr", "cs"].includes(tab)) { await adminPlusRender(tab, box); icons(); return; }
    if (tab === "prods") {
      box.innerHTML = `<button class="adm-btn dark" data-new style="margin-bottom:8px">+ เพิ่มสินค้า</button>` + products.map(p => `
        <div class="adm-row" data-id="${p.id}">
          <div class="adm-name">${p.img ? `<img class="adm-th" src="${esc(p.img)}" alt="">` : `<span class="adm-th"></span>`}<div>${esc(p.name)}<small>${esc(p.brand)} · ${esc(catLabel(p.cat))} · ${(p.imgs || []).length} รูป</small></div></div>
          <input type="number" min="0" data-f="price" value="${p.price}" aria-label="ราคา">
          <input type="number" min="0" data-f="stock" value="${p.stock}" aria-label="สต็อก">
          <span><button class="adm-btn" data-edit>แก้ไข</button> <button class="adm-btn dark" data-save>บันทึก</button> <button class="adm-btn" data-del>ลบ</button></span>
        </div>`).join("") + trashHtml();
    } else if (tab === "edit") {
      const v = (k, d = "") => esc(String(p[k] ?? d));
      box.innerHTML = `
        <form id="admForm" class="adm-form" novalidate>
          <div class="full"><label>ชื่อสินค้า</label><input name="name" value="${v("name")}"></div>
          <div><label>แบรนด์</label><input name="brand" value="${v("brand")}"></div>
          <div><label>หมวดหมู่</label><select name="cat">${CATS.slice(1).map(c => `<option value="${c.key}" ${c.key === p.cat ? "selected" : ""}>${c.label}</option>`).join("")}</select></div>
          <div class="full"><label>สเปก</label><input name="spec" value="${v("spec")}"></div>
          <div><label>ราคาขาย (฿)</label><input name="price" type="number" min="0" value="${v("price")}"></div>
          <div><label>ราคาใหม่เดิม (฿)</label><input name="orig" type="number" min="0" value="${v("orig")}"></div>
          <div><label>สต็อก</label><input name="stock" type="number" min="0" value="${v("stock", 0)}"></div>
          <div><label>เกรด</label><select name="grade">${["A", "B"].map(g => `<option ${g === p.grade ? "selected" : ""}>${g}</option>`).join("")}</select></div>
          <div><label>ประกัน (วัน)</label><input name="warranty" type="number" min="0" value="${v("warranty", 30)}"></div>
          <div class="full"><label>หัวข้อสภาพสินค้า (เว้นว่าง = ใช้ข้อความมาตรฐานของเกรด)</label><input name="gradeLabel" value="${v("gradeLabel")}" placeholder="${(GRADE[p.grade] || GRADE.A).label}"></div>
          <div class="full"><label>รายละเอียดสภาพสินค้า (เว้นว่าง = ใช้ข้อความมาตรฐานของเกรด)</label><textarea name="gradeDesc" rows="2" placeholder="${(GRADE[p.grade] || GRADE.A).desc}">${v("gradeDesc")}</textarea></div>
          <div class="full"><label>ผ่านการทดสอบ (หนึ่งบรรทัดต่อหนึ่งรายการ)</label><textarea name="tested" rows="3">${v("tested")}</textarea></div>
          <div class="full"><label>ตำหนิที่พบ</label><input name="flaws" value="${v("flaws")}" placeholder="เช่น มีรอยขีดข่วนเล็กน้อยด้านซ้าย"></div>
          <div class="full"><label>รูปสินค้า (รูปแรกคือรูปหลัก)</label><div class="adm-gal" id="admGal"></div>
            <label class="adm-btn" style="cursor:pointer;display:inline-block">+ เพิ่มรูป (เลือกได้หลายรูป)<input type="file" accept="image/*" multiple class="adm-file" id="admFiles"></label></div>
          <div class="full" style="display:flex;gap:8px"><button class="adm-btn dark" type="submit">บันทึกสินค้า</button><button type="button" class="adm-btn" data-adm="prods">ยกเลิก</button></div>
        </form>`;
      drawGal();
    } else if (tab === "rv") {
      const rv = await B.adminReviews(), cr = B.listCredits();
      const lbl = { pending: "รออนุมัติ", approved: "แสดงอยู่", hidden: "ซ่อน" };
      box.innerHTML = `<h4 style="font-weight:500;margin-bottom:8px">รีวิวจากลูกค้า (${rv.length})</h4>` + (rv.length ? rv.map(r => `
        <div class="order" data-rid="${r.id}">
          <div class="order-top"><b>${esc(r.name)} · ${"★".repeat(r.rating)}</b><span class="muted">${lbl[r.status] || r.status}</span></div>
          <div>${esc(r.text)}</div>${r.product ? `<div class="muted">${esc(r.product)}</div>` : ""}
          ${r.img ? `<img class="adm-th" style="width:56px;height:56px;margin-top:6px" src="${r.img}" alt="">` : ""}
          <div style="margin-top:8px;display:flex;gap:6px">
            ${r.status !== "approved" ? `<button class="adm-btn dark" data-rv="approved">อนุมัติ</button>` : `<button class="adm-btn" data-rv="hidden">ซ่อน</button>`}
            <button class="adm-btn" data-rv="del">ลบ</button>
          </div>
        </div>`).join("") : `<div class="muted">ยังไม่มีรีวิว</div>`) + `
        <h4 style="font-weight:500;margin:18px 0 8px">เครดิตการขาย (รูปหลักฐาน เช่น แชตลูกค้า พัสดุ)</h4>
        <div class="adm-gal">${cr.map(c => `<div style="width:120px"><div class="adm-img" style="width:120px;height:120px"><img src="${c.img}" alt=""><button class="rm" data-crdel="${c.id}">ลบ</button></div><input class="cr-cap" data-crcap="${c.id}" value="${esc(c.caption)}" placeholder="คำอธิบาย"></div>`).join("")}</div>
        <label class="adm-btn" style="cursor:pointer;display:inline-block">+ เพิ่มรูปเครดิต<input type="file" accept="image/*" multiple class="adm-file" id="crFiles"></label>`;
    } else {
      const orders = await B.adminOrders();
      if (tab === "dash") {
        const live = orders.filter(o => o.status !== "cancelled");
        const low = products.filter(p => p.stock <= 1);
        box.innerHTML = `
          <div class="adm-stats">
            <div><b data-to="${orders.length}">${orders.length}</b><small>คำสั่งซื้อทั้งหมด</small></div>
            <div><b data-to="${orders.filter(o => (o.status || "pending") === "pending").length}">${orders.filter(o => (o.status || "pending") === "pending").length}</b><small>รอชำระเงิน</small></div>
            <div><b>${fmt(live.reduce((s, o) => s + o.total, 0))}</b><small>ยอดขายรวม</small></div>
            <div><b data-to="${products.length}">${products.length}</b><small>สินค้าในร้าน</small></div>
          </div>
          <h4 style="font-weight:500;margin-bottom:8px">สต็อกใกล้หมด</h4>
          ${low.length ? low.map(p => `<div class="order-top"><span>${esc(p.name)}</span><b>${p.stock ? "เหลือ " + p.stock : "หมด"}</b></div>`).join("") : `<div class="muted">ไม่มี</div>`}`;
      } else {
        box.innerHTML = orders.length ? orders.map(o => `
          <div class="order" data-oid="${o.id}">
            <div class="order-top"><code>${shortId(o.id)}</code><b>${fmt(o.total)}</b></div>
            <div class="muted">${new Date(toMs(o.created_at)).toLocaleString("th-TH")} · ${payLabel(o.payment)}</div>
            <div style="margin:6px 0">${esc(o.customer?.name || "")} · ${esc(o.customer?.phone || "")}<br>${esc(o.customer?.address || "")}</div>
            <div>${(o.items || []).map(i => `${esc(i.name)} × ${i.qty}`).join("<br>")}</div>
            ${o.slip ? `<div style="margin-top:8px"><img class="adm-th" style="width:56px;height:56px;cursor:zoom-in" src="${o.slip}" data-slip alt="สลิป"> <small>แนบสลิปแล้ว</small></div>` : (o.payment !== "cod" ? `<small class="muted">ยังไม่แนบสลิป</small>` : "")}
            ${shipForm(o)}
            <select class="sel" data-status style="margin-top:8px">${Object.entries(ORDER_STATUS).map(([k, l]) => `<option value="${k}" ${(o.status || "pending") === k ? "selected" : ""}>${l}</option>`).join("")}</select>
          </div>`).join("") : `<div class="empty" style="padding:40px 0"><p>ยังไม่มีคำสั่งซื้อ</p></div>`;
      }
    }
  } catch (e) { console.error(e); box.innerHTML = `<div class="empty"><p>${esc(errMsg(e))}</p></div>`; }
  icons();
}

function drawGal() {
  $("admGal").innerHTML = draft.imgs.length ? draft.imgs.map((src, i) => `
    <div class="adm-img"><img src="${esc(src)}" alt="">${i ? `<button class="mk" type="button" data-main="${i}">ตั้งเป็นหลัก</button>` : `<span class="cover">รูปหลัก</span>`}<button class="rm" type="button" data-rm="${i}">ลบ</button></div>`).join("")
    : `<small class="muted">ยังไม่มีรูป</small>`;
}
function editProduct(id) {
  const p = id ? find(id) : { cat: "Keyboard", grade: "A", warranty: 30, stock: 1 };
  draft = { id: id || 0, imgs: [...(p.imgs || [])] };
  renderAdmin("edit", p);
}
/* ย่อรูปเป็น JPEG ไม่เกิน 1200px เพื่อเก็บใน localStorage ได้ */
function shrinkImg(file) {
  return new Promise((ok, no) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const k = Math.min(1, 1200 / Math.max(im.width, im.height)), c = document.createElement("canvas");
      c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); ok(c.toDataURL("image/jpeg", .82));
    };
    im.onerror = () => { URL.revokeObjectURL(url); no(new Error("อ่านรูปไม่ได้")); };
    im.src = url;
  });
}

$("adminBody").addEventListener("click", async e => {
  const t = e.target.closest("[data-adm]");
  if (t) return renderAdmin(t.dataset.adm);
  if (e.target.closest("[data-new]")) return editProduct(0);
  const rm = e.target.closest("[data-rm]"), mk = e.target.closest("[data-main]");
  if (rm) { draft.imgs.splice(+rm.dataset.rm, 1); return drawGal(); }
  if (mk) { const [x] = draft.imgs.splice(+mk.dataset.main, 1); draft.imgs.unshift(x); return drawGal(); }
  if (e.target.matches("[data-slip]")) { LB.list = [e.target.src]; LB.i = 0; $("lb").classList.add("show"); return lbShow(); }
  const row = e.target.closest(".adm-row");
  if (!row) return;
  const id = Number(row.dataset.id), p = find(id);
  try {
    if (e.target.closest("[data-edit]")) return editProduct(id);
    if (e.target.closest("[data-save]")) {
      const price = Number(row.querySelector('[data-f="price"]').value), stock = Number(row.querySelector('[data-f="stock"]').value);
      if (!(price >= 0) || !(stock >= 0)) return toast("ข้อมูลไม่ถูกต้อง", "alert-circle");
      await B.adminSaveProduct({ id, price, stock });
      toast("บันทึกแล้ว", "check");
    } else if (e.target.closest("[data-del]")) {
      row.classList.add("gone");
      await new Promise(r => setTimeout(r, 260));
      await B.adminDeleteProduct(id);
      renderAdmin("prods");
      showUndo(`ลบ ${p.name} แล้ว`, () => B.adminRestoreProduct(id).then(() => renderAdmin("prods")));
    }
  } catch (ex) { toast(errMsg(ex), "alert-circle"); }
});
$("adminBody").addEventListener("change", async e => {
  if (e.target.matches("[data-status]")) {
    try { await B.adminSetStatus(e.target.closest("[data-oid]").dataset.oid, e.target.value); toast("อัปเดตสถานะแล้ว", "check"); renderStats(); }
    catch (ex) { toast(errMsg(ex), "alert-circle"); }
  } else if (e.target.id === "admFiles") {
    try {
      for (const f of e.target.files) draft.imgs.push(await shrinkImg(f));
      e.target.value = ""; drawGal();
    } catch (ex) { toast(errMsg(ex), "alert-circle"); }
  }
});
$("adminBody").addEventListener("submit", async e => {
  if (e.target.id !== "admForm") return;
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target));
  if (!f.name.trim() || !(Number(f.price) > 0)) return toast("กรอกชื่อและราคา", "alert-circle");
  try {
    await B.adminSaveProduct({
      id: draft.id || undefined, name: f.name.trim(), brand: f.brand.trim() || "Generic", cat: f.cat, spec: f.spec.trim(),
      price: Number(f.price), orig: Number(f.orig) || Number(f.price), grade: f.grade, warranty: Number(f.warranty) || 0,
      tested: f.tested.trim(), flaws: f.flaws.trim(), gradeLabel: (f.gradeLabel || "").trim(), gradeDesc: (f.gradeDesc || "").trim(), stock: Number(f.stock) || 0, imgs: draft.imgs, img: draft.imgs[0] || ""
    });
    toast("บันทึกสินค้าแล้ว", "check"); renderAdmin("prods");
  } catch (ex) { toast(errMsg(ex), "alert-circle"); }
});

/* รีวิว/เครดิต (แอดมิน) */
$("adminBody").addEventListener("click", async e => {
  try {
    const b = e.target.closest("[data-rv]"), d = e.target.closest("[data-crdel]");
    if (b) { await B.adminReviewOp(b.closest("[data-rid]").dataset.rid, b.dataset.rv); renderAdmin("rv"); renderReviews(); }
    if (d) { await B.adminCreditOp("del", d.dataset.crdel); renderAdmin("rv"); renderReviews(); }
  } catch (ex) { toast(errMsg(ex), "alert-circle"); }
});
$("adminBody").addEventListener("change", async e => {
  try {
    if (e.target.id === "crFiles") {
      for (const f of e.target.files) await B.adminCreditOp("add", 0, await shrinkImg(f));
      renderAdmin("rv"); renderReviews();
    } else if (e.target.matches("[data-crcap]")) { await B.adminCreditOp("cap", e.target.dataset.crcap, e.target.value.trim()); renderReviews(); }
  } catch (ex) { toast(errMsg(ex), "alert-circle"); }
});

/* บันทึกเลขพัสดุ (แอดมิน) */
$("adminBody").addEventListener("click", async e => {
  const b = e.target.closest("[data-ship-save]");
  if (!b) return;
  const box = b.closest(".ship-form"), carrier = box.querySelector("[data-carrier]").value, no = box.querySelector("[data-trackno]").value.trim();
  if (!carrier || !no) return toast("เลือกขนส่งและกรอกเลขพัสดุ", "alert-circle");
  try { await B.adminSetShipping(box.dataset.oid, { carrier, no }); toast("บันทึกการจัดส่งแล้ว", "check"); renderAdmin("orders"); }
  catch (ex) { toast(errMsg(ex), "alert-circle"); }
});

/* กู้คืน / ลบถาวรจากถังขยะ */
$("adminBody").addEventListener("click", async e => {
  const r = e.target.closest("[data-restore],[data-purge]");
  if (!r) return;
  const id = Number(r.closest("[data-id]").dataset.id);
  try {
    if (r.hasAttribute("data-restore")) { await B.adminRestoreProduct(id); toast("กู้คืนสินค้าแล้ว", "check"); }
    else {
      if (!(await askSheet({ title: "ลบถาวร?", msg: "ย้อนกลับไม่ได้", okText: "ลบถาวร", danger: true }))) return;
      await B.adminPurgeProduct(id); toast("ลบถาวรแล้ว", "circle-x");
    }
    renderAdmin("prods");
  } catch (ex) { toast(errMsg(ex), "alert-circle"); }
});

/* ตัวเลขในภาพรวมวิ่งขึ้นทุกครั้งที่เปิดแท็บ */
const _renderAdminBase = renderAdmin;
renderAdmin = async function (tab = adminTab, p = {}) {
  await _renderAdminBase(tab, p);
  if (tab === "dash") countUp($("admBody"));
  if (tab === "prods") adminPlusProducts();
  if (tab === "orders") adminPlusOrders();
};
