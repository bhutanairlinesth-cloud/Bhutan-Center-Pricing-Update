# Bhutan Center Unified V13.13 — Pricing Source Cleanup

## สาเหตุที่ตรวจพบ
ระบบ Pricing เดิมมีข้อมูลราคาหลายชุดที่หน้าตาคล้ายกัน แต่สูตรคำนวณจริงอ่านเพียง:

1. `app_settings`
   - Flight Retail / Agent
   - Airport Tax
   - USD Exchange Rate
   - Visa Fee
   - Retail / Agent Margin
   - Group discount
   - Business Class surcharge

2. `tour_packages.hotel_rates`
   - LAND Rate 3★ / 4★ / 5★
   - แยก 1 pax / 2 pax / 3+ pax
   - ค่าเป็น USD / คน / คืน

### จุดที่ทำให้สับสน
- ตาราง `hotels` มีหน้าจอแก้ราคา แต่ **ไม่ได้ถูก `calculatePrice()` อ่าน**
- Legacy Hotel Defaults ใน `app_settings` ยังมีอยู่ แต่ **ไม่ได้ถูกสูตรคำนวณปัจจุบันใช้**
- หน้า Program เดิมเก็บ `tour_packages.hotel_rates` แต่ UI เดิมไม่มีช่องให้แก้ LAND Rate เหล่านี้

ดังนั้นการแก้ราคาในหน้า Hotels จึงไม่ทำให้ผลคำนวณเปลี่ยน

## สิ่งที่แก้ใน V13.13

### เมนู
- เพิ่ม `ศูนย์ตั้งราคา`
- เก็บ `โปรแกรมทัวร์`
- เอา `ข้อมูลระบบ` ออกจาก Sidebar
- เอา `โรงแรม` ออกจาก Sidebar Pricing
- เพิ่ม `บริษัท & เอกสาร` สำหรับ Logo / Bank / VAT

> ไม่มีการ DROP/DELETE ตาราง `hotels` หรือข้อมูลเดิม

### ศูนย์ตั้งราคา
หน้า `/admin/settings/pricing` จะแก้ Source of Truth จริงได้จากที่เดียว:
- Flight
- Airport Tax
- Visa
- Exchange Rate
- Margin
- Group Discount
- Business Class surcharge
- LAND Rate ของแต่ละโปรแกรม (3★ / 4★ / 5★ × 1/2/3+ pax)
- Single supplement ของแต่ละโปรแกรม

### โปรแกรมทัวร์
Modal แก้โปรแกรมเพิ่มช่อง LAND Rate ที่สูตรใช้จริง

### Website price
ข้อความใน Website Marketing ถูกแก้ให้ชัดว่า:
- Auto price = คำนวณจาก Pricing จริง
- Website Override = ราคาแสดงเพื่อ Marketing เท่านั้น
- Override ไม่เปลี่ยน Quotation / Invoice / สูตร Pricing

### Safety
- ไม่แก้ `utils/pricing.ts`
- ไม่แก้สูตรคำนวณ
- ไม่แก้ schema Supabase
- ไม่ลบ Hotels table / legacy columns
- Quotation เดิมยังเก็บ pricing snapshot เดิม ไม่เปลี่ยนย้อนหลัง
- การโหลด Hotels เปลี่ยนเป็น optional เพื่อไม่ให้ตารางที่ไม่เกี่ยวกับสูตรทำให้ทั้ง Back Office โหลดล้ม

## ไม่ต้อง Run SQL
Patch นี้เป็น UI / data-flow cleanup เท่านั้น
