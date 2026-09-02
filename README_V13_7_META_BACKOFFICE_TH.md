# Bhutan Center Unified V13.7 — Meta Pixel Settings in Back Office

รอบนี้เพิ่มการตั้งค่า Meta/Facebook จากหลังบ้านโดยตรง และตั้งค่า LINE OA URL ของ Bhutan Center เป็น `https://lin.ee/qQQMmYIt`

## หลังอัป GitHub ต้องรัน SQL 1 ไฟล์

`supabase/UNIFIED_V13_7_MARKETING_INTEGRATIONS.sql`

SQL นี้เพิ่มตาราง `marketing_runtime_settings` เท่านั้น ไม่แตะ Pricing, Customer Tracking, Quotation, Invoice หรือ Payment เดิม

## เมนู Facebook Pixel

ไปที่:

`Admin → การตลาด → Facebook Pixel`

Administrator สามารถกรอก:

- Facebook Pixel ID
- Test Event Code
- เปิด/ปิด Meta Pixel บนเว็บไซต์

แล้วกด **บันทึก Meta Pixel** ได้ทันที ไม่ต้องแก้ Vercel / Redeploy ทุกครั้ง

> Pixel ID และ Test Event Code เป็น runtime settings ที่ไม่ใช่ secret token
> `META_CONVERSIONS_API_TOKEN` ยังเก็บฝั่ง Server/Vercel เท่านั้น เพื่อไม่ให้ token รั่วออก Browser

## ลำดับค่าที่ใช้

- ถ้ามีค่า Meta Pixel ที่บันทึกใน Back Office → ใช้ค่านั้น
- ถ้ายังไม่มี → fallback ไปที่ `NEXT_PUBLIC_META_PIXEL_ID` / `META_PIXEL_ID` เดิม
- ถ้า Back Office ปิด Pixel → Public Website จะไม่โหลด Pixel

## LINE OA

ตั้ง Default/Fallback เป็น:

`https://lin.ee/qQQMmYIt`

และ Administrator สามารถแก้ LINE OA URL จาก:

`Admin → การตลาด → LINE OA`

## หมายเหตุ Test Event Code

Test Event Code จะถูกเก็บไว้รอใช้กับ Conversions API / Server Events ในขั้นเชื่อม CAPI เต็มรูปแบบ Browser Pixel ปกติไม่จำเป็นต้องใช้ Test Event Code
