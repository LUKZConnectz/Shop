/* ============ BACKEND B: Supabase ============ */
const USE_SB = !!(window.supabase && SUPABASE_CONFIG.url && !SUPABASE_CONFIG.url.startsWith("YOUR"));
const sb = USE_SB ? window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey) : null;


/* ---------- ตัวช่วยแปลงข้อมูล ---------- */
const fromRow = r => ({
  id: Number(r.id), cat: r.cat, brand: r.brand, name: r.name, spec: r.spec, price: r.price, orig: r.orig,
  grade: r.grade, icon: r.icon, warranty: r.warranty, stock: r.stock, tested: r.tested, flaws: r.flaws,
  gradeLabel: r.grade_label || "", gradeDesc: r.grade_desc || "",
  imgs: Array.isArray(r.imgs) ? r.imgs : [], img: (Array.isArray(r.imgs) && r.imgs[0]) || r.img || ""
});
const PROD_COLS = { cat: "cat", brand: "brand", name: "name", spec: "spec", price: "price", orig: "orig", grade: "grade", icon: "icon",
  warranty: "warranty", stock: "stock", tested: "tested", flaws: "flaws", gradeLabel: "grade_label", gradeDesc: "grade_desc", imgs: "imgs" };
const toRow = p => {
  const row = {};
  for (const k in PROD_COLS) if (p[k] !== undefined) row[PROD_COLS[k]] = p[k];
  if (Array.isArray(p.imgs)) row.img = p.imgs[0] || "";
  return row;
};
const flat = r => ({ ...(r.data || {}), id: r.id, code: r.code, status: r.status, created_at: r.created_at });
const need = ({ error, data }) => { if (error) throw error; return data; };

const SB = {
  _admin: false,
  _c: { reviews: [], credits: [], stats: { sold: 0, customers: 0, revenue: 0 }, deleted: [] },
  async toUser(au) {
    if (!au) return null;
    const { data } = await sb.from("profiles").select("name,phone,address").eq("id", au.id).maybeSingle();
    let admin = false;
    try { const r = await sb.rpc("is_admin"); admin = r.data === true; } catch (e) {}
    SB._admin = admin;
    return {
      admin,
      uid: au.id,
      email: au.email,
      name: data?.name || au.user_metadata?.name || "",
      phone: data?.phone || au.user_metadata?.phone || "",
      address: data?.address || ""
    };
  },
  subscribeAuth(cb) {
    const { data } = sb.auth.onAuthStateChange((_evt, session) => {
      // เลื่อนออกไปหลัง event เพื่อไม่ให้เรียก client ซ้อนใน callback ของ auth
      setTimeout(async () => cb(await SB.toUser(session?.user)), 0);
    });
    return () => data.subscription.unsubscribe();
  },
  subscribeProducts(cb) {
    const load = async () => {
      await SB.refresh();
      const { data, error } = await sb.from("products").select("*").eq("deleted", false).order("id");
      if (!error) cb((data || []).map(fromRow));
    };
    load();
    const ch = sb.channel("products-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, load)
      .subscribe();
    return () => sb.removeChannel(ch);
  },
  async signUp({ name, phone, email, pw }) {
    const { data, error } = await sb.auth.signUp({
      email, password: pw,
      options: { data: { name, phone }, emailRedirectTo: location.href }
    });
    if (error) throw error;
    if (!data.session) return { pending: true }; // เปิด Confirm email อยู่
    return { user: await SB.toUser(data.user) };
  },
  async signIn(email, pw) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pw });
    if (error) throw error;
    return { user: await SB.toUser(data.user) };
  },
  async signOut() {
    const { error } = await sb.auth.signOut();
    if (error) throw error;
  },
  async resetPassword(email) {
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.href });
    if (error) throw error;
  },
  async updateProfile({ uid, name, phone, address }) {
    const { error } = await sb.from("profiles").update({ name, phone, address }).eq("id", uid);
    if (error) throw error;
  },
  async placeOrder({ items, customer, payment }) {
    const { data, error } = await sb.rpc("place_order", {
      p_items: items, p_customer: customer, p_payment: payment
    });
    if (error) throw error;
    return { orderId: data.orderId, total: data.total };
  },

  /* ---- แคชข้อมูลที่หน้าเว็บอ่านแบบทันที (รีเฟรชทุกครั้งที่สินค้าเปลี่ยน/เปิดแท็บแอดมิน) ---- */
  async refresh() {
    const run = async (f, d) => { try { return await f(); } catch (e) { return d; } };
    const [rv, cr, st, del] = await Promise.all([
      run(async () => need(await sb.from("reviews").select("*").eq("status", "approved").order("created_at", { ascending: false })), []),
      run(async () => need(await sb.from("credits").select("*").order("created_at")), []),
      run(async () => need(await sb.rpc("sales_stats")), null),
      SB._admin ? run(async () => need(await sb.from("products").select("*").eq("deleted", true).order("id")), []) : []
    ]);
    SB._c.reviews = rv.map(flat);
    SB._c.credits = cr;
    if (st) SB._c.stats = st;
    SB._c.deleted = del.map(fromRow);
  },
  listReviews() { return SB._c.reviews; },
  listCredits() { return SB._c.credits; },
  salesStats() { return SB._c.stats; },
  adminDeletedProducts() { return SB._c.deleted; },

  /* ---- รีวิว / เครดิต ---- */
  async addReview(r) { need(await sb.rpc("add_review", { p: r })); },
  async adminReviews() { return need(await sb.from("reviews").select("*").order("created_at", { ascending: false })).map(flat); },
  async adminReviewOp(id, op) {
    if (op === "del") need(await sb.from("reviews").delete().eq("id", id));
    else need(await sb.from("reviews").update({ status: op }).eq("id", id));
    await SB.refresh();
  },
  async adminCreditOp(op, id, val) {
    if (op === "add") need(await sb.from("credits").insert({ img: val }));
    else if (op === "del") need(await sb.from("credits").delete().eq("id", id));
    else if (op === "cap") need(await sb.from("credits").update({ caption: val }).eq("id", id));
    await SB.refresh();
  },

  /* ---- ติดตามพัสดุ / สลิป ---- */
  async trackOrder(code, phone) { return need(await sb.rpc("track_order", { p_code: code, p_phone: phone })); },
  async attachSlip(id, slip) { need(await sb.rpc("attach_slip", { p_id: id, p_slip: slip })); },

  /* ---- ฝากขาย ---- */
  async submitConsign(d) { return need(await sb.rpc("submit_consign", { p: d })); },
  async consignStatus(code, phone) { return need(await sb.rpc("consign_status", { p_code: code, p_phone: phone })); },
  async adminConsign() { return need(await sb.from("consign").select("*").order("created_at", { ascending: false })).map(flat); },
  async adminConsignPatch(id, patch) {
    const row = need(await sb.from("consign").select("*").eq("id", id).single());
    const { status, ...rest } = patch;
    const upd = { data: { ...(row.data || {}), ...rest } };
    if (status !== undefined) upd.status = status;
    need(await sb.from("consign").update(upd).eq("id", id));
  },
  async adminConsignList(id, opt) {
    const r = flat(need(await sb.from("consign").select("*").eq("id", id).single()));
    const pid = await SB.adminSaveProduct({
      name: r.name, brand: r.brand || "Generic", cat: r.cat, spec: "", price: opt.price, orig: opt.price,
      grade: r.grade || "B", warranty: 0, stock: opt.stock || 1, tested: r.notes || "", flaws: "", imgs: r.imgs || []
    });
    await SB.adminConsignPatch(id, { status: "listed", productId: pid, price: opt.price, commission: opt.commission, listed_at: Date.now() });
    return pid;
  },

  /* ---- แอดมิน: ออเดอร์ / ลูกค้า ---- */
  async adminOrders() { return need(await sb.from("orders").select("*").order("created_at", { ascending: false })); },
  async adminSetStatus(id, status) { need(await sb.from("orders").update({ status }).eq("id", id)); await SB.refresh(); },
  async adminSetShipping(id, ship) { need(await sb.rpc("admin_set_shipping", { p_id: id, p_ship: ship })); },
  async adminUpdateCustomer(oldPhone, oldName, d) {
    return need(await sb.rpc("admin_update_customer", { p_old_phone: oldPhone || "", p_old_name: oldName || "", p_name: d.name, p_phone: d.phone, p_address: d.address }));
  },

  /* ---- แอดมิน: สินค้า ---- */
  async adminSaveProduct(p) {
    const row = toRow(p);
    if (!p.id) {
      if (row.icon === undefined) row.icon = ({ Keyboard: "keyboard", Mouse: "mouse", Headset: "headphones" })[p.cat] || "package";
      const d = need(await sb.from("products").insert(row).select("id").single());
      return Number(d.id);
    }
    need(await sb.from("products").update(row).eq("id", p.id));
    return p.id;
  },
  async adminDeleteProduct(id) { need(await sb.from("products").update({ deleted: true }).eq("id", id)); },
  async adminRestoreProduct(id) { need(await sb.from("products").update({ deleted: false }).eq("id", id)); },
  async adminPurgeProduct(id) { need(await sb.from("products").delete().eq("id", id)); },
  async listOrders() {
    const { data, error } = await sb.from("orders")
      .select("id,items,payment,total,created_at,status,ship,has_slip")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data.map(o => ({ orderId: o.id, items: o.items, payment: o.payment, total: o.total, createdAt: o.created_at,
      status: o.status || "pending", ship: o.ship || null, slip: !!o.has_slip }));
  }
};

/* เลือก backend ที่ใช้งาน */
const B = USE_SB ? SB : LOCAL;
