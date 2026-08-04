# Bhutan Center Pricing v10

เวอร์ชันนี้สร้างโครงสร้างใหม่ทั้งหมด โดยใช้ข้อมูลและตาราง Supabase เดิม

## โครงสร้างระบบ

- **หน้าคำนวณราคา (Front Office)**: Retail / Agent, โปรแกรมทัวร์, จำนวนผู้เดินทาง, โรงแรม, วันเดินทาง, Business Class และใบเสนอราคา A4
- **หลังบ้าน (Back Office)**: โปรแกรมทัวร์, โรงแรม, ราคาตั๋ว Retail/Agent, ภาษีสนามบิน, USD, วีซ่า, Margin และสิทธิ์ผู้ใช้งาน
- **ภาษาไทย / อังกฤษ**: ปุ่มสลับภาษาเปลี่ยนทั้งหน้าเว็บและเอกสารใบเสนอราคา
- **ฐานข้อมูล**: ใช้ตารางเดิม `profiles`, `app_settings`, `hotels`, `tour_packages`

## อัปโหลด GitHub

1. แตกไฟล์ ZIP
2. เปิด Repository เดิมใน GitHub
3. กด Add file > Upload files
4. ลากไฟล์และโฟลเดอร์ทั้งหมดภายใน ZIP ขึ้นไป
5. ไฟล์ `vercel.json` ในชุดนี้จะเขียนทับไฟล์เก่าที่เคยทำให้ Error
6. Commit ข้อความ `Rebuild Bhutan Pricing v10`
7. รอ Vercel Deploy จาก Commit ใหม่

## Environment Variables บน Vercel

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

โค้ดยังรองรับ `VITE_SUPABASE_ANON_KEY` เป็นชื่อสำรอง

## Supabase

ถ้าระบบเดิมเข้าสู่ระบบและอ่านข้อมูลได้แล้ว **ไม่ต้องรัน SQL ใหม่**

กรณีสร้างโปรเจกต์ Supabase ใหม่ ให้รัน:

```text
supabase/COMPLETE_SETUP.sql
```

## หมายเหตุเรื่องผู้ใช้งาน

การสร้างบัญชี Login ใหม่ต้องทำที่ Supabase > Authentication > Users ก่อน จากนั้น Trigger จะสร้าง Profile ให้โดยอัตโนมัติ หลังบ้านใช้สำหรับเปลี่ยน Role ระหว่าง `admin` และ `sales`

## อัปเดตจาก v10.1 เป็น v10.2

ก่อนใช้งานเมนูแก้ไขส่วนลดกลุ่ม ให้เปิดไฟล์ `supabase/MIGRATE_GROUP_DISCOUNT_SETTINGS.sql` แล้วนำไป Run หนึ่งครั้งที่ Supabase > SQL Editor จากนั้นอัปโหลดโค้ดขึ้น GitHub และรอ Vercel Deploy ใหม่

เมนูแก้ไขอยู่ที่ **หลังบ้าน > ตั้งค่าราคา > ส่วนลดเมื่อเดินทางเป็นกลุ่ม** โดยค่าเริ่มต้นคือเดินทางตั้งแต่ 10 ท่านขึ้นไป ลดราคาตั๋วเครื่องบิน 10% ต่อท่าน

## อัปเดต v12.2 — LAND Invoice USD

หลังรัน Migration เดิมทั้งหมดแล้ว ให้รัน:

```text
supabase/MIGRATE_LAND_INVOICE_USD_V12_2.sql
```

รายละเอียดดูที่ `README_V12_2_LAND_PAYMENT_USD_TH.md`
