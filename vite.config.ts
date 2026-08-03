# เชื่อมฐานข้อมูลจริงด้วย Supabase

## สถานะปัจจุบัน
ระบบเวอร์ชันนี้บันทึกข้อมูลใน `localStorage` ของเบราว์เซอร์ จึงมีข้อจำกัด:

- ข้อมูลของแต่ละเครื่องไม่ตรงกัน
- ล้างข้อมูลเบราว์เซอร์แล้วข้อมูลหาย
- ปุ่มเข้าสู่ระบบเป็นโหมดทดลอง ยังไม่มีการตรวจรหัสผ่านจริง
- ไม่เหมาะกับการใช้งานหลายคนหรือข้อมูลราคาจริง

## สิ่งที่ต้องสร้าง
1. สร้าง Supabase Project
2. เปิด Authentication แบบ Email/Password
3. สร้างตารางตาม SQL ด้านล่าง
4. ตั้ง Environment Variables ใน Vercel
5. เปลี่ยน `mockDb` เป็น Supabase data service
6. เปิด Row Level Security และกำหนดสิทธิ์ Admin/Sales

## Environment Variables ที่ต้องใส่ใน Vercel

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

> ห้ามใส่ Service Role Key ในหน้าเว็บหรือ GitHub

## โครงสร้างฐานข้อมูลแนะนำ

```sql
create extension if not exists pgcrypto;

create type public.user_role as enum ('admin', 'sales');
create type public.hotel_category as enum ('3 Stars', '4 Stars', '5 Stars');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role public.user_role not null default 'sales',
  created_at timestamptz not null default now()
);

create table public.global_settings (
  id uuid primary key default gen_random_uuid(),
  exchange_rate_usd numeric(12,4) not null default 35,
  ticket_price_thb numeric(12,2) not null default 26000,
  airport_tax_thb numeric(12,2) not null default 6500,
  visa_fee_usd numeric(12,2) not null default 40,
  margin_thb numeric(12,2) not null default 5000,
  agent_ticket_discount_percent numeric(6,2) not null default 3,
  agent_margin_thb numeric(12,2) not null default 3000,
  updated_at timestamptz not null default now()
);

create table public.hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category public.hotel_category not null,
  pax1_usd numeric(12,2) not null,
  pax2_usd numeric(12,2) not null,
  pax3_plus_usd numeric(12,2) not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tour_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nights integer not null check (nights > 0),
  rates jsonb not null,
  hotel_rates jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  quotation_no text unique,
  created_by uuid references public.profiles(id),
  customer_name text,
  travel_date date,
  passenger_count integer not null,
  hotel_category public.hotel_category,
  request_data jsonb not null,
  result_data jsonb not null,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);
```

## ข้อมูลที่ควรเตรียมสำหรับนำเข้าระบบ

- รายชื่อโรงแรม แยก 3/4/5 ดาว
- ราคาต่อคนสำหรับ 1 คน, 2 คน และ 3 คนขึ้นไป
- รายชื่อโปรแกรมทัวร์ จำนวนวัน/คืน
- ราคาของแต่ละโปรแกรม แยกตามระดับโรงแรม
- ราคาตั๋วเครื่องบินและภาษีสนามบิน
- ค่าวีซ่า อัตราแลกเปลี่ยน กำไรหน้าร้าน และกำไร Agent
- รายชื่อผู้ใช้ พร้อมบทบาท Admin หรือ Sales

แนะนำให้เตรียมเป็นไฟล์ Excel/CSV เพื่อ Import ครั้งแรกได้ง่าย
