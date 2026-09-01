# Bhutan Center Unified V13.5.1 — Realtime Visitor Fix

แก้กรณี `ONLINE NOW = 0` ทั้งที่เปิดหน้า Public Website อยู่

## สาเหตุที่แก้
V13.5 เดิมใช้ Server API เขียน `website_events` และเงียบเมื่อ Vercel ไม่มี `SUPABASE_SERVICE_ROLE_KEY` หรือยังไม่ได้รัน migration V13 ที่สร้าง `website_events` จึงเห็น 0 โดยไม่มีคำเตือน

V13.5.1:
- รองรับ Service Role เหมือนเดิม
- ถ้ายังไม่มี Service Role สามารถ fallback ไปใช้ VITE Supabase anon/publishable key + RLS ได้
- หลังบ้านแสดงสถานะว่า Tracking พร้อมหรือยัง และบอก error code ถ้าตาราง/RLS ยังไม่พร้อม
- `/admin` ไม่ถูกนับเป็น Website Visitor; ต้องเปิดหน้า Public เช่น `/`, `/packages`, `/package?...`

## หลัง Upload GitHub ต้อง Run SQL 1 ไฟล์
Supabase > SQL Editor > New Query > วางไฟล์:

`supabase/UNIFIED_V13_5_1_REALTIME_REPAIR.sql`

แล้ว Run

SQL นี้เป็น additive และไม่แตะ Pricing, Customer Tracking, Quotation, Invoice หรือ Payment

## วิธีทดสอบ
1. Deploy V13.5.1 ให้ Ready
2. Run SQL V13.5.1
3. เปิด Public Website ในอีก tab/มือถือ เช่น `/packages`
4. เปิด Admin > การตลาด > ผู้เข้าชมเรียลไทม์
5. ภายในประมาณ 15 วินาทีควรเห็น ONLINE NOW >= 1
6. Heartbeat ส่งทุก 30 วินาที และ session ถือว่า online ในหน้าต่าง 90 วินาที

ถ้าเปิดเฉพาะ `/admin/marketing/realtime` ระบบจะแสดง 0 ได้ตามปกติ เพราะ Admin traffic ถูก exclude โดยตั้งใจ
