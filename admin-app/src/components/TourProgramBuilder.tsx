import React, { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, FileText, MapPinned, Plus, Printer, Save, Sparkles, Trash2 } from 'lucide-react';
import { CustomerTracking, HotelCategory, TourProgram, TourProgramDay, User } from '../types';

type Props = {
  currentUser: User;
  trackings: CustomerTracking[];
  programs: TourProgram[];
  onSave: (program: TourProgram) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

const CITY_OPTIONS = ['Paro', 'Thimphu', 'Punakha', 'Haa', 'Gangtey'];
const ATTRACTIONS: Record<string, string[]> = {
  Paro: ['Rinpung Dzong', 'National Museum of Bhutan', 'Kyichu Lhakhang', 'Tiger’s Nest Monastery'],
  Thimphu: ['Buddha Dordenma', 'Memorial Chorten', 'National Library', 'Centenary Farmers Market', 'National Post Office'],
  Punakha: ['Dochula Pass', 'Chimi Lhakhang', 'Punakha Dzong', 'Punakha Suspension Bridge'],
  Haa: ['Haa Valley', 'Lhakhang Karpo', 'Chele La Pass'],
  Gangtey: ['Gangtey Monastery', 'Phobjikha Valley', 'Black-necked Crane Centre'],
};

const uid = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const addDays = (date: string, offset: number) => {
  if (!date) return '';
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + offset);
  return isoDate(d);
};
const diffDays = (start: string, end: string) => {
  if (!start || !end) return 0;
  return Math.max(1, Math.round((new Date(`${end}T12:00:00`).getTime() - new Date(`${start}T12:00:00`).getTime()) / 86400000) + 1);
};
const hourFromTime = (value?: string) => {
  if (!value) return null;
  const match = value.match(/(\d{1,2}):(\d{2})/);
  return match ? Number(match[1]) : null;
};

function distributeCities(totalDays: number, cities: string[]) {
  const route = cities.length ? cities : ['Paro', 'Thimphu', 'Punakha'];
  return Array.from({ length: totalDays }, (_, index) => {
    if (index === 0) return route[0];
    if (index === totalDays - 1) return route[route.length - 1];
    const progress = index / Math.max(1, totalDays - 1);
    return route[Math.min(route.length - 1, Math.floor(progress * route.length))];
  });
}

function generateDays(program: Pick<TourProgram, 'startDate' | 'endDate' | 'cities' | 'outboundFlight' | 'inboundFlight' | 'options'>): TourProgramDay[] {
  const total = Math.max(1, diffDays(program.startDate, program.endDate));
  const route = distributeCities(total, program.cities);
  const arrivalHour = hourFromTime(program.outboundFlight.arrivalTime);
  const departureHour = hourFromTime(program.inboundFlight.departureTime);
  const festivalDate = String(program.options?.festivalDate || '');
  const festivalName = String(program.options?.festivalName || '');

  return route.map((city, index) => {
    const date = addDays(program.startDate, index);
    const nextCity = route[index + 1] || city;
    const isFirst = index === 0;
    const isLast = index === total - 1;
    let capacity = 3;
    if (isFirst && arrivalHour !== null) capacity = arrivalHour >= 14 ? 1 : arrivalHour >= 11 ? 2 : 3;
    if (isLast && departureHour !== null) capacity = departureHour <= 10 ? 0 : departureHour <= 14 ? 1 : 2;

    const activities = (ATTRACTIONS[city] || []).slice(0, capacity);
    if (festivalDate && date === festivalDate && festivalName) activities.unshift(`เทศกาล: ${festivalName}`);
    if (isFirst) activities.unshift('เดินทางถึงสนามบินพาโร ผ่านพิธีการตรวจคนเข้าเมือง และพบไกด์ท้องถิ่น');
    if (isLast) activities.push('เดินทางสู่สนามบินพาโรเพื่อเดินทางกลับกรุงเทพฯ');

    const transfer = !isLast && nextCity !== city ? `หลังจบการเที่ยว เดินทางต่อไปยัง ${nextCity}` : '';
    const title = isFirst ? `Arrival in Bhutan – ${city}`
      : isLast ? `${city} – Departure`
      : nextCity !== city ? `${city} – ${nextCity}`
      : city;

    return {
      id: uid('day'),
      dayNumber: index + 1,
      date,
      city,
      title,
      activities,
      meals: { breakfast: !isFirst, lunch: !(isLast && departureHour !== null && departureHour <= 12), dinner: !isLast },
      hotel: isLast ? '' : `${city} Hotel`,
      note: transfer,
    };
  });
}

function createProgram(currentUser: User): TourProgram {
  const start = isoDate(new Date());
  const end = addDays(start, 4);
  const seed: TourProgram = {
    id: uid('tp'),
    trackingId: '',
    customerName: '',
    title: 'Bhutan Private Journey',
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
  seed.days = generateDays(seed);
  return seed;
}

export function TourProgramBuilder({ currentUser, trackings, programs, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState<TourProgram>(() => programs[0] || createProgram(currentUser));
  const linkedTracking = useMemo(() => trackings.find((x) => x.id === editing.trackingId), [trackings, editing.trackingId]);
  const canFinalize = Boolean(linkedTracking?.bookingConfirmedAt && (linkedTracking?.visaReceivedAt || linkedTracking?.visaSentAt));
  const totalDays = Math.max(1, diffDays(editing.startDate, editing.endDate));

  const set = <K extends keyof TourProgram>(key: K, value: TourProgram[K]) => setEditing((prev) => ({ ...prev, [key]: value, updatedAt: new Date().toISOString() }));
  const rebuild = (patch?: Partial<TourProgram>) => {
    setEditing((prev) => {
      const next = { ...prev, ...patch, updatedAt: new Date().toISOString() };
      return { ...next, days: generateDays(next) };
    });
  };

  const setDuration = (days: number) => {
    if (!editing.startDate) return;
    rebuild({ endDate: addDays(editing.startDate, days - 1) });
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
        <button className="ghost-button" onClick={() => window.print()}><Printer/>พิมพ์ / PDF</button>
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
          <label className="field"><span>ชื่อโปรแกรม</span><input value={editing.title} onChange={(e) => set('title', e.target.value)}/></label>
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
        <div className="field"><span>เมืองที่ต้องการในทริป</span><div className="tour-city-picker">{CITY_OPTIONS.map((city) => <button key={city} type="button" className={editing.cities.includes(city) ? 'active' : ''} onClick={() => toggleCity(city)}>{city}</button>)}</div></div>
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
