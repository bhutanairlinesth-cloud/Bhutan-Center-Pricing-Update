# Bhutan Center Unified V13.3 — Meta Pixel + Funnel & Retargeting

Patch นี้เพิ่มระบบรองรับ Facebook/Meta ก่อนผูกข้อมูลจริง โดยไม่บังคับใช้ Pixel ตอนนี้

## เมนูใหม่
- การตลาด → Funnel & Retargeting
- การตลาด → Facebook Pixel

## ใช้งานได้ทันที
- Funnel 7 / 30 / 90 วัน
- First-party retargeting segment จาก Website + LINE + Customer Tracking
- สถานะ Browser Pixel / CAPI / Test Events
- Event mapping สำหรับ PageView, ViewContent, LineAddFriendClick, Lead

## ยังไม่ส่งข้อมูลให้ Meta จนกว่าจะเชื่อม
หาก `NEXT_PUBLIC_META_PIXEL_ID` ยังว่าง Browser Pixel จะไม่ถูกโหลด

Environment Variables ที่รองรับไว้:
- NEXT_PUBLIC_META_PIXEL_ID
- META_CONVERSIONS_API_TOKEN
- META_TEST_EVENT_CODE

## SQL
รอบ V13.3 นี้ไม่เพิ่มตารางใหม่ จึงไม่ต้อง Run SQL เพิ่ม
