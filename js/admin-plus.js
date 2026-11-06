/* ============ ระบบแอดมิน: เครื่องมือเพิ่มเติม ============ */
const SETTINGS_KEY = "phumin-sb-settings";

/* กล่องถาม-ตอบในหน้า (แทน prompt/confirm ของเบราว์เซอร์ที่บางครั้งถูกบล็อก) */
function askSheet({ title, msg = "", value = "", input = false, okText = "ยืนยัน", danger = false }) {
  return new Promise(resolve => {
    const wrap = document.createElement("div");
    wrap.className = "sheet-wrap";
    wrap.innerHTML = `
      <div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <h4>${esc(title)}</h4>
        ${msg ? `<p>${esc(msg)}</p>` : ""}
        ${input ? `<input class="sheet-in" value="${esc(value)}" inputmode="decimal" autocomplete="off">` : ""}
        <div class="sheet-acts">
          <button class="adm-btn" type="button" data-no>ยกเลิก</button>
          <button class="adm-btn ${danger ? "danger" : "dark"}" type="button" data-yes>${esc(okText)}</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add("show"));
    const inp = wrap.querySelector(".sheet-in");
    if (inp) { setTimeout(() => { inp.focus(); inp.select(); }, 60); }
    const done = v => {
      wrap.classList.remove("show");
      setTimeout(() => wrap.remove(), 250);
      document.removeEventListener("keydown", onKey, true);
      resolve(v);
    };
    const onKey = e => {
      if (e.key === "Escape") { e.stopPropagation(); done(null); }
      if (e.key === "Enter") { e.preventDefault(); done(inp ? inp.value : true); }
    };
    document.addEventListener("keydown", onKey, true);
    wrap.addEventListener("click", e => {
      if (e.target.closest("[data-yes]")) done(inp ? inp.value : true);
      else if (e.target.closest("[data-no]") || e.target === wrap) done(null);
    });
  });
}

function downloadCSV(name, rows) {
  const csv = "\ufeff" + rows.map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
}

/* ---------- สินค้า: ค้นหา กรอง เลือกหลายชิ้น ปรับสต็อกทีละ 1 ---------- */
function adminPlusProducts() {
  const box = $("admBody");
  if (!box || !box.querySelector(".adm-row[data-id]")) return;
  const rows = [...box.querySelectorAll(".adm-row[data-id]:not(.trash-row)")];

  const bar = document.createElement("div");
  bar.className = "ap-bar";
  bar.innerHTML = `
    <input class="ap-search" placeholder="ค้นหาชื่อหรือแบรนด์" aria-label="ค้นหาสินค้า">
    <select class="ap-cat" aria-label="หมวด"><option value="">ทุกหมวด</option>${CATS.slice(1).map(c => `<option value="${c.key}">${c.label}</option>`).join("")}</select>
    <select class="ap-stock" aria-label="สต็อก"><option value="">ทุกสต็อก</option><option value="out">หมดแล้ว</option><option value="low">เหลือ 1 ชิ้นหรือน้อยกว่า</option></select>
    <button class="adm-btn" type="button" data-selall>เลือกที่เห็น</button>`;
  const bulk = document.createElement("div");
  bulk.className = "ap-bulk";
  bulk.hidden = true;
  bulk.innerHTML = `<span><b class="ap-count">0</b> ชิ้นที่เลือก</span>
    <span class="ap-acts">
      <button class="adm-btn" type="button" data-bulk="stock">ตั้งสต็อก</button>
      <button class="adm-btn" type="button" data-bulk="pct">ปรับราคา %</button>
      <button class="adm-btn dark" type="button" data-bulk="del">ลบที่เลือก</button>
    </span>`;
  box.prepend(bulk);
  box.prepend(bar);
  const addBtn = box.querySelector("[data-new]");
  if (addBtn) bar.appendChild(addBtn);

  rows.forEach(r => {
    const cell = r.querySelector(".adm-name");
    if (cell) cell.insertAdjacentHTML("afterbegin", `<input type="checkbox" class="ap-chk" aria-label="เลือกสินค้า">`);
    const st = r.querySelector('[data-f="stock"]');
    if (st) {
      const cell = document.createElement("div");
      cell.className = "ap-stockcell";
      st.replaceWith(cell);
      cell.appendChild(st);
      cell.insertAdjacentHTML("beforeend", `<button type="button" class="ap-mini" data-step="-1" aria-label="ลดสต็อก">−</button><button type="button" class="ap-mini" data-step="1" aria-label="เพิ่มสต็อก">+</button>`);
    }
  });

  if (rows.length) {
    const head = document.createElement("div");
    head.className = "ap-head";
    head.innerHTML = "<span>สินค้า</span><span>ราคา (฿)</span><span>สต็อก</span><span></span>";
    rows[0].before(head);
  }
  const visible = () => rows.filter(r => r.style.display !== "none");
  const picked = () => visible().filter(r => r.querySelector(".ap-chk")?.checked);
  const applyFilter = () => {
    const q = bar.querySelector(".ap-search").value.trim().toLowerCase();
    const cat = bar.querySelector(".ap-cat").value, st = bar.querySelector(".ap-stock").value;
    rows.forEach(r => {
      const p = find(r.dataset.id) || {};
      const stock = Number(r.querySelector('[data-f="stock"]')?.value || 0);
      const ok = (!q || `${p.name} ${p.brand}`.toLowerCase().includes(q))
        && (!cat || p.cat === cat)
        && (!st || (st === "out" ? stock <= 0 : stock <= 1));
      r.style.display = ok ? "" : "none";
    });
    updBulk();
  };
  const updBulk = () => {
    const n = picked().length;
    bulk.hidden = n === 0;
    bulk.querySelector(".ap-count").textContent = n;
  };

  bar.addEventListener("input", applyFilter);
  bar.addEventListener("change", applyFilter);
  bar.querySelector("[data-selall]").addEventListener("click", () => {
    const all = visible().every(r => r.querySelector(".ap-chk")?.checked);
    visible().forEach(r => { const c = r.querySelector(".ap-chk"); if (c) c.checked = !all; });
    updBulk();
  });
  box.addEventListener("change", e => { if (e.target.matches(".ap-chk")) updBulk(); });

  /* ปรับสต็อกทีละ 1 แล้วบันทึกทันที */
  box.addEventListener("click", async e => {
    const b = e.target.closest("[data-step]");
    if (b) {
      const row = b.closest(".adm-row"), input = row.querySelector('[data-f="stock"]');
      const next = Math.max(0, Number(input.value || 0) + Number(b.dataset.step));
      input.value = next;
      try { const p = find(row.dataset.id); await B.adminSaveProduct({ id: Number(row.dataset.id), price: p.price, stock: next }); row.querySelector(".adm-name small") && 0; toast(`สต็อกเป็น ${next}`, "check"); }
      catch (ex) { toast(errMsg(ex), "alert-circle"); }
      return;
    }
    const k = e.target.closest("[data-bulk]");
    if (!k) return;
    const list = picked();
    if (!list.length) return;
    const ids = list.map(r => Number(r.dataset.id));
    try {
      if (k.dataset.bulk === "stock") {
        const v = await askSheet({ title: "ตั้งสต็อก", msg: `${ids.length} รายการที่เลือก · ใส่จำนวนที่ต้องการ`, value: "1", input: true, okText: "บันทึก" });
        if (v === null || String(v).trim() === "" || !(Number(v) >= 0)) return;
        for (const id of ids) { const p = find(id); await B.adminSaveProduct({ id, price: p.price, stock: Math.floor(Number(v)) }); }
        toast("ตั้งสต็อกแล้ว", "check");
      } else if (k.dataset.bulk === "pct") {
        const v = await askSheet({ title: "ปรับราคา %", msg: "ใส่ -10 เพื่อลด 10% หรือ 10 เพื่อเพิ่ม 10%", value: "-10", input: true, okText: "ปรับราคา" });
        if (v === null || isNaN(Number(v))) return;
        for (const id of ids) { const p = find(id); await B.adminSaveProduct({ id, price: Math.max(0, Math.round(p.price * (1 + Number(v) / 100))), stock: p.stock }); }
        toast("ปรับราคาแล้ว", "check");
      } else if (k.dataset.bulk === "del") {
        if (!(await askSheet({ title: `ลบ ${ids.length} รายการ?`, msg: "กู้คืนได้จากถังขยะ", okText: "ลบ", danger: true }))) return;
        for (const id of ids) await B.adminDeleteProduct(id);
        toast("ลบแล้ว กู้คืนได้ในถังขยะ", "check");
      }
      renderAdmin("prods");
    } catch (ex) { toast(errMsg(ex), "alert-circle"); }
  });
}

/* ---------- คำสั่งซื้อ: กรองสถานะ ชำระแล้วด่วน ส่งออก CSV ---------- */
function adminPlusOrders() {
  const box = $("admBody");
  if (!box) return;
  const bar = document.createElement("div");
  bar.className = "ap-bar";
  bar.innerHTML = `
    <select class="ap-ostatus" aria-label="กรองสถานะ"><option value="">ทุกสถานะ</option>${Object.entries(ORDER_STATUS).map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select>
    <button class="adm-btn dark" type="button" data-csv>ส่งออก CSV</button>`;
  box.prepend(bar);

  bar.querySelector(".ap-ostatus").addEventListener("change", e => {
    const v = e.target.value;
    box.querySelectorAll(".order[data-oid]").forEach(o => {
      const cur = o.querySelector("select[data-status]")?.value || "pending";
      o.style.display = !v || cur === v ? "" : "none";
    });
  });

  box.querySelectorAll(".order[data-oid]").forEach(o => {
    const sel = o.querySelector("select[data-status]");
    if (!sel) return;
    sel.insertAdjacentHTML("beforebegin", `<button class="adm-btn" type="button" data-quickpaid style="margin-top:8px;margin-right:6px">ทำเครื่องหมายชำระแล้ว</button>`);
  });
  box.addEventListener("click", async e => {
    const q = e.target.closest("[data-quickpaid]");
    if (q) {
      const id = q.closest(".order[data-oid]").dataset.oid;
      try { await B.adminSetStatus(id, "paid"); toast("อัปเดตเป็นชำระแล้ว", "check"); renderAdmin("orders"); }
      catch (ex) { toast(errMsg(ex), "alert-circle"); }
      return;
    }
    if (e.target.closest("[data-csv]")) {
      try {
        const os = await B.adminOrders();
        const head = ["รหัสออเดอร์", "วันที่", "ชื่อลูกค้า", "เบอร์", "ที่อยู่", "สินค้า", "ยอดรวม (฿)", "การชำระ", "สถานะ", "ขนส่ง", "เลขพัสดุ"];
        const body = os.map(o => [
          shortId(o.id), new Date(toMs(o.created_at)).toLocaleString("th-TH"),
          o.customer?.name || "", o.customer?.phone || "", o.customer?.address || "",
          (o.items || []).map(i => `${i.name} x${i.qty}`).join("; "),
          o.total, o.payment || "", ORDER_STATUS[o.status || "pending"] || "", o.ship?.carrier || "", o.ship?.no || ""
        ]);
        downloadCSV(`orders-${new Date().toISOString().slice(0, 10)}.csv`, [head, ...body]);
      } catch (ex) { toast(errMsg(ex), "alert-circle"); }
    }
  });
}

/* ---------- ลูกค้า + ตั้งค่าร้าน (แท็บใหม่) ---------- */
async function adminPlusRender(tab, box) {
  if (tab === "cs") return adminConsignRender(box);
  if (tab === "cust") {
    const orders = await B.adminOrders();
    const digits = v => String(v || "").replace(/\D/g, "");
    const map = new Map();
    orders.forEach(o => {
      const phone = digits(o.customer?.phone);
      const key = phone || ("name:" + (o.customer?.name || ""));
      const c = map.get(key) || { key, phone, name: o.customer?.name || "-", phoneRaw: o.customer?.phone || "-", address: o.customer?.address || "", count: 0, spent: 0, last: 0 };
      if (o.status !== "cancelled") { c.count++; c.spent += o.total; }
      const t = toMs(o.created_at);
      if (t >= c.last) { c.last = t; c.name = o.customer?.name || c.name; c.phoneRaw = o.customer?.phone || c.phoneRaw; c.address = o.customer?.address || c.address; }
      map.set(key, c);
    });
    const list = [...map.values()].sort((x, y) => y.spent - x.spent);
    box.innerHTML = `
      <div class="ap-bar"><input class="ap-search cust-q" placeholder="ค้นหาชื่อหรือเบอร์" aria-label="ค้นหาลูกค้า"></div>
      <div class="cust-list">${list.length ? list.map((c, i) => `
        <div class="adm-row cust-row" data-i="${i}" data-q="${esc((c.name + " " + c.phoneRaw).toLowerCase())}">
          <div class="cust-who"><b>${esc(c.name)}</b><small>${esc(c.phoneRaw)}</small></div>
          <div class="muted">${c.count} ออเดอร์</div>
          <div>${fmt(c.spent)}</div>
          <div class="muted cust-date">${c.last ? new Date(c.last).toLocaleDateString("th-TH") : ""}</div>
          <div><button class="adm-btn" type="button" data-cedit>แก้ไข</button></div>
        </div>`).join("") : `<div class="empty" style="padding:40px 0"><p>ยังไม่มีลูกค้า</p></div>`}</div>
      <div class="muted" style="font-size:.75rem;margin-top:10px">ยอดใช้จ่ายไม่นับออเดอร์ที่ยกเลิก · การแก้ไขมีผลกับทุกออเดอร์ของลูกค้าคนนั้น</div>`;
    const cl = [...map.values()].sort((x, y) => y.spent - x.spent);
    box.querySelector(".cust-q").addEventListener("input", e => {
      const q = e.target.value.trim().toLowerCase();
      box.querySelectorAll(".cust-row").forEach(r => r.style.display = !q || r.dataset.q.includes(q) ? "" : "none");
    });
    box.addEventListener("click", e => {
      const ed = e.target.closest("[data-cedit]");
      if (ed) {
        const row = ed.closest(".cust-row"), c = cl[Number(row.dataset.i)];
        const form = document.createElement("form");
        form.className = "cust-edit";
        form.innerHTML = `
          <div><label>ชื่อลูกค้า</label><input name="name" value="${esc(c.name === "-" ? "" : c.name)}" required></div>
          <div><label>เบอร์โทร</label><input name="phone" value="${esc(c.phone)}" inputmode="tel" required></div>
          <div class="full"><label>ที่อยู่จัดส่ง</label><textarea name="address" rows="2">${esc(c.address)}</textarea></div>
          <div class="full cust-edit-acts">
            <button class="adm-btn dark" type="submit">บันทึกการแก้ไข</button>
            <button class="adm-btn" type="button" data-ccancel>ยกเลิก</button>
          </div>
          <small class="full muted">เปลี่ยนเบอร์ได้ ระบบจะจับคู่ออเดอร์ด้วยเบอร์เดิม</small>`;
        row.replaceWith(form);
        form.querySelector("input[name=name]").focus();
        form.addEventListener("submit", async ev => {
          ev.preventDefault();
          const f = Object.fromEntries(new FormData(form));
          const name = f.name.trim(), phone = f.phone.trim(), address = f.address.trim();
          if (name.length < 2) return toast("กรอกชื่อลูกค้า", "alert-circle");
          if (digits(phone).length < 9) return toast("เบอร์โทรไม่ถูกต้อง", "alert-circle");
          try {
            const n = await B.adminUpdateCustomer(c.phone || null, c.name, { name, phone, address });
            toast(`แก้ไขแล้ว (${n} ออเดอร์)`, "check");
            renderAdmin("cust");
          } catch (ex) { toast(errMsg(ex), "alert-circle"); }
        });
        return;
      }
      if (e.target.closest("[data-ccancel]")) renderAdmin("cust");
    });
    return;
  }

  /* ---------- ตั้งค่า: แยกเป็นหมวด (ข้อมูลร้าน / แบนเนอร์ / มาสคอต / โปรโมชัน) ---------- */
  const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null") || {};
  const v = x => esc(String(x ?? ""));
  const savePart = (key, value) => {
    const cur = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null") || {};
    cur[key] = value;
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(cur)); }
    catch (ex) { return toast("พื้นที่เก็บข้อมูลเต็ม ลองลดจำนวนรูปแบนเนอร์", "alert-circle"); }
    toast("บันทึกแล้ว กำลังโหลดใหม่", "check");
    setTimeout(() => location.reload(), 500);
  };
  const resetPart = async (key, title) => {
    if (!(await askSheet({ title, msg: "ค่าที่แก้ไว้ในหมวดนี้จะหาย (หมวดอื่นไม่ถูกแตะ)", okText: "คืนค่า", danger: true }))) return;
    const cur = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null") || {};
    delete cur[key];
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(cur)); location.reload();
  };
  const actions = (note = "") => `
    <div class="full" style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="adm-btn dark" type="submit">บันทึกและโหลดใหม่</button>
      <button class="adm-btn" type="button" id="setReset">คืนค่าเริ่มต้นหมวดนี้</button>
    </div>${note ? `<p class="full muted" style="font-size:.75rem">${note}</p>` : ""}`;
  const head2 = (t, d) => `<div class="full"><h4 style="font-weight:500">${t}</h4><p class="muted" style="font-size:.78rem;margin-top:4px">${d}</p></div>`;

  /* --- 1) ข้อมูลร้าน --- */
  if (tab === "set") {
    const o = { ...SHOP, ...(saved.shop || {}) };
    box.innerHTML = `<form id="setForm" class="adm-form" novalidate>
      ${head2("ข้อมูลติดต่อร้าน", "แสดงที่ส่วนท้ายและหน้าติดต่อ")}
      <div><label>เบอร์โทรร้าน</label><input name="phone" value="${v(o.phone)}" placeholder="0xx-xxx-xxxx"></div>
      <div><label>LINE</label><input name="line" value="${v(o.line)}" placeholder="@phumin"></div>
      <div><label>เวลาทำการ</label><input name="hours" value="${v(o.hours)}"></div>
      <div><label>ลิงก์เพจ Facebook</label><input name="fb" value="${v(o.fb)}" placeholder="https://www.facebook.com/..."></div>
      ${actions()}
    </form>`;
    box.querySelector("#setForm").addEventListener("submit", e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      savePart("shop", { phone: f.phone.trim(), line: f.line.trim(), hours: f.hours.trim(), fb: f.fb.trim() });
    });
    box.querySelector("#setReset").addEventListener("click", () => resetPart("shop", "คืนค่าข้อมูลร้าน?"));
    return;
  }

  /* --- 2) แบนเนอร์ --- */
  if (tab === "bn") {
    let bn = (Array.isArray(saved.banner) && saved.banner.length ? saved.banner : (typeof BANNER !== "undefined" ? BANNER.slides : [])).map(x => ({ img: x.img, href: x.href || "", alt: x.alt || "" }));
    box.innerHTML = `<form id="setForm" class="adm-form" novalidate>
      ${head2("แบนเนอร์หน้าแรก", "เพิ่มรูปได้หลายใบ ระบบครอบเป็นอัตราส่วน 4:1 (2000×500 px) ให้อัตโนมัติ แนะนำรูปแนวนอน")}
      <div class="full" id="bnAdm" style="display:grid;gap:10px"></div>
      <div class="full"><label class="adm-btn" style="display:inline-flex;gap:6px;align-items:center;cursor:pointer">+ เพิ่มรูปแบนเนอร์<input type="file" id="bnFile" accept="image/*" multiple hidden></label></div>
      ${actions("รูปเก็บในเบราว์เซอร์ของเครื่องนี้ เปิดจากเครื่องอื่นจะยังไม่เห็น")}
    </form>`;
    const bnBox = box.querySelector("#bnAdm");
    const bnDraw = () => {
      bnBox.innerHTML = bn.length ? bn.map((x, i) => `
        <div style="display:grid;grid-template-columns:120px 1fr auto;gap:10px;align-items:center;border:1px solid var(--line);border-radius:12px;padding:8px">
          <img src="${esc(x.img)}" alt="" style="width:120px;aspect-ratio:4/1;object-fit:cover;border-radius:8px;background:var(--soft)">
          <input data-bh="${i}" value="${esc(x.href)}" placeholder="ลิงก์เมื่อกดรูป (ไม่ใส่ก็ได้) เช่น #catalog" aria-label="ลิงก์ของรูปที่ ${i + 1}">
          <div style="display:flex;gap:4px">
            <button type="button" class="adm-btn" data-bup="${i}" ${i === 0 ? "disabled" : ""} aria-label="เลื่อนขึ้น">↑</button>
            <button type="button" class="adm-btn" data-bdn="${i}" ${i === bn.length - 1 ? "disabled" : ""} aria-label="เลื่อนลง">↓</button>
            <button type="button" class="adm-btn" data-bdel="${i}" aria-label="ลบรูป">ลบ</button>
          </div>
        </div>`).join("") : `<p class="muted" style="font-size:.8rem">ยังไม่มีรูป กดปุ่ม "เพิ่มรูปแบนเนอร์" ด้านล่าง</p>`;
    };
    bnDraw();
    bnBox.addEventListener("input", e => { const i = e.target.dataset.bh; if (i != null) bn[+i].href = e.target.value.trim(); });
    bnBox.addEventListener("click", e => {
      const t = e.target.closest("button"); if (!t) return;
      const d = k => t.dataset[k] != null ? +t.dataset[k] : null;
      if (d("bdel") != null) bn.splice(d("bdel"), 1);
      else if (d("bup") != null) { const i = d("bup"); [bn[i - 1], bn[i]] = [bn[i], bn[i - 1]]; }
      else if (d("bdn") != null) { const i = d("bdn"); [bn[i + 1], bn[i]] = [bn[i], bn[i + 1]]; }
      bnDraw();
    });
    const toBanner = file => new Promise((res, rej) => {
      const im = new Image(), u = URL.createObjectURL(file);
      im.onload = () => {
        const W = 2000, H = 500, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
        const r = Math.max(W / im.width, H / im.height), w = im.width * r, h = im.height * r;
        cv.getContext("2d").drawImage(im, (W - w) / 2, (H - h) / 2, w, h);
        URL.revokeObjectURL(u); res(cv.toDataURL("image/jpeg", .82));
      };
      im.onerror = () => { URL.revokeObjectURL(u); rej(new Error("อ่านไฟล์รูปไม่ได้")); };
      im.src = u;
    });
    box.querySelector("#bnFile").addEventListener("change", async e => {
      for (const f of e.target.files) {
        try { bn.push({ img: await toBanner(f), href: "", alt: "" }); } catch (ex) { toast(ex.message, "alert-circle"); }
      }
      e.target.value = ""; bnDraw();
    });
    box.querySelector("#setForm").addEventListener("submit", e => { e.preventDefault(); savePart("banner", bn.filter(x => x.img)); });
    box.querySelector("#setReset").addEventListener("click", () => resetPart("banner", "คืนค่าแบนเนอร์เริ่มต้น?"));
    return;
  }

  /* --- 3) มาสคอต --- */
  if (tab === "mk") {
    const mk = saved.mascot || {};
    box.innerHTML = `<form id="setForm" class="adm-form" novalidate>
      ${head2("มาสคอตร้าน", "ตัวการ์ตูนมุมจอหน้าร้าน ลูกค้ากดคุยและลากย้ายได้")}
      <div class="full"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="menabled" ${mk.enabled === false ? "" : "checked"} style="width:auto"> แสดงมาสคอตหน้าร้าน</label></div>
      ${actions()}
    </form>`;
    box.querySelector("#setForm").addEventListener("submit", e => { e.preventDefault(); savePart("mascot", { enabled: !!new FormData(e.target).get("menabled") }); });
    box.querySelector("#setReset").addEventListener("click", () => resetPart("mascot", "คืนค่ามาสคอต?"));
    return;
  }

  /* --- 4) ป็อปอัปโปรโมชัน --- */
  if (tab === "pr") {
    const pr = { ...PROMO, ...(saved.promo || {}) };
    box.innerHTML = `<form id="setForm" class="adm-form" novalidate>
      ${head2("ป็อปอัปโปรโมชัน", "หน้าต่างที่เด้งขึ้นเมื่อลูกค้าเข้าเว็บ")}
      <div class="full"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="penabled" ${pr.enabled ? "checked" : ""} style="width:auto"> แสดงป็อปอัป</label></div>
      <div><label>ป้ายเล็ก</label><input name="badge" value="${v(pr.badge)}"></div>
      <div><label>ปุ่ม</label><input name="cta" value="${v(pr.cta)}"></div>
      <div class="full"><label>หัวข้อโปรโมชัน</label><input name="title" value="${v(pr.title)}"></div>
      <div class="full"><label>ข้อความ</label><textarea name="text" rows="2">${v(pr.text)}</textarea></div>
      ${actions("หมายเหตุ: ถ้าอยากให้ลูกค้าเห็นป็อปอัปอีกครั้งหลังเปลี่ยนโปรโมชัน ให้เปลี่ยน id ในไฟล์ config")}
    </form>`;
    box.querySelector("#setForm").addEventListener("submit", e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      savePart("promo", { enabled: !!f.penabled, badge: f.badge.trim(), cta: f.cta.trim(), title: f.title.trim(), text: f.text.trim() });
    });
    box.querySelector("#setReset").addEventListener("click", () => resetPart("promo", "คืนค่าโปรโมชัน?"));
    return;
  }
}
