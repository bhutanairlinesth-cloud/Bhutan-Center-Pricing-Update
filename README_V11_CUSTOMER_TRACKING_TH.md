# Bhutan Center Pricing v11 — Customer Tracking & Invoice

เวอร์ชันนี้ต่อยอดจาก v10.5 โดยเพิ่มระบบติดตามลูกค้าและออก Invoice เรียกเก็บเงิน 2 งวด

## ฟังก์ชันใหม่

### 1. ฟอร์มติดตามลูกค้า / โอกาสขาย
เก็บข้อมูลที่เคยจัดการใน Excel ได้แก่

- Opportunity Name
- ชื่อลูกค้า บริษัท เบอร์โทร และอีเมล
- Lead Source เช่น LINE OA, LINE, Facebook, Call in
- LAND / Supplier
- Airlines
- วันเริ่มและวันสิ้นสุดการเดินทาง
- Package tours
- Hotel level
- No. Pax
- ราคาต่อท่าน และ Total / Baht
- Ticket Price
- Airport Tax
- Land Payment
- Profit from sales
- Sales owner
- Sales Status
- Payment Status

สามารถกด “ดึงราคาจากระบบคำนวณ” เพื่อกรอกข้อมูลราคา Retail / Agent อัตโนมัติ แล้วปรับยอดจริงภายหลังได้

### 2. แผนเรียกเก็บเงิน 2 งวด

**งวดที่ 1 — มัดจำตั๋วเครื่องบิน + ภาษีสนามบิน**

- ยอด = ราคาตั๋วรวมทั้งหมด + ภาษีสนามบินรวม
- กำหนดวันชำระเองได้
- ออก Invoice และเปลี่ยนสถานะ Pending / Invoiced / Paid / Overdue / Cancelled ได้

**งวดที่ 2 — ค่าแพ็กเกจส่วนที่เหลือ**

- ยอด = ยอดขายรวม − ยอดงวดที่ 1
- ระบบตั้งกำหนดชำระเป็น 1 เดือนก่อนวันเดินทางอัตโนมัติ
- สามารถแก้วันกำหนดชำระได้
- ออก Invoice และติดตามสถานะได้แยกจากงวดแรก

### 3. Invoice PDF

- ออกเอกสารงวดที่ 1 และงวดที่ 2 แยกกัน
- แสดงชื่อลูกค้า โปรแกรม วันเดินทาง จำนวนผู้เดินทาง ยอดชำระ และ Deadline
- กด Print / Save PDF ผ่าน Browser
- เปลี่ยนสถานะ Invoice เป็น Paid ได้จากหน้าพรีวิว

### 4. หน้าติดตามลูกค้า

- ค้นหาจากชื่อ เบอร์โทร อีเมล โปรแกรม และสายการบิน
- กรองสถานะการขาย
- กรองสถานะการเงิน
- แสดงยอดขาย กำไร กำหนดชำระ และสถานะทั้งสองงวดในตารางเดียว
- ระบบแสดง Overdue อัตโนมัติเมื่อเลยวันกำหนดและยังไม่ชำระ

## ขั้นตอนอัปเดต Supabase

ก่อนใช้งานเมนูติดตามลูกค้า ให้รันไฟล์นี้หนึ่งครั้ง:

```text
supabase/MIGRATE_CUSTOMER_TRACKING_AND_INVOICES.sql
```

วิธีรัน:

1. เข้า Supabase
2. เปิด SQL Editor
3. กด New query
4. เปิดไฟล์ SQL แล้วคัดลอกทั้งหมดไปวาง
5. กด Run
6. ตรวจใน Table Editor ว่ามีตาราง `customer_tracking` และ `payment_invoices`

## วิธี Deploy

1. แตก ZIP
2. อัปโหลดไฟล์ทั้งหมดด้านในขึ้น GitHub Repository เดิม
3. ลบ `vercel.json` เก่าจาก GitHub หากยังค้างอยู่
4. Commit เช่น `Add customer tracking and two-stage invoices`
5. รอ Vercel Deploy ใหม่
6. รัน SQL Migration ก่อนเปิดใช้งานเมนูติดตามลูกค้า

## Environment Variables

ใช้ค่าเดิม:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

ไม่ต้องใส่ Secret key หรือ Service Role key ใน Vercel ฝั่งหน้าเว็บ
