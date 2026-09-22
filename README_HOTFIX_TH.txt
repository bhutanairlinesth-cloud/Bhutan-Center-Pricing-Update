BHUTAN CENTER PRICING — VERCEL/VITE HOTFIX
=============================================

ปัญหาที่แก้
1) middleware.ts เดิม import จาก next/server แต่โปรเจกต์นี้ build ด้วย Vite และไม่มี Next.js
   จึงเกิด:
   - Cannot find module 'next/server'
   - Edge Function middleware referencing unsupported modules

2) tsconfig.json เดิมกำหนด types เฉพาะ vite/client
   แม้ package.json มี @types/node แล้ว แต่ TypeScript จึงไม่รู้จัก process.env ใน Vercel API
   จึงเกิด:
   - Cannot find name 'process'

วิธีใช้
1) แทนที่ไฟล์ middleware.ts ที่ root ของ repo ด้วย middleware.ts ในโฟลเดอร์นี้
2) แทนที่ tsconfig.json ที่ root ของ repo ด้วย tsconfig.json ในโฟลเดอร์นี้
3) Commit + Push เข้า branch main
4) Redeploy บน Vercel

สูตรราคาที่ต้องการ
- โรงแรม 5 ดาว: Margin = 10,000 บาท / ท่าน
- Agent VAT ใช้เฉพาะส่วนค่าแพ็กเกจ ไม่รวมตั๋วและภาษีสนามบิน
- ค่าบริการ:
  * 4 วัน 3 คืน = 1,500 บาท / ท่าน
  * 5 วัน 4 คืน = 2,000 บาท / ท่าน
  * 6 วัน 5 คืน = 2,500 บาท / ท่าน

หลักการคำนวณ Agent Package
Package Total ก่อน VAT = P
จำนวนผู้เดินทาง = N
ค่าบริการต่อคน = F

Service Fee = N x F
Package (ส่วนที่เหลือ) = P - Service Fee
VAT = Service Fee x 7%
ยอดชำระ Package = Package (ส่วนที่เหลือ) + Service Fee + VAT
                   = P + VAT

ตัวอย่าง 5D4N / 4 คน / Package Total 100,000
Service Fee = 2,000 x 4 = 8,000
ค่าแพ็กเกจ = 100,000 - 8,000 = 92,000
VAT 7% = 560
ยอดชำระ = 100,560

หมายเหตุ
- อย่านำ airfare / airport tax มารวมฐาน VAT นี้
- ถ้าเพิ่งเพิ่มฟังก์ชัน v12.12 ให้รัน migration:
  supabase/MIGRATE_5STAR_MARGIN_AGENT_VAT_V12_12.sql
  ใน Supabase SQL Editor ก่อนใช้งานจริง
