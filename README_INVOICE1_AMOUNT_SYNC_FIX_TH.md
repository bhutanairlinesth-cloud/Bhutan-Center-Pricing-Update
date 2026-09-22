# HOTFIX — Invoice 1 ยอดค่าตั๋วไม่ตรงกับหน้า Customer Journey

## สาเหตุ
ในระบบ Standard Pricing ยอดงวดที่ 1 ถูกคำนวณเป็น **ค่าตั๋วพื้นฐาน + ภาษีสนามบิน** โดยส่วนเพิ่ม Business Class ถูกเก็บอยู่ในค่าแพ็กเกจ/งวดที่ 2

แต่โค้ดสร้างเอกสาร Invoice 1 เดิมนำ **Business Class surcharge** ไปบวกในตารางค่าตั๋วอีกครั้ง ทำให้ยอดใน Invoice 1 สูงกว่ายอดงวดที่ 1 ที่แสดงใน Customer Journey

## สิ่งที่แก้
- Standard Pricing: Invoice 1 = ค่าตั๋วพื้นฐาน + ภาษีสนามบิน เท่านั้น
- Business Class surcharge ยังคงอยู่ในยอดแพ็กเกจ/Invoice 2 ตามกติกาเดิม
- Group/TL Pricing: ไม่เปลี่ยนพฤติกรรม เพราะสูตรงวดที่ 1 ของโหมดนี้รวม Business surcharge อยู่แล้ว

## หลัง Deploy
ถ้า Invoice 1 รายการเดิมเคยถูกออกก่อนติดตั้ง Hotfix:
1. เปิด Customer Journey รายการนั้น
2. กด `เปิด / ออก Invoice 1` อีกครั้ง
3. ระบบจะอัปเดต Invoice 1 เดิมด้วยยอดและ Snapshot ที่ถูกต้อง โดยไม่สร้างเลข Invoice ใหม่

ไม่ต้องรัน SQL
