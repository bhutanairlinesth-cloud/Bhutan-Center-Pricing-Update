Bhutan Center Unified V13.1 — Navigation & Sidebar Patch

อัปโหลดไฟล์ทั้งหมดใน ZIP นี้ไปที่ Root ของ GitHub Repository เดิม แล้ว Commit ได้เลย
ไฟล์รวมทั้งหมดต่ำกว่า 100 ไฟล์

สิ่งที่แก้:
1) หลังบ้านใช้เมนูหลักด้านซ้ายตลอดทุกหน้า
2) Pricing Desk มีปุ่ม "กลับ Dashboard" ชัดเจน
3) Customer Tracking เปลี่ยนปุ่มกลับให้กลับ Dashboard จริง ไม่เขียนว่ากลับหน้าคำนวณราคา
4) Website & Marketing เปลี่ยนเมนูย่อยเป็นด้านซ้าย
5) System Settings ฝังอยู่ใน Unified Back Office ไม่เด้งออกไปเป็น layout อีกชุด
6) Browser Back/Forward ใช้ URL ภายใน admin จริง:
   /admin
   /admin/pricing
   /admin/customers
   /admin/marketing
   /admin/marketing/website
   /admin/marketing/line
   /admin/marketing/seo
   /admin/settings
   /admin/settings/data
   /admin/settings/packages
   /admin/settings/hotels
   /admin/settings/pricing
   /admin/settings/users
7) รวม tsconfig scope fix เพื่อไม่ให้ Next.js ไป type-check src/ เก่าของ Bhutan Pricing ที่ Root

ไม่ต้อง Run SQL ใหม่สำหรับ Patch นี้
