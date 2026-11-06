/* ============ NAVBAR ============ */
function setActiveNav(key, cat) {
  document.querySelectorAll("[data-nav]").forEach(a => {
    const active = a.dataset.nav === key && (key !== "catalog" || a.dataset.cat === cat);
    a.classList.toggle("active", active);
  });
}

/* ไฮไลต์เมนูตามตำแหน่งที่เลื่อน (รวมกรณีเลื่อนสุดหน้า = "ติดต่อ") */
const NAV_SECTIONS = ["top", "catalog", "policy", "reviews", "contact"];
let navTick = false;
/* สลับมุมมอง: หน้าแรก / รีวิว / ติดตามพัสดุ (ใช้ hash) */
const VIEWS = { "#reviews": "reviews", "#track": "track", "#admin": "admin", "#contact": "contact", "#consign": "consign" };
function applyView() {
  const view = VIEWS[location.hash] || "";
  Object.values(VIEWS).forEach(v => document.body.classList.toggle("view-" + v, view === v));
  if (view) { window.scrollTo(0, 0); setActiveNav(view); return; }
  const id = location.hash.slice(1), el = id && document.getElementById(id);
  requestAnimationFrame(() => {
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
window.addEventListener("hashchange", applyView);
applyView();

function updateActiveNav() {
  if (/view-(reviews|track|admin|contact|consign)/.test(document.body.className)) return;
  navTick = false;
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
  let current = "top";
  if (atBottom) current = "contact";
  else NAV_SECTIONS.forEach(id => {
    if ($(id).getBoundingClientRect().top <= window.innerHeight * 0.45) current = id;
  });
  setActiveNav(current, state.cat);
}

$("burger").addEventListener("click", () => setBurger(!$("menu").classList.contains("open")));

$("menu").addEventListener("click", e => {
  const a = e.target.closest("[data-nav]");
  if (!a) return;
  if (a.dataset.nav === "catalog" && a.dataset.cat) {
    state.cat = a.dataset.cat;
    renderAll(true);
  }
  setActiveNav(a.dataset.nav, state.cat);
  setBurger(false);
});

$("searchBtn").addEventListener("click", () => {
  const open = !$("searchWrap").classList.contains("open");
  if (open) setSearchOpen(true);
  else if (!$("searchInput").value) setSearchOpen(false);
  else $("searchInput").focus();
});
$("searchInput").addEventListener("blur", () => { if (!$("searchInput").value) setSearchOpen(false); });
$("searchBtn").addEventListener("mousedown", e => e.preventDefault()); // กัน blur ปิดช่องค้นหาแล้วเปิดซ้ำ
$("accountBtn").addEventListener("click", openAccount);

/* ============ EVENTS ============ */
$("chips").addEventListener("click", e => {
  const b = e.target.closest("[data-cat]");
  if (!b) return;
  state.cat = b.dataset.cat;
  renderAll(true);
  setActiveNav("catalog", state.cat);
});

$("searchInput").addEventListener("input", e => {
  state.q = e.target.value.trim();
  renderGrid(false);
  icons();
});

$("sortSelect").addEventListener("change", e => { state.sort = e.target.value; renderGrid(true); icons(); });
$("priceSelect").addEventListener("change", e => { state.price = e.target.value; renderAll(true); });
$("stockOnly").addEventListener("change", e => { state.inStock = e.target.checked; renderAll(true); });

$("grid").addEventListener("click", e => {
  const add = e.target.closest("[data-add]");
  if (add) { e.stopPropagation(); return addToCart(add.dataset.add); }
  if (e.target.closest("[data-reset]")) {
    Object.assign(state, { cat: "ทั้งหมด", q: "", price: "all", inStock: false, sort: "default" });
    $("searchInput").value = ""; $("priceSelect").value = "all"; $("stockOnly").checked = false; $("sortSelect").value = "default";
    return renderAll(true);
  }
  const card = e.target.closest("[data-open]");
  if (card) openDetail(card.dataset.open);
});

$("grid").addEventListener("keydown", e => {
  if (e.key === "Enter" && e.target.matches("[data-open]")) openDetail(e.target.dataset.open);
});

$("detailBody").addEventListener("click", e => {
  const add = e.target.closest("[data-add]");
  if (add) { addToCart(add.dataset.add); renderDetail(add.dataset.add); }
});

$("items").addEventListener("click", e => {
  const t = e.target.closest("[data-inc],[data-dec],[data-rm]");
  if (!t || t.disabled) return;
  if (t.dataset.inc) changeQty(t.dataset.inc, 1);
  else if (t.dataset.dec) changeQty(t.dataset.dec, -1);
  else if (t.dataset.rm) removeFromCart(t.dataset.rm);
});

$("authBody").addEventListener("click", e => {
  const t = e.target.closest("[data-mode]");
  if (t) renderAuth(t.dataset.mode);
});
$("authBody").addEventListener("submit", e => {
  if (e.target.id === "authForm") handleAuth(e);
});

$("accountBody").addEventListener("click", e => {
  const t = e.target.closest("[data-acc]");
  if (t) return renderAccount(t.dataset.acc);
  if (e.target.closest("#logoutBtn")) logout();
  if (e.target.closest("#adminBtn")) openAdmin();
});
$("accountBody").addEventListener("submit", e => {
  if (e.target.id === "profileForm") saveProfile(e);
});

$("cartBtn").addEventListener("click", openDrawer);
$("overlay").addEventListener("click", closeAll);
$("checkoutBtn").addEventListener("click", openCheckout);

document.addEventListener("click", e => {
  if (e.target.closest("[data-close]")) closeAll();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") { closeAll(); setBurger(false); }
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    setSearchOpen(true);
  }
});

window.addEventListener("scroll", () => {
  $("header").classList.toggle("scrolled", window.scrollY > 10);
  if (!navTick) { navTick = true; requestAnimationFrame(updateActiveNav); }
}, { passive: true });
window.addEventListener("resize", updateActiveNav);

/* ============ INIT ============ */
renderMarquee();
renderContact();
updateAccountBtn();
renderAll(true);
updateActiveNav();

B.subscribeAuth(u => {
  user = u;
  updateAccountBtn();
});

B.subscribeProducts(list => {
  products = list.map(p => ({ ...p, id: Number(p.id) }));
  productsLoaded = true;
  if (!placingOrder && sanitizeCart()) toast("สต็อกบางรายการอัปเดตแล้ว กรุณาตรวจสอบตะกร้า", "alert-circle");
  renderAll(false);
});
