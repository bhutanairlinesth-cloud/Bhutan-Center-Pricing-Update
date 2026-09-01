# Bhutan Center Unified V13.2 — One Sidebar

Patch นี้จัด Navigation หลังบ้านใหม่ให้เหลือ Sidebar หลักเพียงชุดเดียว

## หมวดเมนูใหม่
- หลัก: ภาพรวม
- การขาย & CRM: คำนวณราคา, ติดตามลูกค้า
- ข้อมูลทัวร์: โปรแกรมทัวร์, โรงแรม, ราคาและค่าบริการ
- การตลาด: ภาพรวมการตลาด, เว็บไซต์, LINE OA, SEO
- รายงาน & ระบบ: รายงานยอดขาย, ข้อมูลระบบ, ผู้ใช้งาน

## สิ่งที่เอาออก
- Sidebar ชั้นที่สองในหน้า `/admin/settings...`
- Sidebar ชั้นที่สองในหน้า `/admin/marketing...`

## Navigation
Browser Back / Forward ยังคงใช้ URL จริง และ Sidebar หลักจะเปลี่ยน Active menu ตาม URL

## วิธีอัป
แตก ZIP แล้วอัปไฟล์ทั้งหมดภายในไปที่ Root ของ GitHub Repository Bhutan Pricing เดิม จากนั้น Commit และรอ Vercel Deploy

ไม่ต้อง Run SQL ใหม่ และไม่กระทบข้อมูล Customer Tracking / Quotation / Invoice / Payment
