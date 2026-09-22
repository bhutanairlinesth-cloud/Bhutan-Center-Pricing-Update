HOTFIX — Agent VAT 3 รูปแบบ + Invoice 3

ไฟล์นี้ทำจากโครงสร้าง Unified ล่าสุดที่ใช้ admin-app จริง

อัปไฟล์ทั้งหมดใน ZIP ไปทับตำแหน่งเดิมใน GitHub:
- admin-app/src/components/CustomerTracking.tsx
- admin-app/src/components/Admin.tsx
- admin-app/src/types.ts
- admin-app/src/index.css

จากนั้นรัน SQL หนึ่งครั้งใน Supabase SQL Editor:
- supabase/MIGRATE_AGENT_VAT_MODE_INVOICE3_V13_14_7.sql

หลัง Deploy ถ้า Channel = Agent / Partner และเปิด Invoice 2 หรือ Full Payment
หัวข้อด้านบนต้องเปลี่ยนจาก “ใบกำกับภาษี” แบบปุ่ม On/Off เป็น “รูปแบบ VAT” แบบ dropdown 3 ตัวเลือก:
1) ไม่คิด VAT
2) VAT 7% · ค่าแพ็กเกจทั้งหมด (Standard)
3) VAT 7% · ค่าบริการ (แยก Invoice 3)

หากยังเห็น “ใบกำกับภาษี / ไม่บวก VAT” แบบเดิม แสดงว่า Vercel ยัง Build จาก CustomerTracking.tsx รุ่นเก่า หรือ GitHub ยังไม่ได้แทนที่ไฟล์นี้
