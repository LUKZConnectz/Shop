/* ============ CART ACTIONS ============ */
function addToCart(id) {
  const p = find(id);
  if (!p) return;
  if (p.stock <= 0) return toast("สินค้านี้ขายแล้ว", "circle-x");
  const cur = cart[p.id] || 0;
  if (cur >= p.stock) return toast(`มีเพียง ${p.stock} ชิ้นในสต็อก`, "alert-circle");
  cart[p.id] = cur + 1;
  persistCart();
  renderAll(false);
  bump();
  toast(`เพิ่ม ${p.name} แล้ว`, "check");
}

function changeQty(id, delta) {
  const p = find(id);
  if (!p) return;
  const next = (cart[id] || 0) + delta;
  if (next > p.stock) return toast(`มีเพียง ${p.stock} ชิ้นในสต็อก`, "alert-circle");
  if (next <= 0) delete cart[id]; else cart[id] = next;
  persistCart();
  renderAll(false);
}

function removeFromCart(id) {
  delete cart[id];
  persistCart();
  renderAll(false);
}

/* ============ DETAIL ============ */
function renderDetail(id) {
  const p = find(id);
  if (!p) return;
  const inCart = cart[p.id] || 0;
  const off = p.orig > p.price ? Math.round((1 - p.price / p.orig) * 100) : 0;
  const g = GRADE[p.grade] || GRADE.A;
  $("detailBody").innerHTML = `
    <div class="detail">
      ${stackHtml(p)}
      <div>
        <div class="brand">${esc(p.brand)} · ${esc(catLabel(p.cat))}</div>
        <div class="name">${esc(p.name)}</div>
        <table class="kv">
          <tr><td>สเปก</td><td>${esc(p.spec)}</td></tr>
          <tr><td>ประกันร้าน</td><td>${p.warranty} วัน</td></tr>
          <tr><td>คงเหลือ</td><td>${p.stock > 0 ? p.stock + " ชิ้น" : "หมดแล้ว"}</td></tr>
          ${off > 0 ? `<tr><td>ราคาใหม่ (ประมาณ)</td><td><s>${fmt(p.orig)}</s> · ประหยัด ${off}%</td></tr>` : ""}
        </table>
        <div class="grade-desc"><b>${p.gradeLabel ? esc(p.gradeLabel) : g.label}</b><br>${p.gradeDesc ? esc(p.gradeDesc) : g.desc}</div>
        ${reportHtml(p)}
        <div class="price" style="margin-bottom:12px">${fmt(p.price)}</div>
        <div class="row">
          <span class="brand" style="margin:0">${inCart ? "ในตะกร้า " + inCart + " ชิ้น" : ""}</span>
          <button class="add" data-add="${esc(p.id)}" ${p.stock <= 0 || inCart >= p.stock ? "disabled" : ""}>
            ${p.stock <= 0 ? "ขายแล้ว" : inCart >= p.stock ? "ในตะกร้าแล้ว" : "หยิบใส่ตะกร้า"}
          </button>
        </div>
      </div>
    </div>`;
  icons();
}

function openDetail(id) {
  renderDetail(id);
  openModal("detailModal");
}

/* ============ การ์ดรูปซ้อนกัน (ปัด/แตะเพื่อสลับ) ============ */
function stackHtml(p) {
  const im = p.imgs || [];
  if (im.length < 2) return `<div class="big" ${im.length ? `data-zoom data-pid="${p.id}" style="cursor:zoom-in"` : ""}>${pic(p)}</div>`;
  return `<div class="stack-wrap"><button class="zoom" data-zoom data-pid="${p.id}" aria-label="ขยายรูป">ขยาย ⤢</button>
    <div class="stack" data-cur="0" data-n="${im.length}">${im.map((s, i) => `<div class="sc" style="--o:${i}"><img src="${esc(s)}" alt="${esc(p.name)} ${i + 1}" draggable="false"></div>`).join("")}</div>
    <div class="sbar"><button class="snav" data-sn="-1" aria-label="รูปก่อนหน้า">‹</button><div class="sdots">${im.map((_, i) => `<button data-goto="${i}" class="${i ? "" : "on"}" aria-label="รูปที่ ${i + 1}"></button>`).join("")}</div><button class="snav" data-sn="1" aria-label="รูปถัดไป">›</button></div>
    <small class="shint">กดการ์ดด้านหลัง ลูกศร หรือจุด เพื่อเลือกรูป · กดรูปหน้าสุดเพื่อขยาย (<span class="scount">1</span>/${im.length})</small>
  </div>`;
}
function stackLayout(st) {
  const n = +st.dataset.n, cur = +st.dataset.cur;
  st.querySelectorAll(".sc").forEach((c, i) => {
    const o = (i - cur + n) % n;
    c.style.setProperty("--o", o);
    c.classList.toggle("far", o > 2);
  });
  st.parentElement.querySelectorAll(".sdots [data-goto]").forEach((d, i) => d.classList.toggle("on", i === cur));
  st.parentElement.querySelector(".scount").textContent = cur + 1;
}
function stackNext(st) {
  if (st.dataset.busy) return;
  const n = +st.dataset.n, cur = +st.dataset.cur, front = st.querySelectorAll(".sc")[cur];
  st.dataset.busy = 1;
  front.style.transform = ""; front.classList.add("out");
  setTimeout(() => {
    front.classList.add("noanim"); front.classList.remove("out");
    st.dataset.cur = (cur + 1) % n; stackLayout(st);
    void front.offsetWidth; front.classList.remove("noanim");
    delete st.dataset.busy;
  }, 330);
}
function stackPrev(st) {
  if (st.dataset.busy) return;
  const n = +st.dataset.n;
  st.dataset.cur = (+st.dataset.cur - 1 + n) % n; stackLayout(st);
}
/* กดเลือกรูป (ไม่ต้องปัด) */
document.addEventListener("click", e => {
  const n = e.target.closest("[data-sn]"), g = e.target.closest("[data-goto]"), c = e.target.closest(".sc");
  const st = (n || g || c)?.closest(".stack-wrap")?.querySelector(".stack");
  if (!st) return;
  if (n) return +n.dataset.sn > 0 ? stackNext(st) : stackPrev(st);
  if (g) { st.dataset.cur = g.dataset.goto; return stackLayout(st); }
  const i = [...st.children].indexOf(c);
  if (i !== +st.dataset.cur) { st.dataset.cur = i; return stackLayout(st); }
  st.parentElement.querySelector("[data-zoom]").click();
});

/* ============ ดูรูปเต็มจอ (แตะรูปเพื่อซูม เลื่อนเพื่อดูรายละเอียด) ============ */
const LB = { list: [], i: 0 };
function lbShow() {
  $("lbImg").src = LB.list[LB.i];
  $("lbScroll").classList.remove("zoom"); $("lbScroll").scrollTo(0, 0);
  $("lbCount").textContent = LB.list.length > 1 ? `${LB.i + 1} / ${LB.list.length}` : "";
  $("lbPrev").hidden = $("lbNext").hidden = LB.list.length < 2;
}
const lbGo = d => { LB.i = (LB.i + d + LB.list.length) % LB.list.length; lbShow(); };
const lbClose = () => $("lb").classList.remove("show");
document.addEventListener("click", e => {
  const z = e.target.closest("[data-zoom]");
  if (z) {
    const p = find(z.dataset.pid), st = z.parentElement.querySelector(".stack");
    if (!p || !p.imgs?.length) return;
    LB.list = p.imgs; LB.i = st ? +st.dataset.cur : 0;
    $("lb").classList.add("show"); lbShow();
  }
});
$("lbX").onclick = lbClose;
$("lbPrev").onclick = () => lbGo(-1);
$("lbNext").onclick = () => lbGo(1);
$("lbImg").onclick = () => $("lbScroll").classList.toggle("zoom");
$("lb").addEventListener("click", e => { if (e.target === $("lb")) lbClose(); });
document.addEventListener("keydown", e => {
  if (!$("lb").classList.contains("show")) return;
  if (e.key === "Escape") { e.stopImmediatePropagation(); lbClose(); }
  if (e.key === "ArrowLeft") lbGo(-1);
  if (e.key === "ArrowRight") lbGo(1);
}, true);
