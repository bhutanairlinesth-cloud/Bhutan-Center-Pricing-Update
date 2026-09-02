# Bhutan Center Unified V13.8 — Fast Realtime Visitors

ปรับ ONLINE NOW ให้ตอบสนองเร็วขึ้นสำหรับ Bhutan Center

## สิ่งที่เปลี่ยน
- เปิดหน้า Public → ส่ง Online signal ทันที
- Heartbeat ทุก 6 วินาที
- ปิดหน้า / ปิดแท็บ → ส่ง Offline signal ด้วย `sendBeacon`
- หน้า Realtime หลังบ้านใช้ API เฉพาะ Live sessions และ refresh ทุก 2 วินาที
- ถ้า Offline signal หลุด ระบบจะตัด session อัตโนมัติภายในประมาณ 18 วินาที
- หน้า Overview refresh ONLINE NOW ทุก 5 วินาที
- การสลับไปดูแท็บ Admin จะไม่ทำให้ Public tab ถูกนับ Offline ทันที เพราะยังถือว่าเปิดเว็บไซต์อยู่

## ไม่ต้อง Run SQL ใหม่
ใช้ `website_events` เดิม และเก็บสถานะ Online/Offline ใน metadata ของ heartbeat เดิม จึงใช้ RLS policy V13.5.1 เดิมได้

## วิธีทดสอบ
1. เปิด `/admin/marketing/realtime` ในเครื่องหนึ่ง
2. เปิดหน้า Public `/` หรือ `/packages` อีกเครื่อง/อีก browser
3. ONLINE NOW ควรขึ้นภายใน 0–2 วินาที
4. ปิดหน้า Public → ONLINE NOW ควรลดภายในประมาณ 0–2 วินาที หาก browser ส่ง close beacon สำเร็จ
5. กรณี browser/network ไม่ส่ง close beacon ระบบ fallback จะลบ session ภายในประมาณ 18 วินาที

> `/admin` ไม่ถูกนับเป็น Website Visitor
