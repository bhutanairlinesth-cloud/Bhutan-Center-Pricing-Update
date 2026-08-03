# Bhutan Center Pricing OS v7

เวอร์ชันนี้ปรับโครงสร้างหน้าจอใหม่ทั้งหมด โดยแบ่งราคาขายเป็น 2 ช่องทางชัดเจน:

- Retail / ลูกค้าทั่วไป: ใช้ `margin_thb`
- Agent / Partner: ใช้ `agent_margin_thb` และ `agent_ticket_discount_percent`

ระบบยังใช้ Supabase เดิม ไม่ต้องสร้างฐานข้อมูลใหม่ หากตาราง `app_settings` มีคอลัมน์สองรายการ Agent อยู่แล้ว

## เมนูใหม่
- Overview
- Pricing Desk
- Tour Products
- Hotels
- Flight & Tax
- Exchange
- Visa & Fees
- Price Channels
- Team Access

## Deploy
อัปโหลดไฟล์ทั้งหมดขึ้น GitHub และรอ Vercel deploy อัตโนมัติ โดยใช้ Environment Variables เดิม
