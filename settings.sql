-- =====================================================================
--  Phumin Shop : ตั้งค่าร้านที่ใช้ร่วมกันทุกเครื่อง (แบนเนอร์ มาสคอต โปรโมชัน ข้อมูลติดต่อ)
--  วิธีใช้: Supabase > SQL Editor > New query > วางทั้งไฟล์ > Run  (รันซ้ำได้)
--  ต้องรัน schema.sql มาก่อนแล้ว
-- =====================================================================

create table if not exists public.settings (
  key text primary key check (key in ('shop','promo','mascot','banner')),
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.settings enable row level security;
drop policy if exists settings_select on public.settings;
drop policy if exists settings_admin_write on public.settings;
create policy settings_select on public.settings for select using (true);
create policy settings_admin_write on public.settings for all using (public.is_admin()) with check (public.is_admin());

-- ที่เก็บรูปแบนเนอร์ (Storage): ทุกคนดูได้ เฉพาะแอดมินอัปโหลด/ลบได้
insert into storage.buckets (id, name, public) values ('site', 'site', true) on conflict (id) do nothing;
drop policy if exists site_public_read on storage.objects;
drop policy if exists site_admin_write on storage.objects;
create policy site_public_read on storage.objects for select using (bucket_id = 'site');
create policy site_admin_write on storage.objects for all
  using (bucket_id = 'site' and public.is_admin()) with check (bucket_id = 'site' and public.is_admin());
