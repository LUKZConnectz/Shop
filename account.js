/* ============ ACCOUNT UI ============ */
function openAccount() {
  if (!user) {
    pendingAction = null;
    renderAuth("login");
    return openModal("authModal");
  }
  renderAccount("profile");
  openModal("accountModal");
}

async function renderAccount(tab = "profile") {
  if (!user) return;
  accountTab = tab;
  $("accountBody").innerHTML = `
    <div class="acc-head">
      <div class="avatar">${ic("user-round")}</div>
      <div>
        <div class="n">${esc(user.name || "สมาชิก")}</div>
        <div class="e">${esc(user.email)}</div>
      </div>
    </div>
    <div class="tabs">
      <button class="tab ${tab === "profile" ? "on" : ""}" data-acc="profile">ข้อมูลบัญชี</button>
      <button class="tab ${tab === "orders" ? "on" : ""}" data-acc="orders">คำสั่งซื้อ</button>
    </div>
    <div id="accBody"></div>`;
  icons();

  if (tab === "profile") {
    $("accBody").innerHTML = `
      <form id="profileForm" novalidate class="form-grid">
        <div class="field">
          <label for="pName">ชื่อ-นามสกุล</label>
          <input id="pName" value="${esc(user.name)}">
        </div>
        <div class="field">
          <label for="pPhone">เบอร์โทรศัพท์</label>
          <input id="pPhone" inputmode="tel" value="${esc(user.phone)}">
        </div>
        <div class="field">
          <label for="pAddr">ที่อยู่จัดส่งเริ่มต้น</label>
          <textarea id="pAddr" placeholder="บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์">${esc(user.address)}</textarea>
        </div>
        <div class="form-err" id="profErr"></div>
        <button type="submit" class="btn-main">${ic("check")} บันทึกข้อมูล</button>
      </form>
      ${isAdmin() ? `<button class="logout" id="adminBtn" style="background:var(--text);color:var(--on-solid)">${ic("shield-check")} จัดการร้าน (แอดมิน)</button>` : ""}
      <button class="logout" id="logoutBtn">${ic("log-out")} ออกจากระบบ</button>`;
    icons();
    return;
  }

  $("accBody").innerHTML = `<div class="empty" style="padding:30px 0"><p>กำลังโหลดคำสั่งซื้อ...</p></div>`;
  let orders = [];
  try { orders = await B.listOrders(user.uid); }
  catch (e) {
    console.error(e);
    if (accountTab === tab) $("accBody").innerHTML = `<div class="empty"><p>โหลดคำสั่งซื้อไม่สำเร็จ</p></div>`;
    return;
  }
  if (accountTab !== tab) return;
  $("accBody").innerHTML = orders.length ? orders.map(o => `
      <div class="order">
        <div class="order-top"><code>${shortId(o.orderId)}</code><b>${fmt(o.total)}</b></div>
        <div class="muted"><b>${ORDER_STATUS[o.status] || ""}</b> · ${o.createdAt ? new Date(toMs(o.createdAt)).toLocaleString("th-TH") : "กำลังบันทึก"} · ${payLabel(o.payment)}</div>
        ${o.payment !== "cod" && !o.slip ? slipInput(o.orderId) : (o.slip ? `<div class="muted" style="color:#3ba55d">✓ แนบสลิปแล้ว</div>` : "")}${shipLine(o)}<div style="margin-top:6px">${(o.items || []).map(i => `${esc(i.name)} × ${i.qty}`).join("<br>")}</div>
      </div>`).join("")
    : `<div class="empty" style="padding:40px 0">${ic("receipt")}<p>ยังไม่มีคำสั่งซื้อ</p></div>`;
  icons();
}

async function saveProfile(e) {
  e.preventDefault();
  if (!user) return;
  const name = $("pName").value.trim();
  const phone = cleanPhone($("pPhone").value);
  const address = $("pAddr").value.trim();
  const err = m => { $("profErr").textContent = m; };
  if (name.length < 2) return err("กรุณากรอกชื่อ-นามสกุล");
  if (!validPhone(phone)) return err("เบอร์โทรไม่ถูกต้อง");
  try {
    await B.updateProfile({ uid: user.uid, name, phone, address });
    user = { ...user, name, phone, address };
    updateAccountBtn();
    toast("บันทึกข้อมูลแล้ว", "check");
    renderAccount("profile");
  } catch (ex) { err(errMsg(ex)); }
}

async function logout() {
  try { await B.signOut(); } catch (e) { console.error(e); }
  user = null;
  updateAccountBtn();
  closeAll();
  toast("ออกจากระบบแล้ว", "log-out");
}
