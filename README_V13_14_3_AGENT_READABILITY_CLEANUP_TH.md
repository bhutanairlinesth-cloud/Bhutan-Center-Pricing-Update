# V13.14.3 Agent Rate Sheet Readability Cleanup

แพตช์นี้ปรับใบราคา Agent ให้อ่านง่ายขึ้นและพร้อมส่งลูกค้า

สิ่งที่แก้:
- ตัดกล่องสรุป 3 ช่องใต้ตารางราคาออก
- เพิ่มหมายเหตุเรื่องราคา Agent airfare + Airport Tax แบบอ่านง่าย
- ขยายตัวอักษรทั้งหน้าเอกสาร Agent Rate Sheet
- เพิ่มระยะห่างในตารางและ section ต่าง ๆ
- คงข้อมูลโรงแรมมาตรฐาน 3 ดาว / 4 ดาว ตามที่อัปเดตล่าสุด

ไฟล์ที่แก้:
- admin-app/src/components/FrontOffice.tsx
- admin-app/src/index.css
