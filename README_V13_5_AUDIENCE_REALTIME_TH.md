# Bhutan Center Unified V13.5 — Audience + Retargeting Tags + Realtime Visitors

เพิ่ม Marketing Foundation 3 ส่วน โดยยังไม่ต้องเชื่อม Meta/Facebook ตอนนี้:

1. **Realtime Website Visitors** — หน้า `/admin/marketing/realtime`
   - Public website ส่ง heartbeat ทุก 30 วินาที
   - Back Office refresh ทุก 15 วินาที
   - แสดงจำนวน Online Now, หน้าที่กำลังดู, Package, Source, Device และ Last seen
   - ใช้ anonymous visitor/session id ไม่ต้องรู้ชื่อคน

2. **Audience & Tags** — หน้า `/admin/marketing/audience`
   - Website Visitors / Returning Visitors / Package Interest / High Intent
   - LINE Friends / LINE Engaged / Website ↔ LINE Matched
   - CRM groups เช่น Tracking ยังไม่ Quote, Quote ยังไม่ Confirm, Paid Exclusion
   - LINE userId ใช้แบ่งกลุ่มภายใน CRM ได้ แต่ไม่ใช้เป็น Meta identifier โดยตรง

3. **Retargeting Tags**
   - Website Visitor
   - Package Interest
   - Package:<slug>
   - LINE Intent
   - Website Lead
   - LINE Friend
   - LINE Engaged
   - Website ↔ LINE Matched

## SQL

Realtime Online Now ใช้งานกับ `website_events` เดิมได้ทันทีหลัง Deploy.

เพื่อให้ Retargeting Tags เก็บถาวรและเตรียม Saved Audience ให้รัน:

`supabase/UNIFIED_V13_5_AUDIENCE_REALTIME.sql`

SQL เป็น additive เท่านั้น ไม่ลบ/แก้ Customer Tracking, Quotation, Invoice, Payment หรือ Pricing เดิม.

## Meta ในอนาคต

Website Retargeting จะเชื่อมผ่าน Meta Pixel / CAPI. Audience จาก LINE ใช้สำหรับ segmentation ภายใน Bhutan CRM ก่อน; หากต้อง Match Customer List ไป Meta ในอนาคตให้ใช้ข้อมูลติดต่อที่มีสิทธิ์ใช้งาน เช่น email/phone ตามเงื่อนไขของแพลตฟอร์ม ไม่ส่ง LINE userId ไป Meta โดยตรง.
