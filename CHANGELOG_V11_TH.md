# Changelog v11

- เพิ่ม Workspace “ติดตามลูกค้า” สำหรับ Admin และ Sales
- เพิ่มฟอร์ม Customer / Opportunity Tracking อ้างอิงข้อมูลจาก Excel เดิม
- เพิ่มการคำนวณ Profit = Total − Ticket − Airport Tax − LAND
- เพิ่มการเรียกเก็บเงินงวดแรก: ตั๋วเครื่องบินทั้งหมด + ภาษีสนามบิน
- เพิ่มการเรียกเก็บเงินงวดสอง: ยอดแพ็กเกจคงเหลือ 1 เดือนก่อนเดินทาง
- เพิ่ม Invoice PDF แยกสองงวด
- เพิ่มสถานะ Invoice และสถานะการชำระเงิน
- เพิ่ม Search และ Filter สำหรับติดตามลูกค้า
- เพิ่มตาราง Supabase `customer_tracking` และ `payment_invoices`
- นำ `vercel.json` ออกจากแพ็กเกจ เพื่อลดปัญหา Config ค้างใน Repository
