/* ============ ฝากขาย ============ */
const CS_STEPS = [["ข้อมูลสินค้า"], ["รูปภาพ"], ["ส่งคำขอ"]];
const CS_STATUS = { pending: "รอตรวจสอบ", listed: "ลงขายแล้ว", sold: "ขายแล้ว", paid: "จ่ายเงินแล้ว", rejected: "ไม่รับฝาก" };
let csPhotos = [];

function csNet(price) { return Math.max(0, Math.round(Number(price || 0) * (1 - CONSIGN.commission / 100))); }

(function buildConsign() {
  const sec = $("consign");
  if (!sec) return;
  const cats = CATS.slice(1).map(c => `<option value="${c.key}">${c.label}</option>`).join("");
  sec.innerHTML = `
    <a class="back-link" href="#top">← กลับหน้าร้าน</a>
    <div class="section-head">
      <h2>ฝากขายกับ Phumin</h2>
      <p>ส่งข้อมูลและรูปสินค้า ทีมงานตรวจสอบแล้วติดต่อกลับ ร้านหักค่าคอมมิชชัน ${CONSIGN.commission}% เมื่อขายได้</p>
    </div>
    <div class="cs-wrap">
      <div class="cs-main">
        <ol class="cs-steps" id="csSteps">${CS_STEPS.map((s, i) => `<li class="${i === 0 ? "on" : ""}"><span>${i + 1}</span>${s[0]}</li>`).join("")}</ol>
        <form id="csForm" class="cs-form" novalidate>
          <div class="cs-grid">
            <div><label>ชื่อผู้ฝาก</label><input name="seller" autocomplete="name" placeholder="ชื่อ-นามสกุล"></div>
            <div><label>เบอร์โทร</label><input name="phone" inputmode="tel" autocomplete="tel" placeholder="08x-xxx-xxxx"></div>
            <div><label>ชื่อสินค้า</label><input name="name" placeholder="เช่น Logitech G304"></div>
            <div><label>แบรนด์</label><input name="brand" placeholder="เช่น Logitech"></div>
            <div><label>หมวดหมู่</label><select name="cat">${cats}</select></div>
            <div><label>สภาพโดยประมาณ</label><select name="grade"><option value="A">A · สภาพดีมาก</option><option value="B" selected>B · ใช้งานปกติ มีรอย</option></select></div>
            <div class="full"><label>ราคาที่อยากขาย (฿)</label><input name="price" type="number" min="0" inputmode="numeric" placeholder="เช่น 1200"></div>
            <div class="full"><label>รายละเอียด / ตำหนิ / สิ่งที่มาพร้อมสินค้า</label><textarea name="notes" rows="3" placeholder="เช่น ปุ่มซ้ายมีรอยเล็กน้อย มีกล่องและสายชาร์จ"></textarea></div>
          </div>
          <div class="cs-photos">
            <label class="cs-drop" id="csDrop">
              <input type="file" accept="image/*" multiple id="csFiles" hidden>
              ${ic("plus")}<span>เพิ่มรูปสินค้า</span><small>สูงสุด ${CONSIGN.maxPhotos} รูป · รูปแรกเป็นรูปหลัก</small>
            </label>
            <div class="cs-thumbs" id="csThumbs"></div>
          </div>
          <div class="cs-est" id="csEst"></div>
          <div class="form-err" id="csErr"></div>
          <button class="btn-main" type="submit">ส่งคำขอฝากขาย</button>
        </form>
      </div>
      <aside class="cs-side">
        <div class="cs-card">
          <h3>วิธีฝากขาย</h3>
          <ol class="cs-how">
            <li>กรอกข้อมูลและรูปสินค้า</li>
            <li>ทีมงานตรวจสอบและโทรกลับ</li>
            <li>ลงขายเมื่อรับฝาก แล้วจ่ายเงินเมื่อขายได้</li>
          </ol>
        </div>
        <div class="cs-card cs-track">
          <h3>เช็กสถานะคำขอ</h3>
          <form id="csCheck" class="cs-check" novalidate>
            <input name="code" placeholder="รหัส CS-XXXXXX" autocapitalize="characters">
            <input name="phone" inputmode="tel" placeholder="เบอร์ที่ใช้ส่งคำขอ">
            <button class="adm-btn dark" type="submit">ตรวจสอบ</button>
          </form>
          <div id="csResult"></div>
        </div>
      </aside>
    </div>
    <div id="csDone" class="cs-done" hidden></div>`;
  icons();
  bindConsign();
})();

function csUpdateSteps() {
  const f = $("csForm");
  if (!f) return;
  const got = { info: !!(f.seller.value && f.phone.value && f.name.value && f.price.value), photos: csPhotos.length > 0 };
  const cur = got.info ? (got.photos ? 2 : 1) : 0;
  $("csSteps").querySelectorAll("li").forEach((li, i) => {
    li.classList.toggle("on", i <= cur);
    li.classList.toggle("done", i < cur);
  });
  $("csSteps").style.setProperty("--p", (cur / (CS_STEPS.length - 1)).toFixed(2));
  const price = Number(f.price.value || 0);
  $("csEst").innerHTML = price > 0
    ? `<span>หากขายได้ตามราคานี้ ผู้ฝากได้รับประมาณ</span><b class="cs-net">${fmt(csNet(price))}</b><small>หลังหักค่าคอมมิชชัน ${CONSIGN.commission}%</small>`
    : `<span>กรอกราคาที่ต้องการเพื่อดูยอดที่จะได้รับ</span>`;
}

function csRenderThumbs() {
  $("csThumbs").innerHTML = csPhotos.map((src, i) => `
    <div class="cs-thumb ${i === 0 ? "main" : ""}" style="--i:${i}">
      <img src="${src}" alt="รูปที่ ${i + 1}">
      ${i === 0 ? `<span class="cs-main-tag">หลัก</span>` : `<button type="button" class="cs-make-main" data-main="${i}">ตั้งเป็นหลัก</button>`}
      <button type="button" class="cs-rm" data-rm="${i}" aria-label="ลบรูป">${ic("x")}</button>
    </div>`).join("");
  icons();
  csUpdateSteps();
}

function csShowDone(code, rec) {
  const f = $("csForm"), done = $("csDone");
  f.hidden = true;
  $("csSteps").hidden = true;
  done.hidden = false;
  done.innerHTML = `
    <div class="cs-ok">${ic("check")}</div>
    <h3>ส่งคำขอเรียบร้อย</h3>
    <p>ทีมงานจะตรวจสอบและติดต่อกลับทางเบอร์ <b>${esc(rec.phone)}</b></p>
    <div class="cs-code"><small>รหัสคำขอของคุณ</small><b>${code}</b>
      <button class="adm-btn" type="button" data-copy-code>${ic("copy")} คัดลอก</button></div>
    <p class="muted">เก็บรหัสนี้ไว้เช็กสถานะได้ที่ช่องด้านขวา</p>
    <button class="adm-btn dark" type="button" data-again>ฝากสินค้าอีกชิ้น</button>`;
  icons();
  confettiBurst(done);
}

function confettiBurst(host) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (let i = 0; i < 18; i++) {
    const c = document.createElement("i");
    c.className = "confetti cs-conf";
    c.style.left = (10 + Math.random() * 80) + "%";
    c.style.animationDelay = (Math.random() * .3) + "s";
    c.style.setProperty("--c", ["#f2b8b8", "#b8d8f2", "#f7e3a1", "#b8e6c9", "#d9c8f2"][i % 5]);
    host.appendChild(c);
    setTimeout(() => c.remove(), 2600);
  }
}

function bindConsign() {
  const f = $("csForm");
  f.addEventListener("input", csUpdateSteps);
  $("csFiles").addEventListener("change", async e => {
    const max = CONSIGN.maxPhotos;
    for (const file of e.target.files) {
      if (csPhotos.length >= max) { toast(`ใส่รูปได้สูงสุด ${max} รูป`, "alert-circle"); break; }
      try { csPhotos.push(await shrinkImg(file)); } catch (ex) { toast(errMsg(ex), "alert-circle"); }
    }
    e.target.value = "";
    csRenderThumbs();
  });
  $("csThumbs").addEventListener("click", e => {
    const rm = e.target.closest("[data-rm]"), mk = e.target.closest("[data-main]");
    if (rm) { csPhotos.splice(+rm.dataset.rm, 1); csRenderThumbs(); }
    if (mk) { const [x] = csPhotos.splice(+mk.dataset.main, 1); csPhotos.unshift(x); csRenderThumbs(); }
  });
  f.addEventListener("submit", async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    const err = msg => ($("csErr").textContent = msg);
    if (d.seller.trim().length < 2) return err("กรอกชื่อผู้ฝาก");
    if (String(d.phone).replace(/\D/g, "").length < 9) return err("เบอร์โทรไม่ถูกต้อง");
    if (d.name.trim().length < 2) return err("กรอกชื่อสินค้า");
    if (!(Number(d.price) > 0)) return err("กรอกราคาที่อยากขาย");
    if (!csPhotos.length) return err("เพิ่มรูปสินค้าอย่างน้อย 1 รูป");
    err("");
    const btn = f.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
      const rec = { seller: d.seller.trim(), phone: d.phone.trim(), name: d.name.trim(), brand: d.brand.trim() || "Generic",
        cat: d.cat, grade: d.grade, price: Number(d.price), notes: d.notes.trim(), imgs: [...csPhotos], commission: CONSIGN.commission };
      const code = await B.submitConsign(rec);
      csPhotos = [];
      csShowDone(code, rec);
    } catch (ex) { err(errMsg(ex)); }
    finally { btn.disabled = false; }
  });
  $("csDone").addEventListener("click", async e => {
    if (e.target.closest("[data-again]")) {
      $("csDone").hidden = true; $("csForm").hidden = false; $("csSteps").hidden = false;
      $("csForm").reset(); csRenderThumbs(); csUpdateSteps();
    }
    if (e.target.closest("[data-copy-code]")) {
      const code = $("csDone").querySelector(".cs-code b").textContent;
      try { await navigator.clipboard.writeText(code); } catch {}
      toast("คัดลอกรหัสแล้ว", "check");
    }
  });
  $("csCheck").addEventListener("submit", async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const out = $("csResult");
    if (!d.code.trim() || String(d.phone).replace(/\D/g, "").length < 9) { out.innerHTML = `<p class="muted">กรอกรหัสและเบอร์ให้ครบ</p>`; return; }
    const r = await B.consignStatus(d.code, d.phone);
    if (!r) { out.innerHTML = `<p class="muted">ไม่พบคำขอนี้ หรือเบอร์ไม่ตรงกับตอนส่งคำขอ</p>`; return; }
    const order = ["pending", "listed", "sold", "paid"];
    const cur = order.indexOf(r.status);
    out.innerHTML = `<div class="cs-status">
      <b>${esc(r.product)}</b>
      <span class="cs-badge s-${r.status}">${CS_STATUS[r.status] || r.status}</span>
      ${r.status === "rejected" ? `<p class="muted">${esc(r.reason || "ขออภัย ทางร้านยังไม่รับฝากสินค้านี้")}</p>` : `
        <ol class="trk cs-trk">${order.map((k, i) => `<li class="${i <= cur ? "done" : ""}${i === cur ? " now" : ""}" style="--i:${i}"><span></span><div><b>${CS_STATUS[k]}</b></div></li>`).join("")}</ol>`}
    </div>`;
  });
  csRenderThumbs();
  csUpdateSteps();
}

/* ---------- แอดมิน: จัดการคำขอฝากขาย ---------- */
async function adminConsignRender(box) {
  const all = await B.adminConsign();
  const pending = all.filter(r => r.status === "pending").length;
  const listed = all.filter(r => r.status === "listed").length;
  const owed = all.filter(r => r.status === "sold").reduce((n, r) => n + csNet(r.price), 0);
  box.innerHTML = `
    <div class="adm-stats cs-stats">
      <div><b data-to="${pending}">${pending}</b><small>รอตรวจสอบ</small></div>
      <div><b data-to="${listed}">${listed}</b><small>ลงขายอยู่</small></div>
      <div><b data-to="${owed}">${fmt(owed)}</b><small>ต้องจ่ายผู้ฝาก (ขายแล้ว)</small></div>
      <div><b data-to="${all.length}">${all.length}</b><small>คำขอทั้งหมด</small></div>
    </div>
    <div class="ap-bar">
      <select class="ap-ostatus cs-filter" aria-label="กรองสถานะ"><option value="">ทุกสถานะ</option>${Object.entries(CS_STATUS).map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select>
    </div>
    <div class="cs-admin-list">${all.length ? all.map(csAdminCard).join("") : `<div class="empty" style="padding:40px 0"><p>ยังไม่มีคำขอฝากขาย</p></div>`}</div>`;
  countUp(box);

  box.querySelector(".cs-filter").addEventListener("change", e => {
    const v = e.target.value;
    box.querySelectorAll(".cs-item").forEach(c => c.style.display = !v || c.dataset.status === v ? "" : "none");
  });
  box.addEventListener("input", e => {
    if (e.target.matches("[data-cs-price]")) {
      const card = e.target.closest(".cs-item"), c = Number(card.dataset.comm);
      card.querySelector("[data-cs-net]").textContent = fmt(Math.round(Number(e.target.value || 0) * (1 - c / 100)));
    }
  });
  box.addEventListener("click", async e => {
    const card = e.target.closest(".cs-item");
    if (!card) return;
    const id = card.dataset.id;
    try {
      if (e.target.closest("[data-cs-list]")) {
        const price = Number(card.querySelector("[data-cs-price]").value), comm = Number(card.querySelector("[data-cs-comm]").value), stock = Number(card.querySelector("[data-cs-stock]").value || 1);
        if (!(price > 0)) return toast("กรอกราคาขาย", "alert-circle");
        if (!(comm >= 0 && comm < 100)) return toast("ค่าคอมมิชชันไม่ถูกต้อง", "alert-circle");
        await B.adminConsignList(id, { price, commission: comm, stock });
        toast("รับฝากแล้ว ลงขายในร้านแล้ว", "check");
      } else if (e.target.closest("[data-cs-reject]")) {
        const reason = await askSheet({ title: "ปฏิเสธคำขอ", msg: "ระบุเหตุผลให้ผู้ฝากทราบ (ไม่บังคับ)", value: "", input: true, okText: "ปฏิเสธ", danger: true });
        if (reason === null) return;
        await B.adminConsignPatch(id, { status: "rejected", reason: reason.trim() });
        toast("ปฏิเสธคำขอแล้ว", "check");
      } else if (e.target.closest("[data-cs-sold]")) {
        const r = (await B.adminConsign()).find(x => x.id === id);
        if (r.productId) await B.adminSaveProduct({ id: r.productId, price: r.price, stock: 0 });
        await B.adminConsignPatch(id, { status: "sold", sold_at: Date.now() });
        toast("ทำเครื่องหมายขายแล้ว", "check");
      } else if (e.target.closest("[data-cs-paid]")) {
        const r = (await B.adminConsign()).find(x => x.id === id);
        if (!(await askSheet({ title: "จ่ายเงินให้ผู้ฝาก?", msg: `ยอดโอน ${fmt(csNet(r.price))} (หักค่าคอมมิชชันแล้ว)`, okText: "จ่ายแล้ว" }))) return;
        await B.adminConsignPatch(id, { status: "paid", paid_at: Date.now() });
        toast("บันทึกการจ่ายเงินแล้ว", "check");
      } else return;
      renderAdmin("cs");
    } catch (ex) { toast(errMsg(ex), "alert-circle"); }
  });
}

function csAdminCard(r) {
  const img = (r.imgs || [])[0];
  const net = csNet(r.price);
  const actions = r.status === "pending" ? `
      <div class="cs-list-form">
        <label>ราคาขาย (฿)<input type="number" min="0" value="${r.price}" data-cs-price></label>
        <label>คอมมิชชัน %<input type="number" min="0" max="99" value="${r.commission ?? CONSIGN.commission}" data-cs-comm></label>
        <label>จำนวน<input type="number" min="1" value="1" data-cs-stock></label>
        <div class="cs-net-line">ผู้ฝากได้รับ <b data-cs-net>${fmt(csNet(r.price))}</b></div>
        <button class="adm-btn dark" type="button" data-cs-list>รับฝากและลงขาย</button>
        <button class="adm-btn" type="button" data-cs-reject>ปฏิเสธ</button>
      </div>`
    : r.status === "listed" ? `<button class="adm-btn dark" type="button" data-cs-sold>ทำเครื่องหมายขายแล้ว</button>`
    : r.status === "sold" ? `<button class="adm-btn dark" type="button" data-cs-paid>จ่ายเงินให้ผู้ฝาก ${fmt(net)}</button>`
    : "";
  return `
    <article class="cs-item" data-id="${r.id}" data-status="${r.status}" data-comm="${r.commission ?? CONSIGN.commission}">
      <div class="cs-item-img">${img ? `<img src="${img}" alt="">` : ic("package")}</div>
      <div class="cs-item-body">
        <div class="cs-item-head">
          <div><b>${esc(r.name)}</b><small>${esc(r.brand || "")} · ${esc(catLabel(r.cat))} · สภาพ ${esc(r.grade || "")}</small></div>
          <span class="cs-badge s-${r.status}">${CS_STATUS[r.status] || r.status}</span>
        </div>
        <div class="cs-item-meta">
          <span>${esc(r.seller)} · ${esc(r.phone)}</span>
          <span>รหัส ${esc(r.code)}</span>
          <span>ขอราคา ${fmt(r.price)}</span>
          <span>${new Date(toMs(r.created_at)).toLocaleDateString("th-TH")}</span>
        </div>
        ${r.notes ? `<p class="cs-notes">${esc(r.notes)}</p>` : ""}
        ${r.reason ? `<p class="cs-notes">เหตุผล: ${esc(r.reason)}</p>` : ""}
        ${(r.imgs || []).length > 1 ? `<div class="cs-mini">${r.imgs.slice(1).map(s => `<img src="${s}" alt="">`).join("")}</div>` : ""}
        <div class="cs-actions">${actions}</div>
      </div>
    </article>`;
}
