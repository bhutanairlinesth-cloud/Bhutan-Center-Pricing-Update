Bhutan Center Unified V13.0.2 — TypeScript Scope Fix

สาเหตุ:
Repository Bhutan Pricing เดิมยังมี src/ ที่ Root และ GitHub Web Upload ไม่ได้ลบไฟล์เก่าอัตโนมัติ
Next.js Type Check จึงอาจหยิบไฟล์เก่า/ไฟล์ที่หลงตำแหน่งมารวมกับ Unified Website

การแก้ไข:
- จำกัด Root tsconfig ให้ตรวจเฉพาะ app/, components/, lib/, middleware.ts, next.config.ts
- แยก admin-app ออกจาก Next.js Type Check อย่างชัดเจน
- ไม่ใช้ ignoreBuildErrors และไม่ได้ปิด TypeScript checking
- Bhutan Pricing ใน admin-app ยัง Build ด้วย Vite ตามเดิม

วิธีลง:
1) แตก ZIP
2) Upload ไฟล์ tsconfig.json และ README_V13_0_2_TH.txt เข้า Root ของ GitHub repo เดิม
3) ให้ tsconfig.json Replace ของเดิม
4) Commit แล้วรอ Vercel Deploy

ยังไม่ต้อง Run SQL เพิ่ม
