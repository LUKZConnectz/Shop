/* ============ AUTH UI ============ */
function renderAuth(mode = "login") {
  authMode = mode;
  const titles = { login: "เข้าสู่ระบบ", register: "สมัครสมาชิก", reset: "ลืมรหัสผ่าน" };
  $("authTitle").textContent = titles[mode];
  const tabs = mode === "reset" ? "" : `
    <div class="tabs">
      <button class="tab ${mode === "login" ? "on" : ""}" data-mode="login">เข้าสู่ระบบ</button>
      <button class="tab ${mode === "register" ? "on" : ""}" data-mode="register">สมัครสมาชิก</button>
    </div>`;
  const btnText = { login: ["log-in", "เข้าสู่ระบบ"], register: ["user-plus", "สมัครสมาชิก"], reset: ["mail", "ส่งลิงก์รีเซ็ตรหัสผ่าน"] }[mode];
  $("authBody").innerHTML = `
    ${tabs}
    <form id="authForm" novalidate class="form-grid">
      ${mode === "register" ? `
      <div class="field">
        <label for="aName">ชื่อ-นามสกุล</label>
        <input id="aName" autocomplete="name" placeholder="เช่น สมชาย ใจดี">
      </div>
      <div class="field">
        <label for="aPhone">เบอร์โทรศัพท์</label>
        <input id="aPhone" inputmode="tel" autocomplete="tel" placeholder="0812345678">
      </div>` : ""}
      <div class="field">
        <label for="aEmail">อีเมล</label>
        <input id="aEmail" type="email" autocomplete="email" placeholder="you@example.com">
      </div>
      ${mode === "reset" ? "" : `
      <div class="field">
        <label for="aPw">รหัสผ่าน</label>
        <input id="aPw" type="password" autocomplete="${mode === "login" ? "current-password" : "new-password"}" placeholder="อย่างน้อย 6 ตัวอักษร">
      </div>`}
      <div class="form-err" id="authErr"></div>
      <button type="submit" class="btn-main">${ic(btnText[0])} ${btnText[1]}</button>
      ${mode === "login" ? `<div style="text-align:center"><button type="button" class="link-btn" data-mode="reset">ลืมรหัสผ่าน?</button></div>` : ""}
      ${mode === "reset" ? `<div style="text-align:center"><button type="button" class="link-btn" data-mode="login">กลับไปเข้าสู่ระบบ</button></div>` : ""}
    </form>`;
  icons();
  setTimeout(() => { const el = $(mode === "register" ? "aName" : "aEmail"); if (el) el.focus(); }, 250);
}

async function handleAuth(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const err = m => { $("authErr").textContent = m; };
  err("");
  const email = $("aEmail").value.trim().toLowerCase();
  if (!validEmail(email)) return err("รูปแบบอีเมลไม่ถูกต้อง");

  btn.disabled = true;
  try {
    if (authMode === "reset") {
      await B.resetPassword(email);
      toast("ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลแล้ว", "mail");
      return renderAuth("login");
    }
    const pw = $("aPw").value;
    if (pw.length < 6) return err("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");

    if (authMode === "register") {
      const name = $("aName").value.trim();
      const phone = cleanPhone($("aPhone").value);
      if (name.length < 2) return err("กรุณากรอกชื่อ-นามสกุล");
      if (!validPhone(phone)) return err("เบอร์โทรต้องขึ้นต้นด้วย 0 และมี 9–10 หลัก");
      const r = await B.signUp({ name, phone, email, pw });
      if (r.pending) {
        toast("ส่งลิงก์ยืนยันไปที่อีเมลแล้ว กรุณายืนยันก่อนเข้าสู่ระบบ", "mail");
        return renderAuth("login");
      }
      user = r.user;
    } else {
      const r = await B.signIn(email, pw);
      user = r.user;
    }
    updateAccountBtn();
    toast(authMode === "register" ? "สมัครสมาชิกสำเร็จ ยินดีต้อนรับ" : "เข้าสู่ระบบแล้ว", "check");
    const goCheckout = pendingAction === "checkout" && cartCount() > 0;
    pendingAction = null;
    if (goCheckout) openCheckout(); else closeAll();
  } catch (ex) {
    err(errMsg(ex));
  } finally {
    btn.disabled = false;
  }
}
