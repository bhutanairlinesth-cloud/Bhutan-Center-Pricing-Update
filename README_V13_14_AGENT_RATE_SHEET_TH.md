# Bhutan Center Unified V13.14 — Agent Rate Sheet

เพิ่มเครื่องมือสร้าง **ใบราคา Agent / Net Agent Rate Sheet** จากข้อมูล Pricing ที่มีอยู่ในระบบ โดยไม่เพิ่มตารางฐานข้อมูลใหม่และไม่เปลี่ยนสูตรคำนวณหลัก

## เข้าใช้งาน
ไปที่ **คำนวณราคา** แล้วกดปุ่ม **ใบราคา Agent** ด้านบน

## ทำอะไรได้
- เลือกหลายโปรแกรมพร้อมกัน เช่น 4D3N + 5D4N
- เลือกหลายระดับโรงแรมพร้อมกัน 3 ดาว / 4 ดาว / 5 ดาว
- ระบบสร้าง 1 หน้า PDF ต่อ 1 โปรแกรม + 1 ระดับโรงแรม
- ใส่ชื่อ Agent / บริษัทได้ (ไม่บังคับ)
- ใส่วันหมดอายุราคาได้
- ใส่ตัวอย่างโรงแรมแต่ละระดับได้
- Export ผ่าน Print / Save as PDF แบบ A4

## ราคาที่ดึงจากระบบ
แต่ละหน้าใช้ Pricing ปัจจุบันของ Bhutan Center:
- Agent airfare
- Airport tax
- Business Class upgrade
- LAND rate ของโปรแกรมและระดับโรงแรม
- SDF / Visa ผ่านสูตร Pricing เดิม
- Agent margin
- Single supplement ของโปรแกรม
- Exchange rate ปัจจุบัน

เอกสารแยกราคาเป็น:
1. Economy Ticket + Taxes
2. Business Class Upgrade (Optional)
3. Land + SDF + Visa
   - 1 ท่าน
   - 2 ท่าน
   - 3–9 ท่าน
   - GIT 10 PAX+ = On Request
4. Single Supplement

## หลักการราคา
`Land + SDF + Visa` ใช้ราคาขาย Net Agent ของระบบลบด้วย airfare + airport tax เพื่อให้ยอดรวมตรงกับราคา Agent ที่หน้าคำนวณใช้อยู่จริง รวม Agent margin และการปัดราคาตามสูตรเดิมแล้ว

กลุ่ม 10+ แสดง `On Request` เพื่อไม่ใช้ราคาทั่วไปไปปนกับ Group/TL หรือเงื่อนไขตั๋วกรุ๊ป

## ความปลอดภัย
- ไม่ Run SQL
- ไม่เพิ่ม/ลบตาราง Supabase
- ไม่แก้สูตร Pricing หลัก
- ไม่แก้ Quotation / Invoice / Customer Tracking เดิม
- เป็นเครื่องมือสร้างเอกสารจากข้อมูลปัจจุบันเท่านั้น

## ไฟล์ใน Patch
- `admin-app/src/components/FrontOffice.tsx`
- `admin-app/src/index.css`
