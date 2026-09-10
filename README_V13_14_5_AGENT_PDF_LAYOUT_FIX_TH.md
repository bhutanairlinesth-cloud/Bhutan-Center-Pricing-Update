# V13.14.5 - Agent Rate Sheet PDF Layout Fix

แก้ปัญหา Preview ในระบบสวย แต่ Save as PDF แล้ว layout แตก/ตัด section

สาเหตุหลัก:
- Chrome Print / Save as PDF ใช้ viewport ที่ไปชน responsive rule จอแคบ
- `ราคารวม / ราคาไม่รวม` จึงเปลี่ยนจาก 2 คอลัมน์เป็นเรียงบน-ล่าง
- หน้า A4 เดิมล็อกความสูง ทำให้ section ท้ายหน้าถูกตัด

สิ่งที่แก้:
- บังคับ Agent Rate Sheet ในโหมด Print ให้ใช้ Desktop layout เสมอ
- บังคับ `ราคารวม / ราคาไม่รวม` เป็น 2 คอลัมน์
- กัน Hotel / Airfare Note / Scope / Notes ไม่ให้ถูกตัดกลางหน้า
- ปรับ spacing และ font เฉพาะ PDF ให้ยังอ่านง่ายแต่พอดี 1 A4 ต่อ 1 rate sheet
- ไม่แก้สูตรราคา และไม่แตะข้อมูล Supabase

ไฟล์ที่แก้:
- admin-app/src/index.css

ไม่ต้อง Run SQL
