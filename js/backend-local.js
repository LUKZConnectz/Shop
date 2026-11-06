/* ============ BACKEND A: โหมดทดลอง (localStorage) ============ */
const LOCAL = {
  pl: new Set(), al: new Set(),
  users() { return load(LS.users, []); },
  products() {
    const m = load(LS.stock, {}), ov = load(LS.prods, { edits: {}, added: [], deleted: [] });
    return [...SEED, ...ov.added].filter(p => !ov.deleted.includes(p.id) && !(ov.purged || []).includes(p.id))
      .map(p => {
        const q = { ...p, ...(ov.edits[p.id] || {}), stock: (p.id in m) ? m[p.id] : p.stock };
        q.imgs = q.imgs || (q.img ? [q.img] : []); q.img = q.imgs[0] || "";
        return q;
      });
  },
  me() {
    const uid = load(LS.session, null);
    const u = this.users().find(x => x.uid === uid);
    return u ? { uid: u.uid, email: u.email, name: u.name, phone: u.phone, address: u.address || "" } : null;
  },
  emitAuth() { const me = this.me(); this.al.forEach(f => f(me)); },
  emitProducts() { const l = this.products(); this.pl.forEach(f => f(l)); },
  subscribeAuth(cb) { this.al.add(cb); setTimeout(() => cb(this.me()), 0); return () => this.al.delete(cb); },
  subscribeProducts(cb) { this.pl.add(cb); setTimeout(() => cb(this.products()), 0); return () => this.pl.delete(cb); },
  async signUp({ name, phone, email, pw }) {
    const users = this.users();
    if (users.some(u => u.email === email)) throw new Error("User already registered");
    const uid = genId();
    users.push({ uid, email, name, phone, address: "", pw: await hashPw(pw) });
    save(LS.users, users);
    save(LS.session, uid);
    this.emitAuth();
    return { user: this.me() };
  },
  async signIn(email, pw) {
    const u = this.users().find(x => x.email === email);
    if (!u || u.pw !== await hashPw(pw)) throw new Error("Invalid login credentials");
    save(LS.session, u.uid);
    this.emitAuth();
    return { user: this.me() };
  },
  async signOut() { save(LS.session, null); this.emitAuth(); },
  async resetPassword() { throw new Error("โหมดทดลองไม่รองรับการรีเซ็ตรหัสผ่าน"); },
  async updateProfile({ name, phone, address }) {
    const uid = load(LS.session, null);
    const users = this.users();
    const i = users.findIndex(x => x.uid === uid);
    if (i < 0) throw new Error("NOT_AUTHENTICATED");
    users[i] = { ...users[i], name, phone, address };
    save(LS.users, users);
    this.emitAuth();
  },
  async placeOrder({ items, customer, payment }) {
    const uid = load(LS.session, null) || "guest";
    if (!items.length) throw new Error("EMPTY_CART");
    const prods = this.products();
    const m = {};
    prods.forEach(p => { m[p.id] = p; });
    items.forEach(i => { const p = m[i.id]; if (!p || p.stock < i.qty) throw new Error("OUT_OF_STOCK:" + i.id); });
    const stock = {};
    prods.forEach(p => { stock[p.id] = p.stock; });
    items.forEach(i => { stock[i.id] -= i.qty; });
    save(LS.stock, stock);
    const lines = items.map(i => ({ id: i.id, name: m[i.id].name, price: m[i.id].price, qty: i.qty }));
    const pr = calcTotal(lines.reduce((s, l) => s + l.price * l.qty, 0), payment);
    const orderId = genId();
    const orders = load(LS.orders, []);
    orders.push({ id: orderId, status: "pending", user_id: uid, customer, items: lines, payment, total: pr.total, created_at: Date.now() });
    save(LS.orders, orders);
    this.emitProducts();
    return { orderId, total: pr.total };
  },
  /* ---- ฝากขาย ---- */
  async submitConsign(d) {
    const all = load("phumin-sb-consign", []);
    const id = genId();
    const rec = { id, code: "CS-" + id.replace(/-/g, "").slice(0, 6).toUpperCase(), status: "pending", created_at: Date.now(), ...d };
    all.push(rec);
    try { localStorage.setItem("phumin-sb-consign", JSON.stringify(all)); }
    catch { throw new Error("พื้นที่เก็บรูปเต็ม ลองลดจำนวนรูปหรือขนาดรูป"); }
    return rec.code;
  },
  async consignStatus(code, phone) {
    const c = String(code || "").trim().toUpperCase(), p = String(phone || "").replace(/\D/g, "");
    const r = load("phumin-sb-consign", []).find(x => String(x.code).toUpperCase() === c && p && String(x.phone || "").replace(/\D/g, "") === p);
    if (!r) return null;
    return { status: r.status, product: r.name, price: r.price, commission: r.commission, reason: r.reason || "", created_at: r.created_at };
  },
  async adminConsign() { this.needAdmin(); return load("phumin-sb-consign", []).sort((a, b) => b.created_at - a.created_at); },
  async adminConsignPatch(id, patch) {
    this.needAdmin();
    const all = load("phumin-sb-consign", []), r = all.find(x => x.id === id);
    if (!r) throw new Error("ไม่พบรายการ");
    Object.assign(r, patch);
    save("phumin-sb-consign", all);
  },
  /* รับฝากและลงขายเป็นสินค้าในร้านทันที */
  async adminConsignList(id, opt) {
    this.needAdmin();
    const all = load("phumin-sb-consign", []), r = all.find(x => x.id === id);
    if (!r) throw new Error("ไม่พบรายการ");
    await this.adminSaveProduct({
      name: r.name, brand: r.brand || "Generic", cat: r.cat, spec: "", price: opt.price, orig: opt.price,
      grade: r.grade || "B", warranty: 0, stock: opt.stock || 1, tested: r.notes || "", flaws: "",
      imgs: r.imgs || [], img: (r.imgs || [])[0] || ""
    });
    const ov = load(LS.prods, { edits: {}, added: [], deleted: [] });
    const pid = ov.added[ov.added.length - 1].id;
    Object.assign(r, { status: "listed", productId: pid, price: opt.price, commission: opt.commission, listed_at: Date.now() });
    save("phumin-sb-consign", all);
    return pid;
  },

  /* แอดมินแก้ข้อมูลลูกค้า: อัปเดตทุกออเดอร์ของลูกค้าคนนั้น และบัญชีสมาชิกถ้ามี */
  async adminUpdateCustomer(oldPhone, oldName, data) {
    this.needAdmin();
    const digits = v => String(v || "").replace(/\D/g, "");
    const orders = load(LS.orders, []);
    let n = 0;
    orders.forEach(o => {
      const match = oldPhone ? digits(o.customer?.phone) === oldPhone : (!digits(o.customer?.phone) && o.customer?.name === oldName);
      if (match) { o.customer = { ...(o.customer || {}), name: data.name, phone: data.phone, address: data.address }; n++; }
    });
    save(LS.orders, orders);
    if (oldPhone) {
      const users = this.users();
      let changed = false;
      users.forEach(u => { if (digits(u.phone) === oldPhone) { u.name = data.name; u.phone = data.phone; u.address = data.address; changed = true; } });
      if (changed) save(LS.users, users);
    }
    return n;
  },
  /* ---- รีวิวและเครดิตการขาย ---- */
  listReviews() { return load(LS.reviews, []).filter(r => r.status === "approved").sort((a, b) => b.created_at - a.created_at); },
  listCredits() { return load(LS.credits, []); },
  async addReview(r) {
    const all = load(LS.reviews, []);
    all.push({ id: genId(), status: "pending", created_at: Date.now(), ...r });
    try { localStorage.setItem(LS.reviews, JSON.stringify(all)); } catch { throw new Error("พื้นที่เก็บเต็ม ลองส่งโดยไม่แนบรูป"); }
  },
  async adminReviews() { this.needAdmin(); return load(LS.reviews, []).sort((a, b) => b.created_at - a.created_at); },
  async adminReviewOp(id, op) {
    this.needAdmin();
    let all = load(LS.reviews, []);
    if (op === "del") all = all.filter(r => r.id !== id);
    else { const r = all.find(x => x.id === id); if (r) r.status = op; }
    save(LS.reviews, all);
  },
  async adminCreditOp(op, id, val) {
    this.needAdmin();
    let all = load(LS.credits, []);
    if (op === "add") all.push({ id: genId(), img: val, caption: "" });
    else if (op === "del") all = all.filter(c => c.id !== id);
    else if (op === "cap") { const c = all.find(x => x.id === id); if (c) c.caption = val; }
    try { localStorage.setItem(LS.credits, JSON.stringify(all)); } catch { throw new Error("พื้นที่เก็บรูปเต็ม"); }
  },
  async adminSetShipping(id, ship) {
    this.needAdmin();
    const orders = load(LS.orders, []), o = orders.find(x => String(x.id) === String(id));
    if (!o) throw new Error("ไม่พบคำสั่งซื้อ");
    o.ship = { carrier: ship.carrier, no: ship.no, at: Date.now() };
    if (!o.status || o.status === "pending" || o.status === "paid") o.status = "shipped";
    save(LS.orders, orders);
  },
  /* ลูกค้าเช็กสถานะด้วยรหัสออเดอร์ + เบอร์ที่ใช้สั่ง (ไม่เปิดเผยที่อยู่) */
  async trackOrder(code, phone) {
    const c = String(code || "").trim().toUpperCase(), p = String(phone || "").replace(/\D/g, "");
    const o = load(LS.orders, []).find(x =>
      (String(x.id).toUpperCase() === c || shortId(x.id) === c) &&
      p && String(x.customer?.phone || "").replace(/\D/g, "") === p);
    if (!o) return null;
    return { status: o.status || "pending", ship: o.ship || null, created_at: o.created_at,
      items: (o.items || []).map(i => `${i.name} × ${i.qty}`) };
  },
  salesStats() {
    const os = load(LS.orders, []).filter(o => o.status !== "cancelled");
    return {
      sold: os.reduce((n, o) => n + (o.items || []).reduce((a, i) => a + i.qty, 0), 0),
      customers: new Set(os.map(o => o.customer?.phone || o.user_id)).size,
      revenue: os.reduce((n, o) => n + o.total, 0)
    };
  },
  async attachSlip(id, slip) {
    const orders = load(LS.orders, []), o = orders.find(x => x.id === id);
    if (!o) throw new Error("ไม่พบคำสั่งซื้อ");
    o.slip = slip;
    try { localStorage.setItem(LS.orders, JSON.stringify(orders)); } catch { throw new Error("พื้นที่เก็บเต็ม"); }
  },
  /* ---- แอดมิน ---- */
  needAdmin() { const m = this.me(); if (!m || !ADMIN_EMAILS.includes(m.email.toLowerCase())) throw new Error("NOT_ADMIN"); },
  async adminOrders() {
    this.needAdmin();
    return load(LS.orders, []).sort((a, b) => toMs(b.created_at) - toMs(a.created_at));
  },
  async adminSetStatus(id, status) {
    this.needAdmin();
    const orders = load(LS.orders, []), o = orders.find(x => x.id === id);
    if (o) { o.status = status; save(LS.orders, orders); }
  },
  async adminSaveProduct(p) {
    this.needAdmin();
    const ov = load(LS.prods, { edits: {}, added: [], deleted: [] }), stock = load(LS.stock, {});
    const { stock: st, ...fields } = p;
    if (!p.id) { p.id = Date.now(); ov.added.push({ icon: ({ Keyboard: "keyboard", Mouse: "mouse", Headset: "headphones" })[p.cat] || "package", ...fields, id: p.id }); }
    else ov.edits[p.id] = { ...(ov.edits[p.id] || {}), ...fields };
    stock[p.id] = st;
    try {
      localStorage.setItem(LS.prods, JSON.stringify(ov)); localStorage.setItem(LS.stock, JSON.stringify(stock));
    } catch { throw new Error("พื้นที่เก็บรูปเต็ม ลองลดจำนวนหรือขนาดรูป"); }
    this.emitProducts();
  },
  async adminDeleteProduct(id) {
    this.needAdmin();
    const ov = load(LS.prods, { edits: {}, added: [], deleted: [] });
    if (!ov.deleted.includes(id)) ov.deleted.push(id);
    save(LS.prods, ov); this.emitProducts();
  },
  async adminRestoreProduct(id) {
    this.needAdmin();
    const ov = load(LS.prods, { edits: {}, added: [], deleted: [] });
    ov.deleted = ov.deleted.filter(x => x !== id);
    save(LS.prods, ov); this.emitProducts();
  },
  /* ลบถาวร: ลบออกจากระบบและตะกร้าทุกคน (ของเดิมจะไม่กลับมาแม้รีเฟรช) */
  async adminPurgeProduct(id) {
    this.needAdmin();
    const ov = load(LS.prods, { edits: {}, added: [], deleted: [], purged: [] });
    const stock = load(LS.stock, {}), cart = load(LS.cart, {});
    ov.purged = [...new Set([...(ov.purged || []), id])];
    ov.added = ov.added.filter(p => p.id !== id);
    delete ov.edits[id]; delete stock[id]; delete cart[id];
    save(LS.prods, ov); save(LS.stock, stock); save(LS.cart, cart);
    this.emitProducts();
  },
  adminDeletedProducts() {
    const ov = load(LS.prods, { edits: {}, added: [], deleted: [] });
    return [...SEED, ...ov.added]
      .filter(p => ov.deleted.includes(p.id) && !(ov.purged || []).includes(p.id))
      .map(p => ({ ...p, ...(ov.edits[p.id] || {}) }));
  },
  async listOrders(uid) {
    return load(LS.orders, []).filter(o => o.user_id === uid)
      .sort((a, b) => toMs(b.created_at) - toMs(a.created_at))
      .map(o => ({ slip: !!o.slip, ship: o.ship || null, status: o.status || "pending", orderId: o.id, items: o.items, payment: o.payment, total: o.total, createdAt: o.created_at }));
  }
};
