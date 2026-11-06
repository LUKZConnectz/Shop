/* ============ SUPABASE CONFIG ============
   วาง Project URL และ anon public key จาก Supabase > Project Settings > API
   ถ้ายังเป็น YOUR_... เว็บจะทำงานในโหมดทดลอง (เก็บข้อมูลในเบราว์เซอร์) */
const SUPABASE_CONFIG = {
  url: "https://uyoacogndpnsxwndanmk.supabase.co",
  anonKey: "sb_publishable_fTlUpbhjl_Gppvu1FK66Gg_MAnfZKNW"
};

/* ============ SHOP CONFIG ============ */
const SHOP = {
  bank: "ธนาคารกสิกรไทย",
  accName: "ร้าน Phumin",
  accNo: "000-0-00000-0",
  phone: "08X-XXX-XXXX",
  ppId: "0944191917",            /* เบอร์พร้อมเพย์ของร้าน (QR ชำระเงิน) */
  ppName: "ธัญพิสิษฐ์ นิลวงษ์",
  line: "@phumin",
  hours: "จันทร์–เสาร์ 10:00–19:00",
  fb: "https://www.facebook.com/profile.php?id=100088911469467"   /* ลิงก์เพจ Facebook เช่น https://www.facebook.com/xxxx (ว่างไว้ = ไม่แสดง) */
};
/* อีเมลแอดมิน (โหมดทดลอง): สมัครสมาชิกด้วยอีเมลนี้เพื่อเข้าระบบแอดมิน */
const ADMIN_EMAILS = ["admin@phumin.shop"];
const ORDER_STATUS = { pending: "รอชำระเงิน", paid: "ชำระแล้ว", shipped: "จัดส่งแล้ว", delivered: "ส่งถึงแล้ว", cancelled: "ยกเลิก" };
const SHIP_FREE = 2000, SHIP_FEE = 80, COD_FEE = 30;
const LS = { cart: "phumin-sb-cart", stock: "phumin-sb-stock", users: "phumin-sb-users", session: "phumin-sb-session", orders: "phumin-sb-orders", prods: "phumin-sb-prods", reviews: "phumin-sb-reviews", credits: "phumin-sb-credits" };

const CATS = [
  { key: "ทั้งหมด", label: "ทั้งหมด", icon: "layout-grid" },
  { key: "Keyboard", label: "คีย์บอร์ด", icon: "keyboard" },
  { key: "Mouse", label: "เมาส์", icon: "mouse" },
  { key: "Headset", label: "หูฟัง", icon: "headphones" },
  { key: "Accessories", label: "อุปกรณ์เสริม", icon: "package" }
];
/* ช่วงราคา: มากกว่า min และ ไม่เกิน max */
const PRICE_RANGES = { all: [-Infinity, Infinity], u1: [-Infinity, 1000], m: [1000, 2000], h: [2000, Infinity] };
const GRADE = {
  A: { short: "เกรด A", label: "เกรด A · สภาพดีมาก", desc: "ไม่มีรอยขีดข่วนชัดเจน ทดสอบทุกปุ่ม สวิตช์ หรือเซนเซอร์ครบถ้วน" },
  B: { short: "เกรด B", label: "เกรด B · สภาพดี", desc: "มีรอยการใช้งานเล็กน้อย ประสิทธิภาพปกติ ผ่านการทดสอบครบทุกขั้นตอน" }
};

/* ข้อมูลเริ่มต้น: ใช้ในโหมดทดลอง และเป็นต้นแบบของ SQL seed ใน Supabase */
/* ใส่รูปจริงได้ 2 วิธี: เพิ่ม img: "images/g304.jpg" ในสินค้า หรืออัปโหลดผ่านหน้าแอดมิน */
const SEED = [
  { id: 1,  cat: "Mouse", brand: "Logitech", name: "G304 Lightspeed", spec: "ไร้สาย · 12,000 DPI · 99g", price: 690, orig: 1290, grade: "A", icon: "mouse", warranty: 30, stock: 6 },
  { id: 2,  cat: "Mouse", brand: "Razer", name: "DeathAdder V2", spec: "มีสาย · 20,000 DPI · Optical", price: 790, orig: 1490, grade: "A", icon: "mouse", warranty: 30, stock: 3 },
  { id: 3,  cat: "Mouse", brand: "Logitech", name: "MX Anywhere 3", spec: "ไร้สาย · Bluetooth · 4,000 DPI", price: 990, orig: 2290, grade: "B", icon: "mouse-pointer-2", warranty: 30, stock: 2 },
  { id: 4,  cat: "Mouse", brand: "Razer", name: "Viper Mini", spec: "มีสาย · 8,500 DPI · 61g", price: 690, orig: 1390, grade: "A", icon: "mouse", warranty: 30, stock: 0 },
  { id: 5,  cat: "Keyboard", brand: "Logitech", name: "MX Keys", spec: "Full-size · Backlit · Bluetooth", price: 1490, orig: 3490, grade: "A", icon: "keyboard", warranty: 30, stock: 2 },
  { id: 6,  cat: "Keyboard", brand: "Keychron", name: "K2 (Brown Switch)", spec: "75% · Hot-swap · ไร้สาย", price: 1190, orig: 2890, grade: "B", icon: "keyboard", warranty: 30, stock: 2 },
  { id: 7,  cat: "Keyboard", brand: "Keychron", name: "K6 (Red Switch)", spec: "65% · Hot-swap · ไร้สาย", price: 1290, orig: 3090, grade: "A", icon: "keyboard", warranty: 60, stock: 1 },
  { id: 8,  cat: "Keyboard", brand: "Razer", name: "BlackWidow V3 Mini", spec: "65% · Hyperspeed · Green Switch", price: 1190, orig: 2990, grade: "A", icon: "keyboard", warranty: 30, stock: 2 },
  { id: 9,  cat: "Headset", brand: "HyperX", name: "Cloud II Gaming", spec: "มีสาย · 7.1 Virtual · 53mm", price: 1090, orig: 2490, grade: "A", icon: "headphones", warranty: 30, stock: 2 },
  { id: 10, cat: "Headset", brand: "Logitech", name: "G435 Lightspeed", spec: "ไร้สาย · Bluetooth · 165g", price: 890, orig: 1990, grade: "B", icon: "headphones", warranty: 30, stock: 3 },
  { id: 11, cat: "Headset", brand: "Razer", name: "Kraken V3", spec: "USB · 7.1 Surround · Mic ตัดเสียง", price: 1190, orig: 2690, grade: "A", icon: "headphones", warranty: 60, stock: 1 },
  { id: 12, cat: "Accessories", brand: "SteelSeries", name: "QcK XL Mousepad", spec: "900 × 400 mm · ผ้าไมโคร", price: 490, orig: 890, grade: "A", icon: "rectangle-horizontal", warranty: 30, stock: 5 },
  { id: 13, cat: "Accessories", brand: "Generic", name: "PBT Keycap Set 108 ปุ่ม", spec: "Cherry Profile · Double-shot", price: 690, orig: 1590, grade: "A", icon: "grid-3x3", warranty: 30, stock: 2 },
  { id: 14, cat: "Accessories", brand: "Generic", name: "Switch Tester Kit", spec: "36 ชนิด · สำหรับทดสอบสวิตช์", price: 350, orig: 890, grade: "A", icon: "toggle-right", warranty: 30, stock: 4 },
  { id: 15, cat: "Accessories", brand: "Anker", name: "USB-C Cable 2m", spec: "ถักไนลอน · USB 2.0 · 60W", price: 190, orig: 490, grade: "A", icon: "cable", warranty: 30, stock: 8 },
  { id: 16, cat: "Accessories", brand: "Anker", name: "USB-C Hub 7-in-1", spec: "HDMI 4K · USB 3.0 · SD", price: 590, orig: 1590, grade: "A", icon: "usb", warranty: 30, stock: 3 }
];

/* โปรโมชันป็อปอัป: แก้ข้อความได้ที่นี่ (เปลี่ยน id เมื่อมีโปรใหม่ เพื่อให้ลูกค้าเห็นอีกครั้ง) */
const PROMO = {
  enabled: true,
  id: "free-ship-2000",
  badge: "โปรโมชัน",
  title: "ส่งฟรีเมื่อซื้อครบ 2,000 ฿",
  text: "เลือกสินค้ามือสองคัดคุณภาพ ส่งฟรีทั่วประเทศเมื่อยอดสั่งซื้อครบ",
  cta: "ดูสินค้าทั้งหมด",
  href: "#catalog",
  delay: 6000
};

/* ค่าที่แอดมินแก้ในหน้า "ตั้งค่าร้าน" จะทับค่าด้านบนตอนโหลด */
try {
  const _o = JSON.parse(localStorage.getItem("phumin-sb-settings") || "null");
  if (_o) { Object.assign(SHOP, _o.shop || {}); Object.assign(PROMO, _o.promo || {}); }
  window.__bannerSaved = (_o && Array.isArray(_o.banner) && _o.banner.length) ? _o.banner : null;
} catch {}

/* ฝากขาย: ค่าคอมมิชชันเริ่มต้น (%) และจำนวนรูปสูงสุดต่อรายการ */
const CONSIGN = { commission: 20, maxPhotos: 6 };


/* ============ แบนเนอร์สไลด์หน้าแรก (รูปภาพอย่างเดียว) ============
   img  = ไฟล์รูป (วางไว้ในโฟลเดอร์ images/)  ขนาด 2000x500 px (อัตราส่วน 4:1)
   alt  = คำอธิบายรูป (สำหรับคนใช้โปรแกรมอ่านหน้าจอ)
   href = ลิงก์เมื่อกดที่รูป เช่น "#catalog" (ว่างไว้ = กดไม่ได้)
   ms   = ความเร็วเลื่อนอัตโนมัติ (มิลลิวินาที)
   เพิ่ม/ลบสไลด์ได้ที่รายการด้านล่าง */
const BANNER = {
  ms: 5000,
  slides: [
    { img: "images/banner-1.svg", alt: "แบนเนอร์ 1", href: "#catalog" },
    { img: "images/banner-2.svg", alt: "แบนเนอร์ 2", href: "#contact" },
    { img: "images/banner-3.svg", alt: "แบนเนอร์ 3", href: "#catalog" }
  ]
};

/* รูปแบนเนอร์ที่แอดมินเพิ่มในหน้า "ตั้งค่าร้าน" จะใช้แทนรายการด้านบน */
if (window.__bannerSaved) BANNER.slides = window.__bannerSaved;
