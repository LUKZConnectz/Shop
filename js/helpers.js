/* ============ HELPERS ============ */
const $ = id => document.getElementById(id);
const icons = () => renderIcons();
const ic = (name, cls = "") => `<i data-lucide="${name}" class="${cls}"></i>`;
const fmt = n => "฿" + Number(n).toLocaleString("en-US");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
/* รูปสินค้า: ใช้รูปจริงถ้ามี (p.img) ไม่งั้นใช้ไอคอน */
const pic = p => p.img ? `<img class="pic" src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy">` : ic(p.icon);
const catLabel = key => (CATS.find(c => c.key === key) || { label: key }).label;
const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const cleanPhone = p => String(p).replace(/[\s-]/g, "");
const validPhone = p => /^0\d{8,9}$/.test(cleanPhone(p));
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const genId = () => (Date.now().toString(36) + Math.random().toString(36).slice(2)).slice(0, 20);
const toMs = t => typeof t === "number" ? t : (t ? new Date(t).getTime() : 0);
const shortId = id => "ORD-" + String(id).replace(/-/g, "").slice(0, 6).toUpperCase();
const payLabel = v => ({ transfer: "โอนเงิน", promptpay: "พร้อมเพย์", cod: "ชำระปลายทาง" }[v] || v);

function errMsg(e) {
  const m = String(e?.message || e || "");
  if (m.includes("OUT_OF_STOCK")) return "สินค้าบางรายการหมดแล้ว";
  if (m.includes("NOT_AUTHENTICATED")) return "กรุณาเข้าสู่ระบบก่อน";
  if (m.includes("EMPTY_CART")) return "ตะกร้าว่างเปล่า";
  if (m.includes("Invalid login credentials")) return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
  if (m.includes("User already registered")) return "อีเมลนี้สมัครสมาชิกแล้ว กรุณาเข้าสู่ระบบ";
  if (m.includes("Password should be at least")) return "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
  if (m.includes("Email not confirmed")) return "ยังไม่ได้ยืนยันอีเมล กรุณาตรวจสอบกล่องจดหมาย";
  if (m.includes("security purposes") || m.toLowerCase().includes("rate limit")) return "ทำรายการถี่เกินไป กรุณารอสักครู่";
  if (m.includes("Failed to fetch")) return "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้";
  if (m.includes("row-level security")) return "ไม่มีสิทธิ์ดำเนินการ";
  return m && m.length < 120 ? m : "เกิดข้อผิดพลาด กรุณาลองใหม่";
}

async function hashPw(s) {
  if (window.crypto && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("phumin|" + s));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  }
  let h = 5381;
  for (const c of "phumin|" + s) h = ((h << 5) + h + c.charCodeAt(0)) | 0;
  return "fb" + (h >>> 0).toString(16);
}

/* คำนวณยอดเหมือนฟังก์ชัน place_order ใน SQL */
function calcTotal(sub, payment) {
  const ship = sub === 0 || sub >= SHIP_FREE ? 0 : SHIP_FEE;
  const fee = payment === "cod" ? COD_FEE : 0;
  return { sub, ship, fee, total: sub + ship + fee };
}
