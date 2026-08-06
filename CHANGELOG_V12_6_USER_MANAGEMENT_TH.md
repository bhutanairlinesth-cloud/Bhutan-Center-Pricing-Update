# Bhutan Center Pricing v12.6 — เพิ่มผู้ใช้งานระบบ

## สิ่งที่เพิ่ม

- เพิ่มปุ่ม **เพิ่มผู้ใช้งาน** ใน `จัดการหลังบ้าน → ผู้ใช้งานระบบ`
- สร้างบัญชี Supabase Authentication จากหน้าเว็บได้โดยตรง
- กำหนดชื่อ อีเมล รหัสผ่านชั่วคราว และสิทธิ์ `Admin` หรือ `Sales`
- สร้างรหัสผ่านชั่วคราวอัตโนมัติ แสดง/ซ่อน และคัดลอกได้
- หลังสร้างบัญชี ระบบแสดง Email และ Password เพียงครั้งเดียวเพื่อส่งให้พนักงาน
- ผู้ใช้งานใหม่เข้าสู่ระบบได้ทันที ไม่ต้องยืนยันอีเมล
- การลบบัญชีจะลบทั้ง Supabase Authentication และ Profile
- ป้องกันการลบบัญชีตัวเอง และป้องกันการลบ Admin คนสุดท้าย

## ตั้งค่า Vercel ที่จำเป็น

เพิ่ม Environment Variable ฝั่ง Server ใน Vercel:

```text
SUPABASE_SERVICE_ROLE_KEY
```

นำค่าจาก Supabase → Settings → API Keys → Secret key หรือ Legacy service_role key

**ห้าม** ตั้งชื่อเป็น `VITE_SUPABASE_SERVICE_ROLE_KEY` เพราะจะทำให้ Secret ถูกส่งไปยัง Browser

หลัง Save Environment Variable ให้ Redeploy Deployment ล่าสุดหนึ่งครั้ง
