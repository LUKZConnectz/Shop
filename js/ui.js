/* ============ UI HELPERS ============ */
let toastTimer;
function toast(msg, icon = "info") {
  const t = $("toast");
  t.innerHTML = ic(icon) + `<span>${esc(msg)}</span>`;
  t.classList.add("show");
  icons();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2300);
}

function bump() {
  const b = $("cartCount");
  b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
}

function closeAll() {
  document.querySelectorAll(".modal, .drawer").forEach(el => el.classList.remove("show"));
  $("overlay").classList.remove("show");
  document.body.classList.remove("locked");
}

function openModal(id) {
  closeAll();
  $(id).classList.add("show");
  $("overlay").classList.add("show");
  document.body.classList.add("locked");
  icons();
}

function openDrawer() {
  closeAll();
  $("drawer").classList.add("show");
  $("overlay").classList.add("show");
  document.body.classList.add("locked");
  icons();
}

function setBurger(open) {
  $("menu").classList.toggle("open", open);
  $("burger").setAttribute("aria-expanded", String(open));
  $("burger").innerHTML = ic(open ? "x" : "menu");
  icons();
}

function setSearchOpen(open) {
  $("searchWrap").classList.toggle("open", open);
  if (open) $("searchInput").focus(); else $("searchInput").blur();
}
