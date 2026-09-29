# V13.19 — Agent Rate Sheet English + Save / Print PDF

เพิ่มภาษาอังกฤษให้ใบราคา Agent โดยยังคงภาษาไทยเดิมไว้

## วิธีใช้
1. เข้า Pricing Desk
2. กด “ใบราคา Agent / Agent rate sheet”
3. เลือกโปรแกรมและระดับโรงแรม
4. เลือกภาษาเอกสาร:
   - TH ไทย
   - EN English
5. เมื่อเลือก EN English ตัว Preview ทั้งใบจะเปลี่ยนเป็นภาษาอังกฤษ
6. กด “Save / Print PDF”
   - Print ออกเครื่องพิมพ์ได้
   - หรือเลือก “Save as PDF” เพื่อบันทึกไฟล์

## ภาษาอังกฤษครอบคลุม
- ชื่อโปรแกรม / จำนวนวัน
- ระดับโรงแรม
- ตาราง Economy Ticket + Taxes
- Land + SDF + Visa
- จำนวนผู้เดินทาง 1 / 2 / 3–9 / GIT 10+
- Single Supplement
- Airfare Note
- Standard Hotels
- Rate Includes / Rate Excludes
- Notes
- Valid Until
- Footer / วันที่ออกเอกสาร

## หมายเหตุ
- ข้อมูลราคาและสูตรคำนวณไม่ถูกเปลี่ยน
- ไม่ต้องรัน SQL
- แก้เฉพาะ `admin-app/src/components/FrontOffice.tsx`

## Commit message แนะนำ
`feat: add English Agent Rate Sheet with PDF print support`
