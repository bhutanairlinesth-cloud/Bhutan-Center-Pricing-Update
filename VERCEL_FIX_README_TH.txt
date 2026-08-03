เวอร์ชัน 5.1 แก้ปัญหา npm ETARGET

สาเหตุเดิม:
@supabase/supabase-js 2.110.3 อ้างอิง dependency รุ่นที่ npm หาไม่พบในช่วง deploy

การแก้ไข:
- ล็อก @supabase/supabase-js เป็น 2.78.0 ซึ่งเป็นรุ่นเสถียรและรองรับ API ที่โปรเจกต์ใช้อยู่
- ล็อกเวอร์ชัน dependency อื่นทั้งหมดแบบ exact เพื่อลดปัญหาเวอร์ชันเปลี่ยนเอง
- ไม่รวม node_modules และไม่มี package-lock เก่าที่เสีย

หลังอัปโหลด GitHub:
1) Commit ไฟล์ทั้งหมดแทนเวอร์ชันเดิม
2) Vercel > Deployments > Redeploy
3) เอาเครื่องหมาย Use existing Build Cache ออก
4) ตรวจ Environment Variables:
   VITE_SUPABASE_URL
   VITE_SUPABASE_PUBLISHABLE_KEY
