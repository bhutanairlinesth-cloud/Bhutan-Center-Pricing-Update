# Bhutan Center Unified V13

ชุดนี้รวม **Bhutan Center Website + Bhutan Pricing v12.11.4** เป็น Repository / Vercel Project เดียว
โดยใช้ Bhutan Pricing เดิมเป็นระบบปฏิบัติการหลักและไม่ลบข้อมูล Production เดิม

## URL หลังรวม

- `/` เว็บไซต์ Bhutan Center สาธารณะ (Next.js / SEO)
- `/admin` ระบบหลังบ้าน Bhutan Pricing เดิม + Unified Dashboard
- Pricing Desk, Customer Tracking, Quotation, Invoice และ Admin เดิมยังอยู่
- Website & Marketing อยู่ใน Dashboard หลัง Login

## สิ่งที่รวมแล้ว

1. Website V8.7 / SEO-safe Wix legacy URLs
2. Bhutan Pricing v12.11.4 ทั้งระบบ
3. Customer Tracking / Quotation / Invoice / Payment เดิม
4. ราคาแพ็กเกจหน้าเว็บอ่านจาก Tour Packages + App Settings เดิม
5. Website Price Override จากหลังบ้าน (หลังรัน SQL V13)
6. Website Analytics / Funnel foundation
7. LINE OA click tracking
8. LINE Follow / Message Webhook foundation
9. LINE Broadcast จากหลังบ้าน (เมื่อใส่ Messaging API credentials)
10. Meta Pixel hook (`NEXT_PUBLIC_META_PIXEL_ID`)

## สำคัญ: การอัป GitHub

ใช้ Repository **Bhutan Pricing เดิม** ไม่ต้องสร้าง Repository ใหม่

1. สำรอง Repository / Supabase ก่อน
2. แตก ZIP Unified V13
3. ใน GitHub Repository ของ Bhutan Pricing: Add file > Upload files
4. อัปไฟล์ทั้งหมดจากด้านใน ZIP ให้ `package.json`, `app`, `admin-app`, `api`, `supabase` อยู่ที่ root
5. **ไม่จำเป็นต้องลบโฟลเดอร์ `src` เดิมก่อน** — Unified `tsconfig.json` กัน Source เดิมออกจาก Next build และระบบ Pricing ตัวที่ใช้งานจริงถูกเก็บไว้ใน `admin-app/` แล้ว
6. Commit
7. รอ Vercel Deploy

> Root framework เปลี่ยนเป็น Next.js เพื่อรักษา SEO ของ Public Website
> ส่วน Bhutan Pricing เดิมถูก build เป็น Admin SPA ที่ `/admin`

## Supabase

**ระบบ Pricing เดิมเปิดได้โดยไม่ต้องรัน SQL ใหม่** เพราะตารางเดิมถูกใช้เหมือนเดิม

เมื่อต้องการเปิด Website Analytics / LINE / Public Price Override ให้รัน:

`supabase/UNIFIED_V13_WEBSITE_LINE_MARKETING.sql`

SQL นี้สร้างตารางใหม่เท่านั้น และไม่ลบ/แก้ข้อมูล Customer Tracking, Invoice, Quotation หรือ Tour Package เดิม

## Vercel Environment Variables

ค่าเดิมของ Pricing ต้องอยู่ครบ:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` หรือ `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL` (ถ้ามีอยู่แล้วใช้ค่าเดิม)
- `SUPABASE_SERVICE_ROLE_KEY`

LINE เพิ่มภายหลัง:

- `LINE_OA_BASIC_ID`
- `LINE_OA_URL` (optional fallback)
- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Meta Pixel:

- `NEXT_PUBLIC_META_PIXEL_ID`

## LINE Webhook URL

หลัง Domain จริงย้ายมา Vercel ให้ตั้ง LINE Developers Webhook URL เป็น:

`https://www.bhutancenter.org/api/line/webhook`

ก่อนย้าย Domain สามารถใช้ Vercel URL สำหรับทดสอบได้

## เรื่อง Domain / Wix

อย่าเพิ่งชี้ `bhutancenter.org` ออกจาก Wix จนกว่าจะตรวจ:

- Public Website ทุกหน้า
- Legacy Wix URLs
- Sitemap / robots
- Search Console
- `/admin` Login + Pricing + Customer Tracking + Invoice
- Mobile

เมื่อทุกอย่างผ่านจึงค่อยทำ Domain migration
