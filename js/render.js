/* ============ RENDER ============ */
function renderMarquee() {
  const items = [
    ["keyboard", "ทดสอบทุกปุ่มก่อนขาย"],
    ["shield-check", "ประกันร้าน 30–90 วัน"],
    ["activity", "เช็กสวิตช์และเซนเซอร์"],
    ["truck", "ส่งฟรีเมื่อซื้อครบ 2,000 ฿"],
    ["file-text", "รายงานสภาพโปร่งใส"]
  ];
  const one = items.map(([i, t]) => `<span>${ic(i)}${t}</span>`).join("");
  $("marquee").innerHTML = one + one;
}

function renderContact() {
  $("ctPhone").textContent = SHOP.phone;
  $("ctPhone").closest("li").style.display = /X/i.test(SHOP.phone) ? "none" : "";   /* ซ่อนถ้ายังเป็นเบอร์ตัวอย่าง */
  $("ctLine").textContent = "LINE " + SHOP.line;
  $("ctHours").textContent = SHOP.hours;
  $("modeTxt").textContent = USE_SB ? "เชื่อมต่อ Supabase แล้ว" : "โหมดทดลอง: ข้อมูลเก็บในเบราว์เซอร์นี้ (ใส่ SUPABASE_CONFIG เพื่อใช้งานจริง)";
}

function renderChips() {
  $("chips").innerHTML = CATS.map(c => {
    const n = products.filter(p => (c.key === "ทั้งหมด" || p.cat === c.key) && p.stock > 0).length;
    return `<button class="chip ${state.cat === c.key ? "active" : ""}" data-cat="${esc(c.key)}" aria-pressed="${state.cat === c.key}">${ic(c.icon)}${esc(c.label)} <small>${n}</small></button>`;
  }).join("");
}

function getList() {
  const q = state.q.toLowerCase();
  const [min, max] = PRICE_RANGES[state.price];
  const cmp = { low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price, name: (a, b) => a.name.localeCompare(b.name, "en") }[state.sort];
  const list = products.filter(p =>
    (state.cat === "ทั้งหมด" || p.cat === state.cat) &&
    (!q || `${p.name} ${p.brand} ${p.cat} ${p.spec}`.toLowerCase().includes(q)) &&
    p.price > min && p.price <= max &&
    (!state.inStock || p.stock > 0)
  );
  list.sort((a, b) => (a.stock <= 0) - (b.stock <= 0) || (cmp ? cmp(a, b) : Number(a.id) - Number(b.id)));
  return list;
}

function cardHTML(p, i) {
  const sold = p.stock <= 0;
  const inCart = cart[p.id] || 0;
  const maxed = inCart >= p.stock;
  const stockTxt = sold ? "ขายแล้ว" : p.stock === 1 ? "เหลือ 1 ชิ้น" : `มี ${p.stock} ชิ้น`;
  const btn = sold ? "ขายแล้ว" : maxed ? "ในตะกร้าแล้ว" : inCart ? "เพิ่มอีก" : "หยิบใส่ตะกร้า";
  return `
    <article class="card ${sold ? "sold" : ""}" data-open="${esc(p.id)}" tabindex="0" style="animation-delay:${Math.min(i, 12) * 40}ms">
      <div class="thumb">
        <span class="grade">${GRADE[p.grade]?.short || ""}</span>
        <span class="stock ${!sold && p.stock <= 1 ? "low" : ""}">${stockTxt}</span>
        <div class="ico">${pic(p)}</div>
        ${(p.imgs || []).length > 1 ? `<span class="cnt">${p.imgs.length} รูป</span>` : ""}
      </div>
      <div class="info">
        <div class="brand">${esc(p.brand)} · ${esc(catLabel(p.cat))}</div>
        <h3 class="name">${esc(p.name)}</h3>
        <p class="spec">${esc(p.spec)}<br>ประกันร้าน ${p.warranty} วัน</p>
        <div class="row">
          <div class="price">${fmt(p.price)}${p.orig > p.price ? `<s>${fmt(p.orig)}</s>` : ""}</div>
          <button class="add" data-add="${esc(p.id)}" ${sold || maxed ? "disabled" : ""}>${btn}</button>
        </div>
      </div>
    </article>`;
}

function renderGrid(animate = false) {
  const g = $("grid");
  g.classList.toggle("anim", animate);
  if (!productsLoaded) {
    $("count").textContent = "กำลังโหลดสินค้า...";
    g.innerHTML = `<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>`;
    return;
  }
  const list = getList();
  $("count").textContent = `พบ ${list.length} รายการ`;
  g.innerHTML = list.length
    ? list.map(cardHTML).join("")
    : `<div class="empty">${ic("search-x")}<p>ไม่พบสินค้าที่ตรงกับตัวกรอง</p><button class="ghost" data-reset>ล้างตัวกรอง</button></div>`;
}

function renderCart() {
  const lines = cartLines();
  const count = lines.reduce((a, l) => a + l.q, 0);
  const pr = cartPricing("transfer");
  $("cartCount").textContent = count;
  $("total").textContent = fmt(pr.total);
  $("checkoutBtn").disabled = count === 0;
  $("shipNote").textContent = count === 0 ? "" :
    pr.ship === 0 ? "ส่งฟรีแล้ว" : `ค่าจัดส่ง ${fmt(SHIP_FEE)} · ซื้ออีก ${fmt(SHIP_FREE - pr.sub)} เพื่อส่งฟรี`;

  $("items").innerHTML = count === 0
    ? `<div class="empty" style="padding:90px 0">${ic("shopping-bag")}<p>ยังไม่มีสินค้าในตะกร้า</p></div>`
    : lines.map(({ p, q }) => `
        <div class="item">
          <div class="item-icon">${pic(p)}</div>
          <div class="item-body">
            <div class="n">${esc(p.name)}</div>
            <div class="p">${fmt(p.price)} · ${esc(p.spec)}</div>
            <div class="qty">
              <button class="qbtn" data-dec="${esc(p.id)}" aria-label="ลดจำนวน">${ic("minus")}</button>
              <b>${q}</b>
              <button class="qbtn" data-inc="${esc(p.id)}" aria-label="เพิ่มจำนวน" ${q >= p.stock ? "disabled" : ""}>${ic("plus")}</button>
              <button class="rm" data-rm="${esc(p.id)}">${ic("trash-2")}ลบ</button>
            </div>
          </div>
        </div>`).join("");
}

/* สถิติยอดขายหน้าแรก (ไม่นับออเดอร์ที่ยกเลิก) */
function renderStats() {
  const set = (id, v) => { const el = $(id); if (el.textContent !== String(v)) el.textContent = v; };
  if (!B.salesStats) {   /* โหมดที่ยังไม่รองรับ: แสดงจำนวนสินค้าพร้อมขายแทน */
    set("statItems", products.filter(p => p.stock > 0).length);
    $("statLbl").textContent = "รายการพร้อมขาย";
    $("statCustBox").hidden = $("statRevBox").hidden = true;
    return;
  }
  const s = B.salesStats();
  set("statItems", s.sold); set("statCust", s.customers); set("statRev", fmt(s.revenue));
}

function renderAll(animate = false) {
  renderChips();
  renderGrid(animate);
  renderCart();
  renderStats();
  icons();
}

function updateAccountBtn() {
  $("accountBtn").classList.toggle("signed", !!user);
  $("accountBtn").setAttribute("aria-label", user ? "บัญชีของ " + user.name : "เข้าสู่ระบบ");
}
