ตั้งค่า Supabase ให้ Phumin Shop (ทำครั้งเดียว)

1) Supabase > SQL Editor > New query > เปิดไฟล์ schema.sql แล้ววางทั้งไฟล์ > Run
   (รันซ้ำได้ ไม่ทำให้ข้อมูลเดิมหาย)

2) Authentication > Sign In / Providers > Email
   - ถ้าอยากให้ลูกค้าสมัครแล้วใช้ได้ทันที ให้ปิด "Confirm email"
   - ถ้าเปิดไว้ ลูกค้าต้องกดลิงก์ยืนยันในอีเมลก่อนเข้าสู่ระบบ

3) Authentication > URL Configuration
   - Site URL: ใส่ที่อยู่เว็บจริงของร้าน เช่น https://phumin-shop.netlify.app
   - Redirect URLs: ใส่ที่อยู่เดียวกัน (ใช้กับลิงก์ยืนยันอีเมล/รีเซ็ตรหัสผ่าน)

4) ตั้งแอดมิน: สมัครสมาชิกในเว็บด้วยอีเมลที่จะใช้เป็นแอดมิน แล้วไปที่ SQL Editor รัน
   insert into public.admins (user_id) select id from auth.users where email = 'อีเมลของคุณ@example.com' on conflict do nothing;
   จากนั้นออกจากระบบแล้วเข้าใหม่ จะมีปุ่มแอดมินในหน้าบัญชี

5) นำโฟลเดอร์นี้ขึ้นโฮสต์ (Netlify / Vercel / GitHub Pages / Cloudflare Pages) แล้วเปิดด้วยที่อยู่จริง (https)
   อย่าเปิดไฟล์ index.html ตรงๆ จากเครื่อง เพราะอีเมลยืนยันและรีเซ็ตรหัสจะกลับมาที่ที่อยู่ไม่ถูกต้อง

6) แก้ข้อมูลจริงของร้านใน js/config.js : accNo (เลขบัญชี), phone, ppId (พร้อมเพย์), ชื่อบัญชี

หมายเหตุ
- ใช้เฉพาะ publishable key ใน js/config.js ห้ามใส่ secret key
- ค่าแบนเนอร์/มาสคอต/โปรโมชัน/ข้อมูลติดต่อ ที่แก้ในหน้าแอดมิน ยังเก็บในเบราว์เซอร์ของเครื่องที่แก้ (ยังไม่ซิงก์ข้ามเครื่อง)
- รูปสินค้า สลิป และรีวิวถูกเก็บเป็นข้อความในฐานข้อมูล ใช้ได้ แต่ถ้าข้อมูลรูปเยอะควรย้ายไปใช้ Supabase Storage

เพิ่มเติม (ซิงก์ตั้งค่าร้านข้ามเครื่อง)
- รัน settings.sql ใน SQL Editor หลังรัน schema.sql (ทำให้แบนเนอร์ มาสคอต โปรโมชัน ข้อมูลติดต่อ ที่แอดมินแก้ ลูกค้าทุกเครื่องเห็น)
- รูปแบนเนอร์เก็บใน Supabase Storage (bucket ชื่อ site)
