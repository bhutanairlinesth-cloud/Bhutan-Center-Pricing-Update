Bhutan Center Pricing v12.11.3 — Schema Repair / Invoice Stability

ปัญหาที่แก้:
- Could not find child_airport_tax_per_person in customer_tracking schema cache
- Invoice foreign-key error เมื่อ Customer Journey บันทึกไม่สำเร็จ
- ตรวจ parent Customer Journey ก่อนบันทึก Invoice
- เพิ่มข้อความ Error ที่บอกชัดว่า Supabase schema ยังไม่ตรง

สำคัญ: ก่อนทดสอบ Invoice ให้รันไฟล์นี้ 1 ครั้ง
supabase/REPAIR_SCHEMA_V12_11_3_RUN_THIS.sql

วิธีรัน:
Supabase > SQL Editor > New query > วาง SQL ทั้งไฟล์ > Run
ต้องเห็นบรรทัดสุดท้าย:
OK - Bhutan Center Pricing schema v12.11.3 is ready

จากนั้นรอประมาณ 5-10 วินาที แล้ว Refresh เว็บไซต์ด้วย Ctrl+F5
