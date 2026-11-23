import React, { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, FileText, MapPinned, Plus, Printer, Save, Sparkles, Trash2 } from 'lucide-react';
import { CustomerTracking, HotelCategory, TourProgram, TourProgramDay, User } from '../types';
import { diffTourDays, generateTourProgramDays, programNameFor, STANDARD_CITIES } from '../lib/tourProgramRules';

type Props = {
  currentUser: User;
  trackings: CustomerTracking[];
  programs: TourProgram[];
  onSave: (program: TourProgram) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

const CITY_OPTIONS = ['Paro', 'Thimphu', 'Punakha', 'Haa', 'Gangtey'];

const uid = (prefix: string) => prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const addDays = (date: string, offset: number) => {
  if (!date) return '';
  const d = new Date(date + 'T12:00:00');
  d.setDate(d.getDate() + offset);
  return isoDate(d);
};

function createProgram(currentUser: User): TourProgram {
  const start = isoDate(new Date());
  const end = addDays(start, 4);
  const seed: TourProgram = {
    id: uid('tp'),
    trackingId: '',
    customerName: '',
    title: 'WONDERS OF BHUTAN',
    status: 'draft',
    startDate: start,
    endDate: end,
    cities: ['Paro', 'Thimphu', 'Punakha'],
    hotelCategory: '3 Stars',
    outboundFlight: { flightNo: '', departureAirport: 'BKK', arrivalAirport: 'PBH', departureTime: '', arrivalTime: '' },
    inboundFlight: { flightNo: '', departureAirport: 'PBH', arrivalAirport: 'BKK', departureTime: '', arrivalTime: '' },
    options: { includeFestival: false, festivalName: '', festivalDate: '' },
    selectedFestivalIds: [],
    days: [],
    guideName: '',
    guideContact: '',
    roomType: 'Twin / Double',
    note: '',
    createdById: currentUser.id,
    createdByName: currentUser.name,
    finalizedAt: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  seed.days = generateTourProgramDays(seed);
  return seed;
}


const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const formatTravelDate = (value: string) => {
  if (!value) return '-';
  const d = new Date(value + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
};

const ACTIVITY_COPY: Record<string, string> = {
  'Rinpung Dzong': 'เยี่ยมชมพาโรรินปุงซอง ป้อมปราการสำคัญของเมืองพาโร และชมสถาปัตยกรรมซองอันเป็นเอกลักษณ์ของภูฏาน',
  'National Museum of Bhutan': 'ชมพิพิธภัณฑสถานแห่งชาติภูฏาน เรียนรู้ประวัติศาสตร์ ศิลปวัฒนธรรม และวิถีชีวิตของชาวภูฏาน',
  'Kyichu Lhakhang': 'สักการะวัดคิชูลาคัง หนึ่งในวัดเก่าแก่และศักดิ์สิทธิ์ที่สุดของภูฏาน',
  'Buddha Dordenma': 'สักการะองค์พระใหญ่ Buddha Dordenma พร้อมชมทัศนียภาพเมืองทิมพูจากมุมสูง',
  'Takin Zoo': 'ชมทาคิน สัตว์ประจำชาติของภูฏาน ณ เขตอนุรักษ์ทาคินเมืองทิมพู',
  'National Library': 'เยี่ยมชมหอสมุดแห่งชาติ แหล่งรวบรวมคัมภีร์และเอกสารสำคัญของภูฏาน',
  'National Post Office': 'เยี่ยมชมที่ทำการไปรษณีย์แห่งชาติ ซึ่งมีชื่อเสียงด้านตราไปรษณียากรของภูฏาน',
  'Memorial Chorten': 'เยี่ยมชม National Memorial Chorten อนุสรณ์สถานสำคัญใจกลางเมืองทิมพู',
  'Tashichho Dzong': 'ชมตาชิโชซอง ศูนย์กลางการบริหารราชการและศาสนาที่สำคัญของเมืองทิมพู',
  'Simtokha Dzong': 'แวะชมซิมโตกาซอง หนึ่งในซองเก่าแก่บนเส้นทางจากทิมพู',
  'Dochula Pass': 'เดินทางผ่านโดชูลาพาส ชมสถูปแห่งชัยชนะ 108 องค์ และทิวทัศน์เทือกเขาหิมาลัยเมื่อท้องฟ้าเปิด',
  'Chimi Lhakhang': 'เยี่ยมชมวัดชิมิลาคัง วัดสำคัญกลางหุบเขาพูนาคา',
  'Punakha Dzong': 'ชมพูนาคาซอง ป้อมปราการที่ตั้งอยู่บริเวณจุดบรรจบของแม่น้ำ Pho Chhu และ Mo Chhu',
  'Punakha Suspension Bridge': 'เดินชมสะพานแขวนพูนาคา สัมผัสบรรยากาศของหุบเขาและสายน้ำ',
  'Sangaygang View Point': 'ชมวิวเมืองทิมพูจากจุดชมวิวซังเกกัง',
  'Chuzom Bridge': 'แวะบริเวณชูซอม จุดบรรจบของเส้นทางสำคัญก่อนเข้าสู่เมืองพาโร',
  'Gangtey Monastery': 'เยี่ยมชมวัดกังเต วัดสำคัญของหุบเขากังเต',
  'Phobjikha Valley': 'ชมธรรมชาติของหุบเขาผอบจิกะ หนึ่งในหุบเขาที่งดงามและสงบของภูฏาน',
  'Taktsang Monastery or Tiger’s Nest': 'เดินขึ้นสู่วัดทักซัง หรือ Tiger’s Nest วัดสำคัญระดับโลกที่ตั้งอยู่บนหน้าผาเหนือหุบเขาพาโร',
  'Lunch at Taktsang Cafeteria': 'รับประทานอาหารกลางวัน ณ Taktsang Cafeteria ระหว่างการเดินขึ้นวัดทักซัง',
  'Paro Street Shopping (City Center)': 'เดินเล่นย่านใจกลางเมืองพาโรและเลือกซื้อของที่ระลึกตามอัธยาศัย',
};

function activityParagraph(item: string) {
  if (ACTIVITY_COPY[item]) return ACTIVITY_COPY[item];
  if (item.startsWith('เทศกาล:')) return 'ร่วมชม' + item.replace('เทศกาล:', '').trim() + ' ตามวันและเวลาจัดงานจริง';
  if (item.includes('สนามบินพาโร')) return 'เดินทางสู่สนามบินนานาชาติพาโร เพื่อเช็กอินและเดินทางกลับกรุงเทพฯ';
  return item;
}


const TOUR_IMAGES = {
  cover: '/images/hero-bhutan.png',
  paro: '/images/hero-bhutan.png',
  taktsang: '/images/tiger-nest-paro-real.png',
  thimphu: 'https://a.storyblok.com/f/171618/1430x956/6bdf4170d9/0.jpg/m/1800x0',
  punakha: 'https://a.storyblok.com/f/171618/1120x1400/96296acc21/_sch7068_phunaka_dzong.jpg/m/1200x0',
  gangtey: 'https://a.storyblok.com/f/171618/3000x2400/0090d19186/_sch9167.jpg/m/1800x0',
};

function tourDayImage(day: TourProgramDay) {
  const haystack = (day.city + ' ' + day.title + ' ' + day.activities.join(' ')).toLowerCase();
  if (haystack.includes('taktsang') || haystack.includes('tiger')) return TOUR_IMAGES.taktsang;
  if (haystack.includes('punakha')) return TOUR_IMAGES.punakha;
  if (haystack.includes('gangtey') || haystack.includes('phobjikha')) return TOUR_IMAGES.gangtey;
  if (haystack.includes('thimphu') || haystack.includes('buddha dordenma')) return TOUR_IMAGES.thimphu;
  return TOUR_IMAGES.paro;
}

function fullProgramHtml(program: TourProgram) {
  const total = Math.max(1, diffTourDays(program.startDate, program.endDate));
  const programTitle = programNameFor(total, program.cities);
  const duration = total + ' วัน ' + Math.max(0, total - 1) + ' คืน';
  const route = programTitle === 'THE ULTIMATE BHUTAN'
    ? 'พาโร - ทิมพู - พูนาคา - กังเต - ทักซัง'
    : programTitle === 'Custom to Bhutan'
      ? (program.cities.join(' - ') + ' - พาโร - ทักซัง')
      : 'พาโร - ทิมพู - พูนาคา - ทักซัง';

  const flightOut = (program.outboundFlight.flightNo || '-') + '  ' + (program.outboundFlight.departureTime || '-') + ' - ' + (program.outboundFlight.arrivalTime || '-');
  const flightBack = (program.inboundFlight.flightNo || '-') + '  ' + (program.inboundFlight.departureTime || '-') + ' - ' + (program.inboundFlight.arrivalTime || '-');

  const whyPage =
    '<section class="page why-page">' +
      '<div class="photo-grid">' +
        '<div class="photo-main"><img src="' + TOUR_IMAGES.taktsang + '" alt="Taktsang Monastery"></div>' +
        '<div class="photo-side"><img src="' + TOUR_IMAGES.punakha + '" alt="Punakha Dzong"><img src="' + TOUR_IMAGES.thimphu + '" alt="Thimphu"></div>' +
      '</div>' +
      '<div class="why-content">' +
        '<div class="section-kicker">WHY BHUTAN CENTER</div>' +
        '<h2>เที่ยวภูฏานแบบที่ทุกวันมีความหมาย</h2>' +
        '<p class="lead">เราออกแบบเส้นทางจากวันเดินทางจริง เวลาเที่ยวบิน เมืองที่ต้องการ และจังหวะการเดินทางของภูฏาน เพื่อให้เที่ยวได้เต็มที่โดยไม่เร่งจนเกินไป</p>' +
        '<div class="why-cards">' +
          '<div><b>เส้นทางเหมาะกับเวลา</b><span>จัดเมืองและสถานที่ให้สัมพันธ์กับเวลาเครื่องและระยะทางจริง</span></div>' +
          '<div><b>คืนสุดท้ายที่พาโร</b><span>คืนก่อนเดินทางกลับพักพาโรเสมอ เพื่อพร้อมสำหรับสนามบินในวันถัดไป</span></div>' +
          '<div><b>Taktsang เป็นไฮไลต์</b><span>วาง Tiger’s Nest ไว้ก่อนวันกลับ 1 วัน ให้มีเวลาเดินขึ้นและพักอย่างเหมาะสม</span></div>' +
        '</div>' +
        '<div class="quote">“A journey through Bhutan should feel calm, beautiful and unforgettable - not rushed.”</div>' +
      '</div>' +
      '<footer><span>BHUTAN CENTER</span><span>www.bhutancenter.com</span><span>LICENSE 11/07261</span></footer>' +
    '</section>';

  const dayPages = program.days.map((day) => {
    const rows = day.activities.map((item, index) =>
      '<div class="timeline-item">' +
        '<div class="timeline-dot">' + (index + 1) + '</div>' +
        '<div class="timeline-copy">' + escapeHtml(activityParagraph(item)) + '</div>' +
      '</div>'
    ).join('');

    const mealTags =
      '<div class="meal-tags">' +
      (day.meals.breakfast ? '<span>BREAKFAST</span>' : '') +
      (day.meals.lunch ? '<span>LUNCH</span>' : '') +
      (day.meals.dinner ? '<span>DINNER</span>' : '') +
      '</div>';

    return '<section class="page day-page">' +
      '<div class="day-photo">' +
        '<img src="' + tourDayImage(day) + '" alt="' + escapeHtml(day.title) + '">' +
        '<div class="day-photo-shade"></div>' +
        '<div class="day-brand">BHUTAN CENTER</div>' +
        '<div class="day-number">DAY <strong>' + day.dayNumber + '</strong></div>' +
        '<div class="day-title"><span>' + escapeHtml(formatTravelDate(day.date)) + '</span><h2>' + escapeHtml(day.title) + '</h2></div>' +
      '</div>' +
      '<div class="day-body">' +
        '<div class="day-main">' +
          '<div class="section-kicker">TODAY IN BHUTAN</div>' +
          '<div class="timeline">' + rows + '</div>' +
          (day.note ? '<div class="note-card"><b>TRAVEL NOTE</b><span>' + escapeHtml(day.note) + '</span></div>' : '') +
        '</div>' +
        '<aside class="day-aside">' +
          '<div class="aside-card">' +
            '<small>OVERNIGHT</small>' +
            '<strong>' + escapeHtml(day.hotel || 'Bangkok') + '</strong>' +
            '<span>' + (day.hotel ? 'พักผ่อนหลังจบโปรแกรมประจำวัน' : 'เดินทางกลับโดยสวัสดิภาพ') + '</span>' +
          '</div>' +
          '<div class="aside-card meals"><small>MEALS</small>' + mealTags + '</div>' +
          '<div class="aside-card route-card"><small>ROUTE</small><strong>' + escapeHtml(day.city) + '</strong><span>Bhutan</span></div>' +
        '</aside>' +
      '</div>' +
      '<footer><span>BHUTAN CENTER</span><span>info@bhutancenter.com</span><span>52/38 Soi Saladaeng 2, Silom, Bangkok</span></footer>' +
    '</section>';
  }).join('');

  return '<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + escapeHtml(programTitle) + '</title>' +
    '<style>' +
      '@page{size:A4;margin:0}' +
      '*{box-sizing:border-box}' +
      'html,body{margin:0;padding:0;background:#dcd8d1;color:#27332f;font-family:"Tahoma","Arial",sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
      'img{display:block;width:100%;height:100%;object-fit:cover}' +
      '.toolbar{position:sticky;top:0;z-index:50;display:flex;gap:10px;justify-content:center;padding:12px;background:#163d32;box-shadow:0 8px 24px rgba(0,0,0,.18)}' +
      '.toolbar button{border:0;border-radius:999px;padding:11px 19px;font-weight:800;cursor:pointer}.toolbar .primary{background:#d3a451;color:#fff}.toolbar .secondary{background:#fff;color:#163d32}' +
      '.page{width:210mm;height:297mm;margin:14px auto;background:#fff;position:relative;overflow:hidden;page-break-after:always;box-shadow:0 12px 38px rgba(25,39,34,.16)}' +
      '.cover{background:#0f332a;color:#fff}' +
      '.cover-photo{position:absolute;inset:0 0 auto 0;height:178mm}' +
      '.cover-photo:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,32,27,.08) 15%,rgba(10,32,27,.30) 52%,#0f332a 100%)}' +
      '.cover-photo img{position:absolute;inset:0}' +
      '.cover-top{position:absolute;top:15mm;left:16mm;right:16mm;z-index:2;display:flex;justify-content:space-between;align-items:flex-start}' +
      '.cover-logo{display:flex;align-items:center;gap:10px}.cover-logo img{width:18mm;height:18mm;object-fit:contain;background:rgba(255,255,255,.94);border-radius:50%;padding:2.5mm}.cover-logo b{font-size:16px;letter-spacing:.08em}.cover-logo span{display:block;font-size:9px;opacity:.78;margin-top:2px}' +
      '.cover-badge{padding:7px 11px;border:1px solid rgba(255,255,255,.42);border-radius:999px;font-size:10px;font-weight:700;background:rgba(12,42,34,.28);backdrop-filter:blur(4px)}' +
      '.cover-title{position:absolute;z-index:2;left:17mm;right:17mm;top:104mm}.cover-title .eyebrow{font-size:11px;letter-spacing:.22em;font-weight:800;color:#f1cd8e}.cover-title h1{font-size:35px;line-height:1.04;margin:7px 0 6px;letter-spacing:.01em}.cover-title h2{font-size:23px;margin:0;color:#f2cf91}.cover-title .route{font-size:14px;margin-top:9px;font-weight:700;opacity:.94}' +
      '.cover-info{position:absolute;left:16mm;right:16mm;bottom:16mm;background:#fff;color:#24312d;border-radius:7mm;padding:9mm 9mm 8mm;display:grid;grid-template-columns:1.15fr .85fr;gap:10mm;box-shadow:0 12px 28px rgba(0,0,0,.18)}' +
      '.cover-info h3{margin:0 0 6px;font-size:14px;color:#163d32}.info-list{display:grid;gap:5px;font-size:10.5px}.info-row{display:grid;grid-template-columns:34mm 1fr;gap:6px}.info-row b{color:#74634d}.flight-box{border-left:1px solid #e8e0d3;padding-left:8mm;display:grid;gap:7px}.flight{background:#f6f2ea;border-radius:4mm;padding:5mm}.flight small{display:block;font-size:8px;letter-spacing:.12em;color:#907646;font-weight:800}.flight strong{display:block;font-size:12px;margin-top:3px}.flight span{display:block;font-size:9px;color:#6e756f;margin-top:2px}' +
      '.photo-grid{height:120mm;display:grid;grid-template-columns:1.35fr .65fr;gap:2.5mm;padding:0}.photo-main,.photo-side{min-width:0;min-height:0}.photo-side{display:grid;grid-template-rows:1fr 1fr;gap:2.5mm}' +
      '.why-content{padding:13mm 16mm 18mm}.section-kicker{font-size:9px;letter-spacing:.18em;font-weight:900;color:#b98a40}.why-content h2{font-size:27px;line-height:1.15;margin:4px 0 6px;color:#153d32}.lead{font-size:13px;line-height:1.7;margin:0 0 8mm;color:#59625e}.why-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm}.why-cards div{border:1px solid #e8e0d4;border-radius:4mm;padding:5mm;background:#fbfaf7}.why-cards b{display:block;font-size:11px;color:#173e33;margin-bottom:3px}.why-cards span{font-size:9.5px;line-height:1.5;color:#69716d}.quote{margin-top:7mm;padding:5mm 7mm;background:#163d32;color:#fff;border-radius:4mm;font-size:12px;line-height:1.6;text-align:center}' +
      '.day-photo{height:82mm;position:relative;background:#19382f}.day-photo img{position:absolute;inset:0}.day-photo-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,28,24,.05),rgba(8,28,24,.15) 45%,rgba(8,28,24,.82) 100%)}' +
      '.day-brand{position:absolute;top:10mm;left:14mm;color:#fff;font-size:10px;font-weight:900;letter-spacing:.12em}.day-number{position:absolute;top:9mm;right:14mm;color:#fff;font-size:10px;letter-spacing:.12em;border:1px solid rgba(255,255,255,.55);border-radius:999px;padding:6px 9px;background:rgba(11,44,35,.28)}.day-number strong{font-size:13px;margin-left:2px}' +
      '.day-title{position:absolute;left:14mm;right:14mm;bottom:10mm;color:#fff}.day-title span{font-size:9px;letter-spacing:.12em;font-weight:800;color:#f1d398}.day-title h2{font-size:25px;line-height:1.15;margin:4px 0 0;text-shadow:0 2px 12px rgba(0,0,0,.28)}' +
      '.day-body{height:198mm;padding:10mm 14mm 13mm;display:grid;grid-template-columns:minmax(0,1fr) 48mm;gap:8mm}.day-main{min-width:0}.timeline{margin-top:5mm;display:grid;gap:3.2mm}.timeline-item{display:grid;grid-template-columns:7mm 1fr;gap:3.5mm;align-items:start}.timeline-dot{width:6mm;height:6mm;border-radius:50%;background:#d3a451;color:#fff;font-size:8px;font-weight:900;display:grid;place-items:center;margin-top:1px}.timeline-copy{font-size:10.5px;line-height:1.55;color:#38443f;border-bottom:1px solid #eee8df;padding-bottom:3mm}.timeline-item:last-child .timeline-copy{border-bottom:0}' +
      '.note-card{margin-top:5mm;border-left:3px solid #d3a451;background:#f8f3e9;border-radius:0 3mm 3mm 0;padding:4mm 5mm}.note-card b{display:block;font-size:8px;letter-spacing:.12em;color:#a4742d;margin-bottom:2px}.note-card span{font-size:9.5px;line-height:1.5;color:#5d655f}' +
      '.day-aside{display:grid;align-content:start;gap:4mm}.aside-card{border-radius:4mm;padding:5mm;background:#f6f3ed;border:1px solid #ebe3d7}.aside-card small{display:block;font-size:7.5px;letter-spacing:.14em;font-weight:900;color:#a37c42;margin-bottom:3px}.aside-card strong{display:block;font-size:12px;line-height:1.25;color:#173d32}.aside-card>span{display:block;font-size:8.5px;line-height:1.45;color:#68706b;margin-top:3px}.meal-tags{display:flex;flex-wrap:wrap;gap:2mm;margin-top:2mm}.meal-tags span{font-size:7.5px;font-weight:800;color:#fff;background:#173d32;border-radius:999px;padding:2mm 2.5mm}.route-card{background:#173d32;color:#fff}.route-card small{color:#edca8a}.route-card strong{color:#fff;font-size:16px}.route-card>span{color:rgba(255,255,255,.7)}' +
      'footer{position:absolute;left:14mm;right:14mm;bottom:6mm;display:flex;justify-content:space-between;gap:8px;border-top:1px solid #e6ded3;padding-top:3mm;color:#817a70;font-size:7.5px}.cover footer{color:rgba(255,255,255,.75);border-color:rgba(255,255,255,.25)}' +
      '@media print{html,body{background:#fff}.toolbar{display:none}.page{margin:0;box-shadow:none;page-break-after:always}.page:last-child{page-break-after:auto}}' +
    '</style></head><body>' +
      '<div class="toolbar"><button class="primary" onclick="window.print()">พิมพ์ / บันทึกเป็น PDF</button><button class="secondary" onclick="window.close()">ปิด</button></div>' +
      '<section class="page cover">' +
        '<div class="cover-photo"><img src="' + TOUR_IMAGES.cover + '" alt="Bhutan landscape"></div>' +
        '<div class="cover-top">' +
          '<div class="cover-logo"><img src="/images/bhutan-center-logo.png" alt="Bhutan Center"><div><b>BHUTAN CENTER</b><span>OMG EXPERIENCE</span></div></div>' +
          '<div class="cover-badge">PRIVATE JOURNEY</div>' +
        '</div>' +
        '<div class="cover-title">' +
          '<div class="eyebrow">DISCOVER THE KINGDOM OF HAPPINESS</div>' +
          '<h1>' + escapeHtml(programTitle) + '</h1>' +
          '<h2>' + escapeHtml(duration) + '</h2>' +
          '<div class="route">' + escapeHtml(route) + '</div>' +
        '</div>' +
        '<div class="cover-info">' +
          '<div><h3>TRAVEL INFORMATION</h3><div class="info-list">' +
            '<div class="info-row"><b>Customer</b><span>' + escapeHtml(program.customerName || '-') + '</span></div>' +
            '<div class="info-row"><b>Date of Travel</b><span>' + escapeHtml(formatTravelDate(program.startDate)) + ' - ' + escapeHtml(formatTravelDate(program.endDate)) + '</span></div>' +
            '<div class="info-row"><b>Guide</b><span>' + escapeHtml(program.guideName || '-') + '</span></div>' +
            '<div class="info-row"><b>Guide Contact</b><span>' + escapeHtml(program.guideContact || '-') + '</span></div>' +
            '<div class="info-row"><b>Room Type</b><span>' + escapeHtml(program.roomType || '-') + '</span></div>' +
          '</div></div>' +
          '<div class="flight-box">' +
            '<div class="flight"><small>OUTBOUND · BKK → PBH</small><strong>' + escapeHtml(flightOut) + '</strong><span>Bangkok to Paro</span></div>' +
            '<div class="flight"><small>INBOUND · PBH → BKK</small><strong>' + escapeHtml(flightBack) + '</strong><span>Paro to Bangkok</span></div>' +
          '</div>' +
        '</div>' +
        '<footer><span>BHUTAN CENTER</span><span>www.bhutancenter.com</span><span>LICENSE 11/07261</span></footer>' +
      '</section>' +
      whyPage + dayPages +
    '</body></html>';
}

function openFullProgram(program: TourProgram, autoPrint = false) {
  const docWindow = window.open('', '_blank');
  if (!docWindow) {
    window.alert('เบราว์เซอร์บล็อกหน้าต่างเอกสาร กรุณาอนุญาต Pop-up สำหรับเว็บไซต์นี้');
    return;
  }
  docWindow.document.open();
  docWindow.document.write(fullProgramHtml(program));
  docWindow.document.close();
  docWindow.focus();
  if (autoPrint) {
    const images = Array.from(docWindow.document.images);
    Promise.all(images.map((img) => img.complete ? Promise.resolve() : new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    }))).then(() => window.setTimeout(() => docWindow.print(), 250));
  }
}

export function TourProgramBuilder({ currentUser, trackings, programs, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState<TourProgram>(() => programs[0] || createProgram(currentUser));
  const linkedTracking = useMemo(() => trackings.find((x) => x.id === editing.trackingId), [trackings, editing.trackingId]);
  const canFinalize = Boolean(linkedTracking?.bookingConfirmedAt && (linkedTracking?.visaReceivedAt || linkedTracking?.visaSentAt));
  const totalDays = Math.max(1, diffTourDays(editing.startDate, editing.endDate));

  const set = <K extends keyof TourProgram>(key: K, value: TourProgram[K]) => setEditing((prev) => ({ ...prev, [key]: value, updatedAt: new Date().toISOString() }));
  const rebuild = (patch?: Partial<TourProgram>) => {
    setEditing((prev) => {
      const next = { ...prev, ...patch, updatedAt: new Date().toISOString() };
      const total = Math.max(1, diffTourDays(next.startDate, next.endDate));
      const titled = { ...next, title: programNameFor(total, next.cities) };
      return { ...titled, days: generateTourProgramDays(titled) };
    });
  };

  const setDuration = (days: number) => {
    if (!editing.startDate) return;
    rebuild({ endDate: addDays(editing.startDate, days - 1), cities: STANDARD_CITIES[days] || editing.cities });
  };

  async function save(status: 'draft' | 'final') {
    if (!editing.customerName.trim()) return window.alert('กรุณาระบุชื่อลูกค้าหรือเชื่อมกับ Booking ก่อน');
    if (status === 'final' && !canFinalize) return window.alert('Final Itinerary จะออกได้เมื่อ Booking Confirmed และมี Visa Received/Sent แล้ว');
    const next: TourProgram = {
      ...editing,
      status,
      finalizedAt: status === 'final' ? (editing.finalizedAt || new Date().toISOString()) : '',
      updatedAt: new Date().toISOString(),
    };
    await onSave(next);
    setEditing(next);
  }

  const updateDay = (id: string, patch: Partial<TourProgramDay>) => set('days', editing.days.map((day) => day.id === id ? { ...day, ...patch } : day));
  const toggleCity = (city: string) => {
    const next = editing.cities.includes(city) ? editing.cities.filter((x) => x !== city) : [...editing.cities, city];
    rebuild({ cities: next });
  };

  return <div className="admin-stack tour-program-builder">
    <section className="admin-hero tour-program-hero">
      <div>
        <span className="eyebrow"><MapPinned/> TOUR PROGRAM BUILDER</span>
        <h2>สร้างโปรแกรมทัวร์จากวันเดินทางจริง</h2>
        <p>กำหนดวันเดินทาง · เวลาเที่ยวบิน · เมือง · เทศกาล แล้วจัด Day 1–{totalDays} ให้เหมาะกับเวลาเที่ยว</p>
      </div>
      <div className="tour-program-actions">
        <button className="ghost-button" onClick={() => setEditing(createProgram(currentUser))}><Plus/>สร้างใหม่</button>
        <button className="ghost-button" onClick={() => openFullProgram(editing, false)}><FileText/>ดูโปรแกรมฉบับเต็ม</button>\n        <button className="ghost-button" onClick={() => openFullProgram(editing, true)}><Printer/>พิมพ์ / PDF</button>
        <button className="primary-button" onClick={() => save('draft')}><Save/>บันทึก Draft</button>
      </div>
    </section>

    <section className="panel-card">
      <div className="panel-heading"><div><span>STEP 1</span><h3>ข้อมูลลูกค้าและวันเดินทาง</h3></div><span className="count-badge">{totalDays} วัน {Math.max(0, totalDays - 1)} คืน</span></div>
      <div className="editor-form">
        <label className="field"><span>เชื่อมกับ Booking / Customer Journey</span><select value={editing.trackingId} onChange={(e) => {
          const tracking = trackings.find((item) => item.id === e.target.value);
          const patch: Partial<TourProgram> = {
            trackingId: e.target.value,
            customerName: tracking?.customerName || editing.customerName,
            startDate: tracking?.travelStartDate || editing.startDate,
            endDate: tracking?.travelEndDate || editing.endDate,
            hotelCategory: tracking?.hotelCategory || editing.hotelCategory,
          };
          rebuild(patch);
        }}><option value="">— ไม่เชื่อม Booking —</option>{trackings.map((item) => <option key={item.id} value={item.id}>{item.customerName} · {item.travelStartDate || '-'} · {item.packageName || 'Custom trip'}</option>)}</select></label>

        <div className="form-grid">
          <label className="field"><span>ชื่อลูกค้า</span><input value={editing.customerName} onChange={(e) => set('customerName', e.target.value)}/></label>
          <label className="field"><span>ชื่อโปรแกรม</span><input value={editing.title} readOnly/><small>4D3N = JOURNEY TO BHUTAN · 5D4N = WONDERS OF BHUTAN · 6D5N = THE ULTIMATE BHUTAN · มากกว่า 6 วันหรือปรับเส้นทาง = Custom to Bhutan</small></label>
          <label className="field"><span>วันเดินทางไป</span><input type="date" value={editing.startDate} onChange={(e) => rebuild({ startDate: e.target.value })}/></label>
          <label className="field"><span>วันเดินทางกลับ</span><input type="date" value={editing.endDate} onChange={(e) => rebuild({ endDate: e.target.value })}/></label>
        </div>

        <div className="tour-program-presets">
          <span>ระยะเวลามาตรฐาน</span>
          <button className={totalDays === 4 ? 'active' : ''} onClick={() => setDuration(4)}>4 วัน 3 คืน</button>
          <button className={totalDays === 5 ? 'active' : ''} onClick={() => setDuration(5)}>5 วัน 4 คืน</button>
          <button className={totalDays === 6 ? 'active' : ''} onClick={() => setDuration(6)}>6 วัน 5 คืน</button>
          <button className={! [4,5,6].includes(totalDays) ? 'active' : ''} type="button">กำหนดเอง</button>
        </div>

        <label className="field"><span>ระดับโรงแรม</span><select value={editing.hotelCategory} onChange={(e) => set('hotelCategory', e.target.value as HotelCategory)}><option>3 Stars</option><option>4 Stars</option><option>5 Stars</option></select></label>
        <div className="field"><span>เมืองที่ต้องการในทริป</span><div className="tour-city-picker">{CITY_OPTIONS.map((city) => <button key={city} type="button" className={editing.cities.includes(city) ? 'active' : ''} onClick={() => toggleCity(city)}>{city}</button>)}</div><small>กฎเส้นทาง: วันก่อนเดินทางกลับต้องเป็น Paro – Taktsang และพักคืนสุดท้ายที่ Paro เสมอ เพราะสนามบินระหว่างประเทศอยู่ที่ Paro</small></div>
      </div>
    </section>

    <section className="panel-card">
      <div className="panel-heading"><div><span>STEP 2</span><h3>เที่ยวบินไป–กลับ</h3></div></div>
      <div className="tour-flight-grid">
        <div className="tour-flight-card"><b>BKK → PBH</b><small>เที่ยวบินขาไป</small>
          <label className="field"><span>Flight No.</span><input value={editing.outboundFlight.flightNo} onChange={(e) => set('outboundFlight', { ...editing.outboundFlight, flightNo: e.target.value })}/></label>
          <div className="form-grid"><label className="field"><span>เวลาออก</span><input type="time" value={editing.outboundFlight.departureTime} onChange={(e) => set('outboundFlight', { ...editing.outboundFlight, departureTime: e.target.value })}/></label><label className="field"><span>เวลาถึง</span><input type="time" value={editing.outboundFlight.arrivalTime} onChange={(e) => rebuild({ outboundFlight: { ...editing.outboundFlight, arrivalTime: e.target.value } })}/></label></div>
        </div>
        <div className="tour-flight-card"><b>PBH → BKK</b><small>เที่ยวบินขากลับ</small>
          <label className="field"><span>Flight No.</span><input value={editing.inboundFlight.flightNo} onChange={(e) => set('inboundFlight', { ...editing.inboundFlight, flightNo: e.target.value })}/></label>
          <div className="form-grid"><label className="field"><span>เวลาออก</span><input type="time" value={editing.inboundFlight.departureTime} onChange={(e) => rebuild({ inboundFlight: { ...editing.inboundFlight, departureTime: e.target.value } })}/></label><label className="field"><span>เวลาถึง</span><input type="time" value={editing.inboundFlight.arrivalTime} onChange={(e) => set('inboundFlight', { ...editing.inboundFlight, arrivalTime: e.target.value })}/></label></div>
        </div>
      </div>
    </section>

    <section className="panel-card">
      <div className="panel-heading"><div><span>STEP 3</span><h3>เทศกาลพิเศษ</h3></div></div>
      <div className="editor-form">
        <label className="tour-toggle"><input type="checkbox" checked={Boolean(editing.options.includeFestival)} onChange={(e) => set('options', { ...editing.options, includeFestival: e.target.checked })}/><span><b>ทริปนี้มีเทศกาลที่ลูกค้าต้องการชม</b><small>ระบบจะวางเทศกาลไว้ในวันจริงก่อนจัดสถานที่เที่ยวอื่น</small></span></label>
        {Boolean(editing.options.includeFestival) && <div className="form-grid"><label className="field"><span>ชื่อเทศกาล</span><input value={String(editing.options.festivalName || '')} onChange={(e) => set('options', { ...editing.options, festivalName: e.target.value })}/></label><label className="field"><span>วันที่เทศกาล</span><input type="date" value={String(editing.options.festivalDate || '')} onChange={(e) => rebuild({ options: { ...editing.options, festivalDate: e.target.value } })}/></label></div>}
        <button className="primary-button tour-generate" onClick={() => rebuild()}><Sparkles/>จัดโปรแกรม Day 1–{totalDays} ใหม่</button>
      </div>
    </section>

    <section className="tour-days">
      {editing.days.map((day) => <section className="panel-card tour-day-card" key={day.id}>
        <div className="tour-day-head"><div className="tour-day-number">DAY<br/><b>{day.dayNumber}</b></div><div><span>{day.date || '-'}</span><h3>{day.title}</h3></div><CalendarDays/></div>
        <div className="editor-form">
          <div className="form-grid"><label className="field"><span>เมืองหลัก</span><select value={day.city} onChange={(e) => updateDay(day.id, { city: e.target.value })}>{CITY_OPTIONS.map((city) => <option key={city}>{city}</option>)}</select></label><label className="field"><span>หัวข้อวันนี้</span><input value={day.title} onChange={(e) => updateDay(day.id, { title: e.target.value })}/></label></div>
          <label className="field"><span>สถานที่ / กิจกรรม — 1 บรรทัดต่อ 1 รายการ</span><textarea rows={5} value={day.activities.join('\n')} onChange={(e) => updateDay(day.id, { activities: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean) })}/></label>
          <div className="tour-meals">
            <span>อาหาร</span>
            {(['breakfast','lunch','dinner'] as const).map((meal) => <label key={meal}><input type="checkbox" checked={day.meals[meal]} onChange={(e) => updateDay(day.id, { meals: { ...day.meals, [meal]: e.target.checked } })}/>{meal === 'breakfast' ? 'เช้า' : meal === 'lunch' ? 'กลางวัน' : 'เย็น'}</label>)}
          </div>
          <div className="form-grid"><label className="field"><span>โรงแรม</span><input value={day.hotel} onChange={(e) => updateDay(day.id, { hotel: e.target.value })}/></label><label className="field"><span>หมายเหตุ / การเดินทาง</span><input value={day.note} onChange={(e) => updateDay(day.id, { note: e.target.value })}/></label></div>
        </div>
      </section>)}
    </section>

    <section className="panel-card tour-final-card">
      <div className="panel-heading"><div><span>FINAL ITINERARY</span><h3>ข้อมูลส่งมอบก่อนเดินทาง</h3></div>{editing.status === 'final' ? <CheckCircle2/> : <FileText/>}</div>
      <div className={canFinalize ? 'tour-final-status ready' : 'tour-final-status'}>{canFinalize ? 'พร้อมออก Final Itinerary' : 'รอ Booking Confirmed และ Visa Received/Sent ก่อนออก Final'}</div>
      <div className="form-grid"><label className="field"><span>ชื่อไกด์</span><input value={editing.guideName} onChange={(e) => set('guideName', e.target.value)}/></label><label className="field"><span>เบอร์ติดต่อไกด์</span><input value={editing.guideContact} onChange={(e) => set('guideContact', e.target.value)}/></label><label className="field"><span>Room Type</span><input value={editing.roomType} onChange={(e) => set('roomType', e.target.value)}/></label><label className="field"><span>หมายเหตุรวม</span><input value={editing.note} onChange={(e) => set('note', e.target.value)}/></label></div>
      <div className="modal-actions"><button className="ghost-button" onClick={() => save('draft')}><Save/>บันทึก Draft</button><button className="primary-button" disabled={!canFinalize} onClick={() => save('final')}><CheckCircle2/>ออก Final Itinerary</button></div>
    </section>

    {programs.length > 0 && <section className="panel-card no-padding">
      <div className="panel-heading tour-list-heading"><div><span>SAVED PROGRAMS</span><h3>โปรแกรมที่บันทึกไว้</h3></div><span className="count-badge">{programs.length}</span></div>
      <div className="tour-program-list">{programs.map((program) => <div className="tour-program-row" key={program.id}><button className="tour-program-open" onClick={() => setEditing(program)}><span><b>{program.customerName || program.title}</b><small>{program.startDate} – {program.endDate} · {program.cities.join(' → ')}</small></span><em className={program.status}>{program.status === 'final' ? 'FINAL' : 'DRAFT'}</em></button><button className="icon-button danger" onClick={() => onDelete(program.id)} aria-label="ลบโปรแกรม"><Trash2/></button></div>)}</div>
    </section>}
  </div>;
}
