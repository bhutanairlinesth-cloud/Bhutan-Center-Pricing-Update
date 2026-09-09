# V13.13.1 — Agent + Group Airfare Discount Fix

แก้สูตรตั๋วเครื่องบินสำหรับผู้เดินทางตั้งแต่จำนวนขั้นต่ำของกรุ๊ป (ค่าเดิม 10 คน) ให้ใช้กับทุก Pricing Mode รวม `15+1 TL / group_tl`

## Logic ที่ใช้
- Retail ปกติ: 26,000
- Agent ปกติ: 25,220 (ลด 3% จาก Retail)
- 10 คนขึ้นไป Retail: 26,000 × 90% = 23,400
- 10 คนขึ้นไป Agent: 25,220 × 90% = 22,698

ลำดับส่วนลด Agent คือ **Agent fare ก่อน แล้วจึงลด Group Discount เพิ่ม**

## สิ่งที่แก้
- `admin-app/src/utils/pricing.ts`
  - Group discount ไม่ถูกจำกัดไว้เฉพาะ standard mode อีกต่อไป
  - โหมด group_tl รายงาน `hasGroupFlightDiscount` และเปอร์เซ็นต์จริง
- `admin-app/src/components/FrontOffice.tsx`
  - ช่องตั๋วใน 15+1 TL แสดงค่า default ที่ลดกรุ๊ปแล้ว
  - Dropdown จำนวนผู้เดินทางแสดงป้าย `ลด 10%` ในโหมด TL ด้วย
  - แสดงที่มาของราคาตั๋ว เช่น `Agent ฿25,220 → ลดกรุ๊ป 10% = ฿22,698`

## ความปลอดภัย
- ไม่แก้ Supabase schema
- ไม่แก้ LAND / Visa / Tax / Margin / TL formula
- ไม่แก้ Quotation/Invoice snapshot structure
- ถ้ามีการกรอก `groupTicketPriceOverrideTHB` เอง ระบบยังเคารพราคาที่กรอกเองเหมือนเดิม
- ไม่ต้อง Run SQL
