# วิธีติดตั้ง Bhutan Center Pricing V5

## 1) Supabase
เปิด `supabase/COMPLETE_SETUP.sql` คัดลอกทั้งหมด แล้ววางที่ Supabase > SQL Editor > New query > Run

หลัง Run ให้ตรวจ Table Editor > profiles ต้องเห็น `info@omgexp.com` และ role เป็น `admin`

## 2) Vercel Environment Variables
เพิ่มค่า:

- `VITE_SUPABASE_URL` = Project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` = Publishable key (`sb_publishable_...`)

ไม่ต้องใส่ Secret key และไม่ต้องใช้ service_role

## 3) GitHub
แตก ZIP แล้วลากไฟล์ด้านในทั้งหมดขึ้น Repository (อย่าอัปโหลด ZIP ทั้งก้อน)

## 4) Vercel
Redeploy Deployment ล่าสุด โดย Framework Preset = Vite, Build Command = `npm run build`, Output Directory = `dist`
