# Bhutan Center Unified V13.14.6 — 5-Star Margin + Agent VAT Service Fee

อัปเดตนี้ทำบนโครงสร้าง Unified จริงของโปรเจกต์:

- `/` = Public Website (Next.js)
- `/admin` = Bhutan Pricing / Back Office (Vite SPA จาก `admin-app/`)
- ไม่ใช้ Source เก่าที่ `src/` เป็นระบบ Pricing หลักอีกต่อไป

## 1) Margin โรงแรม 5 ดาว

เมื่อเลือกโรงแรม `5 Stars` ระบบใช้ Margin **10,000 บาท / ท่าน** เป็นค่าเริ่มต้น
และสามารถแก้ตัวเลขได้ใน Back Office > Pricing Settings

ค่านี้ใช้แทน Margin ปกติทั้ง Retail และ Agent เมื่อเลือก 5 Stars

## 2) VAT สำหรับ Agent — คิดเฉพาะค่าบริการในค่าแพ็กเกจ

ค่าบริการต่อท่านตามระยะเวลาแพ็กเกจ:

- 4 Days 3 Nights = 1,500 บาท / ท่าน
- 5 Days 4 Nights = 2,000 บาท / ท่าน
- 6 Days 5 Nights = 2,500 บาท / ท่าน

หลักการ:

- ไม่คิด VAT จากยอด Total ทั้งหมด
- ไม่รวมค่าตั๋วเครื่องบินและภาษีสนามบินในฐาน VAT นี้
- ยอด Package ก่อน VAT เดิมไม่เปลี่ยน แต่แยกใน Invoice เป็น
  - ค่าแพ็กเกจหลังหักค่าบริการ
  - ค่าบริการ × จำนวนผู้เดินทาง
- VAT 7% คิดจาก “ค่าบริการ” เท่านั้น

ตัวอย่าง 5D4N / 4 ท่าน / Package Total 100,000 บาท:

- ค่าบริการ = 2,000 × 4 = 8,000 บาท
- ค่าแพ็กเกจหลังแยกค่าบริการ = 92,000 บาท
- VAT 7% ของ 8,000 = 560 บาท
- ยอดชำระ Package = 100,560 บาท

## 3) SQL ที่ต้อง Run 1 ครั้ง

ใน Supabase SQL Editor ให้ Run:

`supabase/MIGRATE_5STAR_MARGIN_AGENT_VAT_V12_12.sql`

Migration นี้เพิ่มเฉพาะ Settings ใหม่ด้วย `add column if not exists` และไม่ลบข้อมูลเดิม

## 4) การ Deploy

Root ของโปรเจกต์เป็น Next.js และคำสั่ง Build จะ:

1. Build `admin-app` ไปที่ `public/admin`
2. Build Public Website ด้วย Next.js

จากนั้น `/` จะเป็นเว็บไซต์ และ `/admin` จะเป็นหลังบ้านเหมือน Unified V13 เดิม

ไฟล์ `src/` ที่ Root เป็น Legacy Source และถูก exclude จาก Root TypeScript build แล้ว
