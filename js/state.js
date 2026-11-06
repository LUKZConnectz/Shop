/* ============ APP STATE ============ */
let products = [];
let productsLoaded = false;
let user = null;
let cart = {};
Object.entries(load(LS.cart, {})).forEach(([id, q]) => { cart[id] = Math.max(1, Number(q) || 1); });
let state = { cat: "ทั้งหมด", q: "", sort: "default", price: "all", inStock: false };
let selectedPay = "transfer";
let pendingAction = null;
let authMode = "login";
let accountTab = "profile";
let placingOrder = false;

const persistCart = () => save(LS.cart, cart);
const find = id => products.find(p => String(p.id) === String(id));
const cartLines = () => Object.keys(cart).map(id => ({ p: find(id), q: cart[id] })).filter(x => x.p);
const cartCount = () => cartLines().reduce((a, l) => a + l.q, 0);
const cartPricing = payment => calcTotal(cartLines().reduce((s, l) => s + l.p.price * l.q, 0), payment);

function sanitizeCart() {
  if (!productsLoaded) return false;
  let changed = false;
  Object.keys(cart).forEach(id => {
    const p = find(id);
    if (!p || p.stock <= 0) { delete cart[id]; changed = true; }
    else if (cart[id] > p.stock) { cart[id] = p.stock; changed = true; }
  });
  if (changed) persistCart();
  return changed;
}
