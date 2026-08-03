import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'th' | 'en';

const pairs: Array<[string, string]> = [
  ['ภาพรวมระบบ','System overview'], ['ภาพรวมราคา','Pricing overview'], ['คำนวณราคา','Price calculator'],
  ['โปรแกรมทัวร์','Tour packages'], ['โรงแรมและห้องพัก','Hotels and rooms'], ['ตั๋วและภาษี','Flights and taxes'],
  ['อัตราแลกเปลี่ยน','Exchange rate'], ['วีซ่าและค่าธรรมเนียม','Visa and fees'], ['ผู้ใช้งานระบบ','System users'],
  ['บริหารราคา Agent และราคาลูกค้าทั่วไป','Manage Agent and retail pricing'],
  ['จากข้อมูลกลางชุดเดียว','from one central data source'],
  ['ปรับต้นทุนครั้งเดียว ระบบจะนำไปคำนวณราคาขายทั้งสองช่องทางโดยอัตโนมัติ พร้อมรักษาส่วนต่างกำไรตามนโยบายบริษัท','Update costs once and automatically calculate both sales channels while preserving company margin policy.'],
  ['เปิด Pricing Desk','Open Pricing Desk'], ['ตั้งค่าช่องทางราคา','Configure price channels'],
  ['ลูกค้าทั่วไป','Retail customer'], ['อัตราแลกเปลี่ยนปัจจุบัน','Current exchange rate'],
  ['โปรแกรมพร้อมเสนอขาย','Packages ready to sell'], ['รายการโรงแรมในระบบ','Hotels in the system'],
  ['บัญชีที่เข้าถึงระบบ','Accounts with system access'], ['โครงสร้างราคาสองช่องทาง','Dual-channel price structure'],
  ['จัดการ','Manage'], ['ตั๋ว + ภาษี + ทัวร์ + วีซ่า','Flight + tax + tour + visa'],
  ['Retail หรือ Agent','Retail or Agent'], ['ปัดขึ้นทุก 500 บาท','Round up to the nearest THB 500'],
  ['จัดการข้อมูลกลาง','Manage central data'], ['ออกจากระบบเรียบร้อยแล้ว','Signed out successfully'],
  ['โหลดข้อมูลไม่สำเร็จ','Unable to load data'], ['บันทึกไม่สำเร็จ','Unable to save'],
  ['บันทึกการตั้งค่าเรียบร้อยแล้ว','Settings saved successfully'], ['เพิ่มโรงแรมเรียบร้อยแล้ว','Hotel added successfully'],
  ['อัปเดตโรงแรมเรียบร้อยแล้ว','Hotel updated successfully'], ['ลบโรงแรมเรียบร้อยแล้ว','Hotel deleted successfully'],
  ['เพิ่มโปรแกรมทัวร์เรียบร้อยแล้ว','Tour package added successfully'], ['อัปเดตโปรแกรมทัวร์เรียบร้อยแล้ว','Tour package updated successfully'],
  ['ลบโปรแกรมทัวร์เรียบร้อยแล้ว','Tour package deleted successfully'], ['เพิ่มข้อมูลผู้ใช้งานเรียบร้อยแล้ว','User added successfully'],
  ['อัปเดตผู้ใช้งานเรียบร้อยแล้ว','User updated successfully'], ['ลบข้อมูลผู้ใช้งานเรียบร้อยแล้ว','User deleted successfully'],
  ['เพื่อความปลอดภัย การรีเซ็ตฐานข้อมูล Supabase ต้องทำผ่าน SQL Editor','For safety, reset the Supabase database through SQL Editor.'],
  ['โหมด Local: กรุณาล้าง Site Data เพื่อรีเซ็ตข้อมูล','Local mode: clear Site Data to reset information.'],
  ['ศูนย์กลางบริหาร','Central management for'], ['ราคาทัวร์ภูฏาน','Bhutan tour pricing'],
  ['รวมข้อมูลราคา ต้นทุน และกำไรไว้ในระบบเดียว เพื่อให้ทุกทีมทำงานได้เร็ว แม่นยำ และเป็นมาตรฐานเดียวกัน','Centralize pricing, costs and margins so every team works faster, more accurately and to one standard.'],
  ['ข้อมูลราคาแบบเรียลไทม์','Real-time pricing data'], ['กำหนดสิทธิ์ตามบทบาท','Role-based access'], ['สำรองข้อมูลบนคลาวด์','Cloud data backup'],
  ['ยินดีต้อนรับกลับ','Welcome back'], ['เข้าสู่ระบบเพื่อจัดการข้อมูลราคาและใบเสนอราคา','Sign in to manage pricing data and quotations.'],
  ['กรุณากรอกอีเมลและรหัสผ่าน','Please enter your email and password.'], ['ไม่พบบัญชีนี้ในโหมดทดสอบ','Account not found in test mode.'],
  ['อีเมลหรือรหัสผ่านไม่ถูกต้อง','Incorrect email or password.'], ['เข้าสู่ระบบไม่สำเร็จ','Unable to sign in.'],
  ['อีเมล','Email'], ['รหัสผ่าน','Password'], ['กรอกรหัสผ่าน','Enter password'], ['กำลังเข้าสู่ระบบ...','Signing in...'], ['เข้าสู่ระบบ','Sign in'],
  ['ระบบออนไลน์','Online system'], ['โหมดภายในเครื่อง','Local mode'], ['ข้อมูลได้รับการปกป้อง','Data protected'],
  ['กรุณากรอกราคาตั๋วให้ถูกต้อง โดยราคา Agent ต้องไม่สูงกว่าราคาปกติ','Please enter valid ticket prices. Agent price must not exceed retail price.'],
  ['ส่วนลดเทียบราคาปกติ','Discount from retail price'], ['ราคาปกติ','Retail price'], ['ราคาสำหรับ Agent','Agent price'],
  ['เลือกราคาที่ต้องการเสนอ','Select pricing channel'], ['คำนวณราคา Retail และ Agent จากต้นทุนกลางแบบเรียลไทม์','Calculate Retail and Agent prices from live central costs.'],
  ['ระบบใช้ต้นทุนเดียวกัน แต่แยก Margin และส่วนลดตามช่องทาง','The system uses the same costs with separate margins and discounts for each channel.'],
  ['จำนวนผู้เดินทาง','Passenger count'], ['ระดับโรงแรม','Hotel category'], ['จำนวนคืน','Number of nights'], ['วันเดินทาง','Travel date'],
  ['โปรแกรมการเดินทาง','Travel package'], ['ต้องการสร้างใบเสนอราคาสำหรับลูกค้า?','Create a customer quotation?'],
  ['ชื่อลูกค้า','Customer name'], ['เบอร์โทรศัพท์','Telephone'], ['ข้อมูลความต้องการเพิ่มเติม','Special request notes'],
  ['กรอกข้อมูลผู้ติดต่อเพื่อจัดทำเอกสารใบเสนอราคาอย่างเป็นทางการ','Enter contact details to create an official quotation.'],
  ['ใบเสนอราคา','Quotation'], ['ใบเสนอราคาอย่างเป็นทางการ','Official quotation'], ['พิมพ์ / บันทึกเป็น PDF','Print / Save as PDF'],
  ['เสนอแก่','Prepared for'], ['ยอดสุทธิ','Grand total'], ['ยอดรวมทั้งกรุ๊ป','Total group price'], ['ต่อท่าน','Per person'],
  ['จำนวนเงินตัวอักษร','Amount in words'], ['เงื่อนไขสำคัญ','Booking terms'], ['ราคาขึ้นอยู่กับที่นั่งเที่ยวบินและห้องพัก ณ วันที่ยืนยันการจอง และอาจเปลี่ยนแปลงก่อนชำระมัดจำ','Prices are subject to flight-seat and room availability at confirmation and may change before deposit payment.'],
  ['การจองสมบูรณ์เมื่อบริษัทได้รับเงินมัดจำและออกเอกสารยืนยันการเดินทางแล้ว','Booking is confirmed after the company receives the deposit and issues a travel confirmation.'],
  ['กรุณาส่งสำเนาหนังสือเดินทางและรูปถ่ายสำหรับยื่นวีซ่าล่วงหน้าอย่างน้อย 14 วันก่อนเดินทาง','Please submit passport copies and photos for visa processing at least 14 days before travel.'],
  ['จัดการโปรแกรมการเดินทาง','Manage travel packages'], ['ชื่อโปรแกรมเดินทาง','Package name'], ['ชื่อโรงแรม','Hotel name'],
  ['เพิ่มผู้ใช้งาน','Add user'], ['จัดการผู้ใช้งาน','User management'], ['แก้ไข','Edit'], ['ลบ','Delete'], ['ยกเลิก','Cancel'], ['บันทึก','Save'], ['เพิ่ม','Add'],
  ['บาท','THB'], ['ต่อคน','per person'], ['ต่อคืน','per night'], ['ท่าน','pax'], ['คืน','nights'],
  ['Flight Settings','ตั้งค่าเที่ยวบิน'], ['Configure default flight costs per person in Thai Baht (THB).','กำหนดต้นทุนเที่ยวบินมาตรฐานต่อคนเป็นเงินบาท'],
  ['Air Ticket Price (THB per person)','ราคาตั๋วลูกค้าทั่วไป (บาท/คน)'], ['Agent Air Ticket Price (THB per person)','ราคาตั๋ว Agent (บาท/คน)'],
  ['Airport Tax (THB per person)','ภาษีสนามบิน (บาท/คน)'], ['Save Flight Settings','บันทึกการตั้งค่าเที่ยวบิน'],
  ['USD Exchange Rate','อัตราแลกเปลี่ยน USD'], ['Configure global conversion rate from USD to Thai Baht (THB).','กำหนดอัตราแปลง USD เป็นเงินบาทสำหรับทั้งระบบ'],
  ['Save Exchange Rate','บันทึกอัตราแลกเปลี่ยน'], ['Hotel Management','จัดการโรงแรม'], ['Tour Package Management','จัดการโปรแกรมทัวร์'],
  ['Visa Settings','ตั้งค่าวีซ่า'], ['Margin Settings','ตั้งค่ากำไร'], ['User Management','จัดการผู้ใช้งาน'],
  ['Official Quotation','ใบเสนอราคาอย่างเป็นทางการ'], ['Quotation No.','เลขที่ใบเสนอราคา'], ['Issue Date','วันที่ออกเอกสาร'],
  ['Prepared by','จัดทำโดย'], ['Authorized by','ผู้อนุมัติ'], ['Travel date','วันเดินทาง'], ['Journey','การเดินทาง'],
  ['Travel package & included services','โปรแกรมทัวร์และบริการที่รวม'], ['Standard Price','ราคามาตรฐาน'], ['Total','รวม'],
  ['Retail / Direct Customer','ลูกค้าทั่วไป / Direct'], ['Partner / Wholesale','Agent / Wholesale'], ['PRICING CHANNEL','ช่องทางราคา'],
  ['System overview','ภาพรวมระบบ'], ['Pricing overview','ภาพรวมราคา'], ['Price calculator','คำนวณราคา'],
  ['Tour packages','โปรแกรมทัวร์'], ['Hotels and rooms','โรงแรมและห้องพัก'], ['Flights and taxes','ตั๋วและภาษี'],
  ['Exchange rate','อัตราแลกเปลี่ยน'], ['Visa and fees','วีซ่าและค่าธรรมเนียม'], ['System users','ผู้ใช้งานระบบ'],
];

const thToEn = new Map(pairs);
const enToTh = new Map(pairs.map(([th,en]) => [en,th]));

function translateText(text: string, lang: Language): string {
  const trimmed = text.trim();
  if (!trimmed) return text;
  const map = lang === 'en' ? thToEn : enToTh;
  let output = trimmed;
  if (map.has(trimmed)) output = map.get(trimmed)!;
  else {
    const entries = [...map.entries()].sort((a,b)=>b[0].length-a[0].length);
    for (const [from,to] of entries) if (output.includes(from)) output = output.split(from).join(to);
  }
  return text.replace(trimmed, output);
}

function translateElement(root: ParentNode, lang: Language) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  nodes.forEach(node => {
    const parent = node.parentElement;
    if (!parent || ['SCRIPT','STYLE','TEXTAREA'].includes(parent.tagName)) return;
    const current = node.nodeValue || '';
    const translated = translateText(current, lang);
    if (translated !== current) node.nodeValue = translated;
  });
  if (root instanceof Element) {
    [root, ...Array.from(root.querySelectorAll('*'))].forEach((el: Element) => {
      ['placeholder','title','aria-label'].forEach(attr => {
        const val = el.getAttribute(attr);
        if (val) el.setAttribute(attr, translateText(val, lang));
      });
    });
  }
}

interface LanguageContextValue { language: Language; setLanguage: (v: Language) => void; toggleLanguage: () => void; }
const LanguageContext = createContext<LanguageContextValue>({ language: 'th', setLanguage: () => {}, toggleLanguage: () => {} });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => (localStorage.getItem('bhutan-language') as Language) || 'th');
  const setLanguage = (value: Language) => { localStorage.setItem('bhutan-language', value); setLanguageState(value); };
  const value = useMemo(() => ({ language, setLanguage, toggleLanguage: () => setLanguage(language === 'th' ? 'en' : 'th') }), [language]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.body.dataset.language = language;
    translateElement(document.body, language);
    const observer = new MutationObserver((mutations) => {
      observer.disconnect();
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            const textNode = node as Text;
            textNode.nodeValue = translateText(textNode.nodeValue || '', language);
          } else if (node.nodeType === Node.ELEMENT_NODE) translateElement(node as Element, language);
        });
      }
      observer.observe(document.body, { childList: true, subtree: true });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useLanguage();
  return (
    <div className={`language-switcher ${compact ? 'compact' : ''}`} role="group" aria-label="Language selector">
      <button type="button" className={language === 'th' ? 'active' : ''} onClick={() => setLanguage('th')}>TH</button>
      <button type="button" className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button>
    </div>
  );
}
