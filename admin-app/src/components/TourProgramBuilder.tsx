import React, { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, FileText, MapPinned, Plus, Printer, Save, Sparkles, Trash2 } from 'lucide-react';
import { CustomerTracking, HotelCategory, TourProgram, TourProgramDay, User } from '../types';
import { diffTourDays, generateTourProgramDays, getPenultimateProgram, programNameFor, STANDARD_CITIES } from '../lib/tourProgramRules';
import { dayJourneyLead, storyPlacesForProgram } from '../lib/tourProgramStory';

type Props = {
  currentUser: User;
  trackings: CustomerTracking[];
  programs: TourProgram[];
  onSave: (program: TourProgram) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

const CITY_OPTIONS = ['Paro', 'Thimphu', 'Punakha', 'Gangtey'];

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
    options: { includeFestival: false, festivalName: '', festivalDate: '', penultimateProgram: 'taktsang' },
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




const COVER_IMAGE = '/images/hero-bhutan.png';

function fullProgramHtml(program: TourProgram) {
  const total = Math.max(1, diffTourDays(program.startDate, program.endDate));
  const programTitle = programNameFor(total, program.cities, program.options);
  const duration = total + ' วัน ' + Math.max(0, total - 1) + ' คืน';
  const penultimateProgram = getPenultimateProgram(program.options);
  const finalHighlight = penultimateProgram === 'haa' ? 'ฮา' : 'ทักซัง';
  const route = programTitle === 'THE ULTIMATE BHUTAN'
    ? 'พาโร · ทิมพู · พูนาคา · กังเต · ' + finalHighlight
    : programTitle === 'Custom to Bhutan'
      ? (program.cities.join(' · ') + ' · พาโร · ' + finalHighlight)
      : 'พาโร · ทิมพู · พูนาคา · ' + finalHighlight;

  const flightOut = (program.outboundFlight.flightNo || '-') + '  ' + (program.outboundFlight.departureTime || '-') + ' – ' + (program.outboundFlight.arrivalTime || '-');
  const flightBack = (program.inboundFlight.flightNo || '-') + '  ' + (program.inboundFlight.departureTime || '-') + ' – ' + (program.inboundFlight.arrivalTime || '-');
  const dayStories = storyPlacesForProgram(program.days);

  const overviewRows = program.days.map((day, index) =>
    '<div class="route-row">' +
      '<div class="route-no">0' + (index + 1) + '</div>' +
      '<div class="route-date">' + escapeHtml(formatTravelDate(day.date)) + '</div>' +
      '<div class="route-copy"><h3>' + escapeHtml(day.title) + '</h3><p>' + escapeHtml(dayJourneyLead(day)) + '</p></div>' +
    '</div>'
  ).join('');

  const journeyOverview =
    '<section class="page overview-page">' +
      '<header class="sheet-header">' +
        '<div class="brand-lockup"><img src="/images/bhutan-center-logo.png" alt="Bhutan Center"><span><b>BHUTAN CENTER</b><small>OMG EXPERIENCE</small></span></div>' +
        '<span class="edition">PRIVATE JOURNEY · ' + escapeHtml(duration) + '</span>' +
      '</header>' +
      '<div class="overview-title">' +
        '<small>YOUR JOURNEY THROUGH BHUTAN</small>' +
        '<h2>เส้นทางที่ค่อย ๆ พาเรา<br>รู้จักภูฏานทีละเมือง</h2>' +
        '<p>เราเรียงลำดับการเดินทางตามเวลาเที่ยวบิน ระยะทางจริง และจังหวะของแต่ละเมือง เพื่อให้ทุกวันมีเรื่องราวต่อเนื่องกัน โดยไม่เร่งจนเสียบรรยากาศของภูฏาน</p>' +
      '</div>' +
      '<div class="route-table">' + overviewRows + '</div>' +
      '<div class="overview-note"><b>TRAVEL PHILOSOPHY</b><span>เที่ยวให้ครบ ไม่จำเป็นต้องเที่ยวให้รีบ — คืนสุดท้ายกลับมาพักที่พาโรเสมอ เพื่อให้วันเดินทางกลับเป็นไปอย่างสบายที่สุด</span></div>' +
      '<footer><span>BHUTAN CENTER</span><span>www.bhutancenter.com</span><span>LICENSE 11/07261</span></footer>' +
    '</section>';

  const dayPages = program.days.map((day, dayIndex) => {
    const places = dayStories[dayIndex] || [];
    const hero = places[0];
    const supporting = places.slice(1, 3);

    const activityRows = day.activities.slice(0, 7).map((item, index) =>
      '<div class="activity-row"><span>0' + (index + 1) + '</span><p>' + escapeHtml(activityParagraph(item)) + '</p></div>'
    ).join('');

    const supportingHtml = supporting.length
      ? '<div class="feature-grid ' + (supporting.length === 1 ? 'single' : '') + '">' +
          supporting.map((place) =>
            '<article class="feature-card">' +
              '<div class="feature-image"><img src="' + escapeHtml(place.image) + '" alt="' + escapeHtml(place.title) + '"></div>' +
              '<div class="feature-copy"><small>' + escapeHtml(place.eyebrow) + '</small><h3>' + escapeHtml(place.title) + '</h3><p>' + escapeHtml(place.story) + '</p></div>' +
            '</article>'
          ).join('') +
        '</div>'
      : '';

    const mealTags =
      (day.meals.breakfast ? '<span>Breakfast</span>' : '') +
      (day.meals.lunch ? '<span>Lunch</span>' : '') +
      (day.meals.dinner ? '<span>Dinner</span>' : '');

    return '<section class="page day-page">' +
      '<div class="day-hero">' +
        '<img src="' + escapeHtml(hero?.image || COVER_IMAGE) + '" alt="' + escapeHtml(hero?.title || day.title) + '">' +
        '<div class="day-hero-shade"></div>' +
        '<div class="day-topline"><span>BHUTAN CENTER</span><span>DAY ' + day.dayNumber + '</span></div>' +
        '<div class="day-heading">' +
          '<small>' + escapeHtml(formatTravelDate(day.date)) + '</small>' +
          '<h2>' + escapeHtml(day.title) + '</h2>' +
          '<p>' + escapeHtml(dayJourneyLead(day)) + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="day-content">' +
        '<section class="day-intro">' +
          '<div class="intro-label">THE STORY OF TODAY</div>' +
          '<div><small>' + escapeHtml(hero?.eyebrow || 'BHUTAN') + '</small><h3>' + escapeHtml(hero?.title || day.city) + '</h3><p>' + escapeHtml(hero?.story || dayJourneyLead(day)) + '</p></div>' +
        '</section>' +
        supportingHtml +
        '<section class="itinerary-block">' +
          '<div class="itinerary-title"><small>ITINERARY</small><h3>วันนี้เราจะเดินทางอย่างไร</h3></div>' +
          '<div class="activity-list">' + activityRows + '</div>' +
        '</section>' +
        '<div class="day-meta">' +
          '<div><small>OVERNIGHT</small><strong>' + escapeHtml(day.hotel || 'Bangkok') + '</strong></div>' +
          '<div><small>MEALS</small><div class="meal-list">' + mealTags + '</div></div>' +
          '<div><small>DESTINATION</small><strong>' + escapeHtml(day.city) + '</strong></div>' +
        '</div>' +
        (day.note ? '<div class="travel-note"><b>TRAVEL NOTE</b><span>' + escapeHtml(day.note) + '</span></div>' : '') +
      '</div>' +
      '<footer><span>BHUTAN CENTER</span><span>info@bhutancenter.com</span><span>52/38 Soi Saladaeng 2, Silom, Bangkok</span></footer>' +
    '</section>';
  }).join('');

  return '<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + escapeHtml(programTitle) + '</title>' +
    '<style>' +
      '@page{size:A4;margin:0}' +
      '*{box-sizing:border-box}' +
      'html,body{margin:0;padding:0;background:#d9d9d9;color:#1e2d28;font-family:Tahoma,Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
      'img{display:block;width:100%;height:100%;object-fit:cover}' +
      '.toolbar{position:sticky;top:0;z-index:100;display:flex;gap:10px;justify-content:center;padding:12px;background:#163b31;box-shadow:0 8px 24px rgba(0,0,0,.18)}' +
      '.toolbar button{border:0;border-radius:999px;padding:11px 20px;font-size:13px;font-weight:800;cursor:pointer}.toolbar .primary{background:#c89a4b;color:#fff}.toolbar .secondary{background:#fff;color:#163b31}' +
      '.page{width:210mm;height:297mm;margin:14px auto;background:#fff;position:relative;overflow:hidden;page-break-after:always;box-shadow:0 12px 40px rgba(0,0,0,.14)}' +
      '.cover{background:#12382f;color:#fff}' +
      '.cover-photo{position:absolute;inset:0;height:205mm}.cover-photo img{position:absolute;inset:0}.cover-photo:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,30,25,.05),rgba(10,30,25,.12) 44%,rgba(18,56,47,.9) 82%,#12382f 100%)}' +
      '.cover-top{position:absolute;z-index:3;top:14mm;left:15mm;right:15mm;display:flex;justify-content:space-between;align-items:center}.cover-logo{display:flex;gap:9px;align-items:center}.cover-logo img{width:17mm;height:17mm;border-radius:50%;background:#fff;padding:2mm;object-fit:contain}.cover-logo b{display:block;font-size:16px;letter-spacing:.06em}.cover-logo span{display:block;font-size:8px;opacity:.72;margin-top:2px}.cover-badge{font-size:9px;letter-spacing:.16em;font-weight:800;border-bottom:1px solid rgba(255,255,255,.55);padding-bottom:3px}' +
      '.cover-title{position:absolute;z-index:3;left:15mm;right:15mm;top:111mm;max-width:155mm}.cover-title .eyebrow{font-size:9px;letter-spacing:.24em;font-weight:800;color:#e8c47c}.cover-title h1{font-family:Georgia,serif;font-size:38px;line-height:1;margin:7px 0 5px}.cover-title h2{font-size:22px;margin:0;color:#edcc8d}.cover-title .route{font-size:13px;margin-top:8px;font-weight:700}' +
      '.cover-info{position:absolute;z-index:3;left:15mm;right:15mm;bottom:15mm;background:#fff;color:#26352f;padding:8mm 9mm;display:grid;grid-template-columns:1.15fr .85fr;gap:10mm}.cover-info h3{font-size:13px;margin:0 0 6px;color:#183d32;letter-spacing:.05em}.info-list{display:grid;gap:4px;font-size:10px}.info-row{display:grid;grid-template-columns:34mm 1fr;gap:5px}.info-row b{color:#9a743d}.flight-box{display:grid;gap:6px;border-left:1px solid #ddd5c8;padding-left:8mm}.flight{padding:3mm 0}.flight+ .flight{border-top:1px solid #e7e1d8}.flight small{font-size:7px;letter-spacing:.14em;color:#a47936;font-weight:900}.flight strong{display:block;font-size:12px;margin-top:3px}.flight span{display:block;font-size:8px;color:#7b817e;margin-top:2px}' +
      '.sheet-header{display:flex;align-items:center;justify-content:space-between;padding:12mm 15mm 0}.brand-lockup{display:flex;gap:8px;align-items:center}.brand-lockup img{width:13mm;height:13mm;object-fit:contain}.brand-lockup b{display:block;font-size:13px;color:#193c32}.brand-lockup small{display:block;font-size:7px;color:#8b8d89}.edition{font-size:8px;letter-spacing:.16em;color:#9b7a48;font-weight:800}' +
      '.overview-title{padding:14mm 15mm 7mm;max-width:175mm}.overview-title>small{font-size:8px;letter-spacing:.17em;color:#a77735;font-weight:900}.overview-title h2{font-family:Georgia,serif;font-size:31px;line-height:1.1;margin:4px 0 6px;color:#1b3d33}.overview-title p{font-size:11.5px;line-height:1.75;color:#5d6863;margin:0;max-width:155mm}' +
      '.route-table{margin:4mm 15mm 0;border-top:2px solid #1a4035}.route-row{display:grid;grid-template-columns:14mm 28mm 1fr;gap:5mm;padding:6mm 0;border-bottom:1px solid #d9ddd9;align-items:start}.route-no{font-family:Georgia,serif;font-size:19px;color:#b17d35}.route-date{font-size:8px;letter-spacing:.08em;color:#8b928e;padding-top:2px}.route-copy h3{font-family:Georgia,serif;font-size:18px;margin:0 0 3px;color:#223a32}.route-copy p{font-size:9.5px;line-height:1.55;color:#68716d;margin:0;max-width:125mm}' +
      '.overview-note{position:absolute;left:15mm;right:15mm;bottom:16mm;border-top:1px solid #c9b48f;padding-top:4mm;display:grid;grid-template-columns:37mm 1fr;gap:5mm;font-size:9.5px;line-height:1.5;color:#666e6a}.overview-note b{font-size:8px;letter-spacing:.12em;color:#a67534}' +
      '.day-hero{height:105mm;position:relative;background:#183a31}.day-hero>img{position:absolute;inset:0}.day-hero-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(12,23,19,.06),rgba(12,23,19,.12) 42%,rgba(12,28,23,.78) 100%)}.day-topline{position:absolute;left:15mm;right:15mm;top:10mm;display:flex;justify-content:space-between;color:#fff;font-size:8px;letter-spacing:.14em;font-weight:800}.day-heading{position:absolute;left:15mm;right:15mm;bottom:10mm;color:#fff;max-width:165mm}.day-heading small{font-size:8px;letter-spacing:.15em;font-weight:900;color:#efcf8e}.day-heading h2{font-family:Georgia,serif;font-size:30px;line-height:1.02;margin:4px 0 5px}.day-heading p{font-size:11px;line-height:1.55;margin:0;max-width:150mm;color:#f1f3f1}' +
      '.day-content{height:181mm;padding:8mm 15mm 14mm;position:relative}.day-intro{display:grid;grid-template-columns:36mm 1fr;gap:8mm;padding-bottom:5mm;border-bottom:1px solid #d9dedb}.intro-label{font-size:8px;letter-spacing:.15em;color:#aa7835;font-weight:900;padding-top:2px}.day-intro small,.feature-copy small,.itinerary-title small,.day-meta small{font-size:7.5px;letter-spacing:.13em;color:#9b753e;font-weight:900}.day-intro h3{font-family:Georgia,serif;font-size:22px;margin:3px 0 4px;color:#1d3d33}.day-intro p{font-size:10.2px;line-height:1.6;color:#5f6864;margin:0}' +
      '.feature-grid{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:5mm}.feature-grid.single{grid-template-columns:1fr}.feature-card{display:grid;grid-template-rows:37mm auto;min-height:72mm;border:1px solid #dfe2df;background:#fff}.feature-grid.single .feature-card{grid-template-columns:72mm 1fr;grid-template-rows:none;min-height:50mm}.feature-image{min-height:0}.feature-copy{padding:4mm 4.5mm}.feature-copy h3{font-family:Georgia,serif;font-size:16px;margin:2px 0 3px;color:#213b32}.feature-copy p{font-size:8.8px;line-height:1.5;color:#626b67;margin:0}' +
      '.itinerary-block{display:grid;grid-template-columns:50mm 1fr;gap:8mm;margin-top:6mm;padding-top:5mm;border-top:1px solid #1f4438}.itinerary-title h3{font-family:Georgia,serif;font-size:17px;margin:2px 0;color:#203b32}.activity-list{display:grid}.activity-row{display:grid;grid-template-columns:8mm 1fr;gap:3mm;padding:2.2mm 0;border-bottom:1px solid #e6e8e6}.activity-row span{font-family:Georgia,serif;font-size:9px;color:#b07c35}.activity-row p{font-size:8.5px;line-height:1.45;color:#515d58;margin:0}' +
      '.day-meta{position:absolute;left:15mm;right:15mm;bottom:12mm;display:grid;grid-template-columns:1fr 1fr 1fr;gap:7mm;border-top:1px solid #d8ddd9;padding-top:4mm}.day-meta strong{display:block;font-size:10px;color:#203d33;margin-top:2px}.meal-list{display:flex;gap:2mm;flex-wrap:wrap;margin-top:2px}.meal-list span{font-size:7px;color:#fff;background:#20483b;padding:1.3mm 2mm;border-radius:999px}.travel-note{position:absolute;left:15mm;right:15mm;bottom:5.5mm;font-size:7.5px;color:#737c77}.travel-note b{color:#a77735;margin-right:5px}' +
      'footer{position:absolute;left:15mm;right:15mm;bottom:4mm;display:flex;justify-content:space-between;border-top:1px solid #dfe2df;padding-top:2mm;color:#898f8b;font-size:6.8px}.cover footer{color:rgba(255,255,255,.7);border-color:rgba(255,255,255,.25)}' +
      '@media print{html,body{background:#fff}.toolbar{display:none}.page{margin:0;box-shadow:none;page-break-after:always}.page:last-child{page-break-after:auto}}' +
    '</style></head><body>' +
      '<div class="toolbar"><button class="primary" onclick="window.print()">พิมพ์ / บันทึกเป็น PDF</button><button class="secondary" onclick="window.close()">ปิด</button></div>' +
      '<section class="page cover">' +
        '<div class="cover-photo"><img src="' + COVER_IMAGE + '" alt="Bhutan landscape"></div>' +
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
            '<div class="info-row"><b>Date of Travel</b><span>' + escapeHtml(formatTravelDate(program.startDate)) + ' – ' + escapeHtml(formatTravelDate(program.endDate)) + '</span></div>' +
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
      journeyOverview + dayPages +
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
      const titled = { ...next, title: programNameFor(total, next.cities, next.options) };
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
          <label className="field"><span>ชื่อโปรแกรม</span><input value={editing.title} readOnly/><small>4D3N = JOURNEY TO BHUTAN · 5D4N = WONDERS OF BHUTAN · 6D5N = THE ULTIMATE BHUTAN · หากเปลี่ยนวันก่อนกลับเป็น Haa หรือปรับเส้นทาง = Custom to Bhutan</small></label>
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
        <div className="field">
  <span>เมืองหลักในทริป</span>
  <div className="tour-city-picker">{CITY_OPTIONS.map((city) => <button key={city} type="button" className={editing.cities.includes(city) ? 'active' : ''} onClick={() => toggleCity(city)}>{city}</button>)}</div>
  <small>เลือกเมืองหลักที่ต้องการเดินทาง: Paro / Thimphu / Punakha / Gangtey</small>
</div>
<div className="field">
  <span>โปรแกรมวันก่อนเดินทางกลับ</span>
  <div className="tour-city-picker">
    <button type="button" className={getPenultimateProgram(editing.options) === 'taktsang' ? 'active' : ''} onClick={() => rebuild({ options: { ...editing.options, penultimateProgram: 'taktsang' } })}>Taktsang / Tiger’s Nest</button>
    <button type="button" className={getPenultimateProgram(editing.options) === 'haa' ? 'active' : ''} onClick={() => rebuild({ options: { ...editing.options, penultimateProgram: 'haa' } })}>Haa Valley</button>
  </div>
  <small>{getPenultimateProgram(editing.options) === 'haa' ? 'Day ก่อนกลับ: Paro → Haa → Paro และกลับมาพักคืนสุดท้ายที่ Paro' : 'Day ก่อนกลับ: Paro → Taktsang และพักคืนสุดท้ายที่ Paro'}</small>
</div>
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
