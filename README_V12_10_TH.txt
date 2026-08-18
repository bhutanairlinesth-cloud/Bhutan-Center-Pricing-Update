Bhutan Center Pricing v12.10 — Quotation Archive & Customer Journey

สิ่งที่เพิ่ม
1) ทุกครั้งที่กดสร้างใบเสนอราคา ระบบจะบันทึก Snapshot ของราคาและข้อมูลลูกค้าใน Supabase อัตโนมัติ
2) หน้า Customer Journey มีปุ่ม "ใบเสนอราคาที่บันทึก"
3) เมื่อลูกค้าคอนเฟิร์ม กด "ลูกค้าคอนเฟิร์ม → เริ่มติดตาม" ระบบจะสร้าง Customer Journey จากราคาเดิมโดยอัตโนมัติ
4) ดึงข้อมูลชื่อ เบอร์ อีเมล ที่อยู่ออกเอกสาร โปรแกรม วันเดินทาง จำนวนคน ราคา Retail/Agent, TL, Business Class, พักเดี่ยว และรายการเพิ่มเติมเข้าไปครบ
5) ใบเสนอราคาเดิมยังคงเป็น Snapshot ไม่เปลี่ยนตามข้อมูลที่แก้ภายหลัง
6) ใบเสนอราคาที่แปลงแล้วจะเชื่อมกลับไปยัง Customer Journey เดิม ไม่สร้างซ้ำ

ต้องรัน SQL 1 ครั้ง
Supabase -> SQL Editor -> New query
เปิดไฟล์ supabase/MIGRATE_QUOTATION_ARCHIVE_V12_10.sql
คัดลอกทั้งหมด -> Run

จากนั้นอัปโหลดไฟล์ทั้งหมดขึ้น GitHub และรอ Vercel Deploy ใหม่
