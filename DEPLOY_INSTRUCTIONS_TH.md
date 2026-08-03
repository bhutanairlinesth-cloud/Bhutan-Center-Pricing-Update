# วิธีติดตั้งเวอร์ชันนี้

## 1) GitHub
แตก ZIP แล้วอัปโหลดไฟล์ทั้งหมดด้านในขึ้น Repository เดิม จากนั้น Commit ไปที่ `main`.

## 2) Supabase — ต้องทำครั้งเดียว
เปิด Supabase > SQL Editor > New query แล้วเปิดไฟล์:

`supabase/production_setup.sql`

คัดลอกทั้งหมดไปวางและกด Run

ไฟล์นี้จะ:
- สร้าง/แก้ Profile ของผู้ใช้ที่มีอยู่แล้ว
- ตั้ง `info@omgexp.com` เป็น `admin`
- สร้าง Trigger ให้ผู้ใช้ใหม่มี Profile อัตโนมัติ
- ตั้ง Row Level Security สำหรับ Admin และ Sales

## 3) Vercel Environment Variables
ตั้งค่าให้ครบ:

- `VITE_SUPABASE_URL` = `https://zyblgonnhymwlwqtojeu.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY` = Publishable key จาก Supabase

โค้ดรองรับ `VITE_SUPABASE_ANON_KEY` เป็นชื่อสำรอง แต่แนะนำใช้ `VITE_SUPABASE_PUBLISHABLE_KEY`.

หลังเพิ่มค่าแล้วให้ Redeploy เวอร์ชันล่าสุด.

## 4) Login
ใช้บัญชีที่สร้างไว้ใน Supabase Authentication.

สำคัญ: ไม่ควรใส่ Secret key หรือ service_role key ใน Vercel ฝั่ง Frontend.
