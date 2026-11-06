/* ============ CHECKOUT ============ */
const payOpt = (val, icon, title, sub) => `
  <label class="pay-opt ${selectedPay === val ? "on" : ""}" data-pay="${val}">
    <input type="radio" name="pay" value="${val}" ${selectedPay === val ? "checked" : ""}>
    <span>${ic(icon)}<b style="font-weight:500">${title}</b><small>${sub}</small></span>
  </label>`;

function openCheckout() {
  if (cartCount() === 0) return;
  if (!user && USE_SB) {
    pendingAction = "checkout";
    renderAuth("login");
    return openModal("authModal");
  }
  const pr = cartPricing(selectedPay);
  $("checkoutTitle").textContent = "ยืนยันการสั่งซื้อ";
  $("checkoutBody").innerHTML = `
    <form id="checkoutForm" novalidate class="form-grid">
      <div class="field" data-field="name">
        <label for="cName">ชื่อ-นามสกุล</label>
        <input id="cName" autocomplete="name" value="${esc(user?.name)}">
        <div class="err">กรุณากรอกชื่อ-นามสกุล (อย่างน้อย 2 ตัวอักษร)</div>
      </div>
      <div class="field" data-field="phone">
        <label for="cPhone">เบอร์โทรศัพท์</label>
        <input id="cPhone" inputmode="tel" autocomplete="tel" value="${esc(user?.phone)}">
        <div class="err">เบอร์โทรต้องขึ้นต้นด้วย 0 และมี 9–10 หลัก</div>
      </div>
      <div class="field" data-field="address">
        <label for="cAddr">ที่อยู่จัดส่ง</label>
        <textarea id="cAddr" autocomplete="street-address" placeholder="บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์">${esc(user?.address)}</textarea>
        <div class="err">กรุณากรอกที่อยู่จัดส่งให้ครบ (อย่างน้อย 10 ตัวอักษร)</div>
      </div>
      <div>
        <span class="field-label">วิธีชำระเงิน</span>
        <div class="pay">
          ${payOpt("transfer", "landmark", "โอนเงิน", "ธนาคาร")}
          ${payOpt("promptpay", "qr-code", "พร้อมเพย์", "สแกน QR")}
          ${payOpt("cod", "banknote", "ปลายทาง", `+${COD_FEE} ฿`)}
        </div>
      </div>
      <div class="summary">
        <div><span>ยอดสินค้า</span><span>${fmt(pr.sub)}</span></div>
        <div><span>ค่าจัดส่ง</span><span>${pr.ship === 0 ? "ฟรี" : fmt(pr.ship)}</span></div>
        <div id="feeRow" class="${selectedPay === "cod" ? "" : "hidden"}"><span>ค่าธรรมเนียมปลายทาง</span><span>${fmt(COD_FEE)}</span></div>
        <div class="sum-total"><span>ยอดชำระ</span><span id="payTotal"></span></div>
      </div>
      <button type="submit" id="payBtn" class="btn-main">${ic("check")} ยืนยันคำสั่งซื้อ</button>
    </form>`;
  openModal("checkoutModal");

  const updateTotal = () => {
    $("payTotal").textContent = fmt(cartPricing(selectedPay).total);
    $("feeRow").classList.toggle("hidden", selectedPay !== "cod");
    document.querySelectorAll(".pay-opt").forEach(l => l.classList.toggle("on", l.dataset.pay === selectedPay));
  };
  document.querySelectorAll('input[name="pay"]').forEach(r => r.addEventListener("change", () => {
    selectedPay = document.querySelector('input[name="pay"]:checked').value;
    updateTotal();
  }));
  [["cName", "name"], ["cPhone", "phone"], ["cAddr", "address"]].forEach(([id, key]) => {
    $(id).addEventListener("input", () => document.querySelector(`[data-field="${key}"]`).classList.remove("invalid"));
  });
  updateTotal();
  $("checkoutForm").addEventListener("submit", submitOrder);
}

async function submitOrder(e) {
  e.preventDefault();
  if (!user && USE_SB) return openAccount();
  const name = $("cName").value.trim();
  const phone = cleanPhone($("cPhone").value);
  const address = $("cAddr").value.trim();
  const checks = { name: name.length >= 2, phone: validPhone(phone), address: address.length >= 10 };
  let ok = true;
  Object.entries(checks).forEach(([k, v]) => {
    document.querySelector(`[data-field="${k}"]`).classList.toggle("invalid", !v);
    if (!v) ok = false;
  });
  if (!ok) return toast("กรุณาตรวจสอบข้อมูลที่กรอก", "alert-circle");

  const btn = $("payBtn");
  btn.disabled = true;
  const items = cartLines().map(({ p, q }) => ({ id: Number(p.id), qty: q }));
  placingOrder = true;
  try {
    const res = await B.placeOrder({ items, customer: { name, phone, address }, payment: selectedPay });
    cart = {};
    persistCart();
    renderAll(false);
    if (user) B.updateProfile({ uid: user.uid, name, phone, address })
      .then(() => { user = { ...user, name, phone, address }; updateAccountBtn(); })
      .catch(() => {});

    const payHTML = {
      transfer: `<div class="bank">
          <div><span>ธนาคาร</span><b>${SHOP.bank}</b></div>
          <div><span>ชื่อบัญชี</span><b>${SHOP.accName}</b></div>
          <div><span>เลขบัญชี</span><b>${SHOP.accNo}</b></div>
          <div><span>ยอดโอน</span><b>${fmt(res.total)}</b></div>
        </div>
        <p class="note">โอนแล้วส่งสลิปพร้อมเลขออเดอร์ให้ทีมงานทางไลน์หรือโทรศัพท์</p>`,
      promptpay: ppBlock(res.total),
      cod: `<p class="note">ชำระ <b>${fmt(res.total)}</b> (รวมค่าธรรมเนียม) ตอนรับสินค้า</p>`
    }[selectedPay];

    $("checkoutTitle").textContent = "สั่งซื้อสำเร็จ";
    $("checkoutBody").innerHTML = `
      <div class="success">
        <div class="check">${ic("check")}</div>
        <h3>ขอบคุณที่ไว้วางใจ Phumin</h3>
        <div class="oid"><span>${shortId(res.orderId)}</span><button id="copyOid">คัดลอก</button></div>
        ${payHTML}
        ${selectedPay !== "cod" ? slipInput(res.orderId) : ""}
        ${user ? "" : `<p class="note">สั่งแบบไม่สมัครสมาชิก กรุณาจดเลขออเดอร์ไว้เพื่อติดต่อร้าน</p>`}
        <div class="form-grid">
          <button class="btn-main" id="viewOrders">${ic("receipt")} ดูคำสั่งซื้อของฉัน</button>
          <button class="ghost" data-close>กลับไปเลือกสินค้า</button>
        </div>
      </div>`;
    icons();
    $("copyOid").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(shortId(res.orderId)); toast("คัดลอกเลขออเดอร์แล้ว", "copy"); }
      catch { toast("คัดลอกไม่สำเร็จ", "alert-circle"); }
    });
    $("viewOrders").addEventListener("click", () => { renderAccount("orders"); openModal("accountModal"); });
    toast("สั่งซื้อสำเร็จ · " + shortId(res.orderId), "party-popper");
  } catch (ex) {
    btn.disabled = false;
    if (String(ex?.message || "").includes("OUT_OF_STOCK")) {
      sanitizeCart();
      renderAll(false);
      openDrawer();
      toast("สต็อกบางรายการเปลี่ยนแล้ว กรุณาตรวจสอบตะกร้า", "alert-circle");
    } else {
      toast(errMsg(ex), "alert-circle");
    }
  } finally {
    placingOrder = false;
  }
}

/* ============ SLIP ============ */
const slipInput = id => !B.attachSlip ? "" : `<label class="adm-btn slip-up" style="cursor:pointer;display:inline-block;margin:8px 0">แนบสลิปโอนเงิน<input type="file" accept="image/*" class="adm-file" data-slip-up="${esc(id)}"></label>`;
document.addEventListener("change", async e => {
  const i = e.target.closest("[data-slip-up]");
  if (!i || !i.files[0]) return;
  try {
    await B.attachSlip(i.dataset.slipUp, await shrinkImg(i.files[0]));
    i.closest("label").outerHTML = `<small style="color:#3ba55d">✓ แนบสลิปแล้ว ทีมงานจะตรวจสอบให้</small>`;
    toast("แนบสลิปแล้ว", "check");
  } catch (ex) { toast(errMsg(ex), "alert-circle"); }
});

/* ============ CONDITION REPORT ============ */
function reportHtml(p) {
  const def = { Keyboard: ["ทดสอบทุกปุ่มและสวิตช์", "ทดสอบการเชื่อมต่อ"], Mouse: ["ทดสอบปุ่มและล้อเมาส์", "ทดสอบเซนเซอร์"], Headset: ["ทดสอบเสียงซ้าย-ขวา", "ทดสอบไมค์"], Accessories: ["ตรวจสภาพและการใช้งาน"] };
  const t = (p.tested || "").split("\n").map(s => s.trim()).filter(Boolean);
  const list = t.length ? t : (def[p.cat] || []);
  return `<div class="report"><b>รายงานสภาพ</b>
    <ul>${list.map(x => `<li>${ic("check")}${esc(x)}</li>`).join("")}</ul>
    <div class="flaw"><b>ตำหนิ:</b> ${p.flaws ? esc(p.flaws) : "ยังไม่ระบุ · สอบถามร้านได้"}</div>
    <a class="line-link" href="https://line.me/R/ti/p/${encodeURIComponent(SHOP.line)}" target="_blank" rel="noopener">ขอดูรูปเพิ่ม / ถามร้านทาง LINE</a></div>`;
}

/* ============ PROMPTPAY QR (มาตรฐาน Thai QR / EMVCo) ============ */
function crc16(s) {
  let c = 0xFFFF;
  for (let i = 0; i < s.length; i++) {
    c ^= s.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) c = (c & 0x8000) ? ((c << 1) ^ 0x1021) & 0xFFFF : (c << 1) & 0xFFFF;
  }
  return c.toString(16).toUpperCase().padStart(4, "0");
}
function ppPayload(phone, amount) {
  const f = (id, v) => id + String(v.length).padStart(2, "0") + v;
  const target = "0066" + phone.replace(/\D/g, "").replace(/^0/, "");
  const body = f("00", "01") + f("01", "12") + f("29", f("00", "A000000677010111") + f("01", target)) +
    f("53", "764") + f("54", Number(amount).toFixed(2)) + f("58", "TH") + "6304";
  return body + crc16(body);
}
function ppBlock(total) {
  let qr = "";
  try {
    const q = qrcode(0, "M"); q.addData(ppPayload(SHOP.ppId, total)); q.make();
    qr = q.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
  } catch (e) { console.error(e); }
  return `<div class="pp">
    ${qr ? `<div class="pp-qr">${qr}</div>` : ""}
    <div class="pp-amt">${fmt(total)}</div>
    <div class="muted">พร้อมเพย์ · ${esc(SHOP.ppName)}${qr ? "" : "<br>เบอร์ " + esc(SHOP.ppId)}</div>
    <p class="note">${qr ? "สแกนด้วยแอปธนาคาร ยอดถูกใส่ให้อัตโนมัติ แล้วแนบสลิปด้านล่าง" : "โอนตามยอดด้านบน แล้วแนบสลิปด้านล่าง"}</p>
  </div>`;
}
