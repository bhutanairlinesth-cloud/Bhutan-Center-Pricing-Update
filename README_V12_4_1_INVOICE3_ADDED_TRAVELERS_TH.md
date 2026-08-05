# วิธีอัปเดต v12.4.1

## 1. อัปเดตฐานข้อมูล Supabase ก่อน

เปิดไฟล์:

`supabase/MIGRATE_INVOICE3_ADDED_TRAVELERS_V12_4_1.sql`

นำ SQL ทั้งหมดไปวางใน Supabase > SQL Editor > New query แล้วกด Run เพียงหนึ่งครั้ง

SQL จะเพิ่ม:

- Invoice ประเภท supplemental สำหรับงวดที่ 3 เป็นต้นไป
- ลำดับ Invoice, รายการย่อย และต้นทุนภายใน
- การเชื่อมประวัติรับชำระเข้ากับ Invoice ที่ระบุ
- ยอด Invoice เพิ่มเติมและยอดขายรวมใน customer_tracking
- traveler_additions สำหรับเก็บผู้เดินทางที่เพิ่มหลังออกตั๋ว

## 2. อัปโหลดโค้ด

แตก ZIP แล้วอัปโหลดไฟล์ทั้งหมดด้านในขึ้น GitHub Repository เดิม จากนั้น Commit เช่น:

`Add Invoice 3 and travellers added after ticketing`

รอ Vercel Deploy จาก Commit ใหม่ และกด Ctrl + F5 หลัง Deploy สำเร็จ

## 3. วิธีใช้งาน

เข้า Customer Journey ของลูกค้า แล้วเลื่อนไปที่:

- `06A ผู้เดินทางเพิ่มหลังออกตั๋ว` สำหรับ PNR และรายชื่อชุดใหม่
- `06B Invoice เพิ่มเติม` สำหรับบริการอื่นที่ลูกค้าขอเพิ่มภายหลัง

ในประวัติรับชำระ เลือกประเภท `Invoice เพิ่มเติม (งวด 3+)` และเลือก Invoice ที่ลูกค้าชำระ ระบบจะติดตามยอดคงเหลือและสลิปแยกเป็นราย Invoice
