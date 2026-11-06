/* ============ ซิงก์ตั้งค่าร้านจาก Supabase ============
   ค่าที่แอดมินแก้ (แบนเนอร์ มาสคอต โปรโมชัน ข้อมูลติดต่อ) เก็บใน Supabase
   เบราว์เซอร์เก็บสำเนาไว้ใน localStorage เพื่อให้หน้าเว็บขึ้นเร็ว
   ถ้าค่าบนเซิร์ฟเวอร์ต่างจากสำเนา จะอัปเดตสำเนาแล้วโหลดหน้าใหม่ 1 ครั้ง */
(function () {
  if (typeof USE_SB === "undefined" || !USE_SB) return;
  const KEY = "phumin-sb-settings";
  (async () => {
    try {
      const { data, error } = await sb.from("settings").select("key,value");
      if (error || !data) return;
      const next = {};
      data.forEach(r => { next[r.key] = r.value; });
      const nextStr = JSON.stringify(next);
      const cur = localStorage.getItem(KEY) || "";
      const curNorm = JSON.stringify(JSON.parse(cur || "{}"));
      if (curNorm === nextStr || (!data.length && !cur)) return;
      /* กันโหลดซ้ำไม่จบ: ลองแค่ครั้งเดียวต่อค่าชุดเดียวกัน */
      if (sessionStorage.getItem("phumin-sync-tried") === nextStr) return;
      sessionStorage.setItem("phumin-sync-tried", nextStr);
      localStorage.setItem(KEY, nextStr);
      location.reload();
    } catch (e) { /* ใช้สำเนาเดิมต่อไป */ }
  })();
})();
