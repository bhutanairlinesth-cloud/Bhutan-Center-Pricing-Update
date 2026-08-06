# วิธีเปิดใช้งานปุ่มเพิ่มผู้ใช้งาน

## 1) อัปโหลดโค้ดขึ้น GitHub

อัปโหลดไฟล์ทั้งหมดใน ZIP ขึ้น Repository เดิม แล้วรอ Vercel Deploy

## 2) เพิ่ม Secret Key ใน Vercel

1. เปิด Supabase Project
2. ไปที่ `Settings → API Keys`
3. ในหัวข้อ `Secret keys` กด Copy ค่า `sb_secret_...`
4. เปิด Vercel Project
5. ไปที่ `Settings → Environment Variables`
6. เพิ่มชื่อ:

```text
SUPABASE_SERVICE_ROLE_KEY
```

7. วาง Secret Key ในช่อง Value
8. เลือก Production, Preview และ Development
9. กด Save
10. ไปที่ Deployments แล้ว Redeploy โดยไม่ใช้ Build Cache

> Secret Key ใช้เฉพาะ API ฝั่ง Server ที่ `/api/admin-users` และจะไม่ถูกส่งไปยังหน้าเว็บ

## 3) เพิ่มบัญชี

เข้าเว็บไซต์ด้วย Admin แล้วไปที่:

```text
จัดการหลังบ้าน → ผู้ใช้งานระบบ → เพิ่มผู้ใช้งาน
```

กรอกชื่อ Email สิทธิ์ และรหัสผ่านชั่วคราว จากนั้นกดสร้างบัญชี
