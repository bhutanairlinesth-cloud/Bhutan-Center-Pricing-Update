# v12.7.5 — แก้ปุ่มเพิ่มลูกค้าใหม่

- แก้ React hook order ใน `TrackingEditor` ที่ทำให้กด “เพิ่มลูกค้าใหม่” แล้วฟอร์มไม่เปิด/หน้าเกิด error หลังเพิ่มระบบ Draft Protection
- ระบบ Draft Protection เดิมยังทำงานครบ: Auto Save, Draft ล่าสุด, เตือนก่อนปิด, กู้ Draft กลับมาได้
- ไม่เปลี่ยนฐานข้อมูล Supabase และไม่ต้องรัน SQL เพิ่ม
