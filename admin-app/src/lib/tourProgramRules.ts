import { TourAttraction, TourFestival, TourProgram, TourProgramDay } from '../types';

export const STANDARD_CITIES: Record<number, string[]> = {
  4: ['Paro', 'Thimphu', 'Punakha'],
  5: ['Paro', 'Thimphu', 'Punakha'],
  6: ['Paro', 'Thimphu', 'Punakha', 'Gangtey'],
};

type MainCity = 'Paro' | 'Thimphu' | 'Punakha' | 'Gangtey' | 'Haa';
type ProgramInput = Pick<TourProgram, 'startDate' | 'endDate' | 'cities' | 'outboundFlight' | 'inboundFlight' | 'options' | 'selectedFestivalIds'>;
export type PenultimateProgram = 'taktsang' | 'haa';
type DaySeed = { city: string; title: string; activities: string[]; overnight: string; note?: string };

const CITY_ORDER: MainCity[] = ['Paro', 'Thimphu', 'Punakha', 'Gangtey', 'Haa'];

const ATTRACTIONS: Record<MainCity, string[]> = {
  Paro: ['Rinpung Dzong', 'National Museum of Bhutan', 'Kyichu Lhakhang', 'Paro Street Shopping (City Center)'],
  Thimphu: ['Buddha Dordenma', 'Memorial Chorten', 'Tashichho Dzong', 'Takin Zoo', 'National Library', 'National Post Office', 'Sangaygang View Point'],
  Punakha: ['Chimi Lhakhang', 'Punakha Dzong', 'Punakha Suspension Bridge'],
  Gangtey: ['Gangtey Monastery', 'Phobjikha Valley', 'Black-necked Crane Centre'],
  Haa: ['Chele La Pass', 'Haa Valley', 'Lhakhang Karpo'],
};

const DRIVE_HOURS: Record<string, number> = {
  'Paro>Paro': 0,
  'Paro>Thimphu': 1.5,
  'Thimphu>Paro': 1.5,
  'Thimphu>Thimphu': 0,
  'Thimphu>Punakha': 2.5,
  'Punakha>Thimphu': 2.5,
  'Punakha>Punakha': 0,
  'Punakha>Gangtey': 2.5,
  'Gangtey>Punakha': 2.5,
  'Gangtey>Gangtey': 0,
  'Gangtey>Thimphu': 4.5,
  'Thimphu>Gangtey': 4.5,
  'Punakha>Paro': 4,
  'Paro>Punakha': 4,
  'Gangtey>Paro': 6,
  'Paro>Gangtey': 6,
  'Paro>Haa': 3.5,
  'Haa>Paro': 3.5,
  'Haa>Haa': 0,
  'Thimphu>Haa': 5,
  'Haa>Thimphu': 5,
  'Punakha>Haa': 6,
  'Haa>Punakha': 6,
  'Gangtey>Haa': 7,
  'Haa>Gangtey': 7,
};

const uid = (prefix: string) => prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

const addDays = (date: string, offset: number) => {
  if (!date) return '';
  const d = new Date(date + 'T12:00:00');
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

export const diffTourDays = (start: string, end: string) => {
  if (!start || !end) return 0;
  return Math.max(1, Math.round((new Date(end + 'T12:00:00').getTime() - new Date(start + 'T12:00:00').getTime()) / 86400000) + 1);
};

const hourFromTime = (value?: string) => {
  if (!value) return null;
  const match = value.match(/(\d{1,2}):(\d{2})/);
  return match ? Number(match[1]) : null;
};

const sameCities = (a: string[], b: string[]) => a.length === b.length && b.every((city) => a.includes(city));

const driveHours = (from: string, to: string) => {
  if (from === to) return 0;
  return DRIVE_HOURS[from + '>' + to] ?? 4;
};

const travelTimeText = (hours: number) => {
  if (!hours) return '';
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  const parts = [];
  if (whole) parts.push(whole + ' ชม.');
  if (minutes) parts.push(minutes + ' นาที');
  return parts.join(' ');
};

const toMainCity = (value: string): MainCity | null => CITY_ORDER.includes(value as MainCity) ? value as MainCity : null;

const selectedMainCities = (cities: string[]): MainCity[] => {
  const selected = CITY_ORDER.filter((city) => cities.includes(city));
  return selected.includes('Paro') ? selected : ['Paro', ...selected];
};

export function getPenultimateProgram(options?: Record<string, unknown>): PenultimateProgram {
  return options?.penultimateProgram === 'haa' ? 'haa' : 'taktsang';
}

export function getFestivalCity(options?: Record<string, unknown>): MainCity {
  const explicit = toMainCity(String(options?.festivalCity || ''));
  if (explicit) return explicit;
  const name = String(options?.festivalName || '').toLowerCase();
  if (name.includes('punakha')) return 'Punakha';
  if (name.includes('thimphu')) return 'Thimphu';
  if (name.includes('gangtey') || name.includes('phobjikha')) return 'Gangtey';
  return 'Paro';
}

export function programNameFor(totalDays: number, cities: string[], options?: Record<string, unknown>) {
  const standard = STANDARD_CITIES[totalDays];
  if (getPenultimateProgram(options) === 'haa' || Boolean(options?.includeFestival)) return 'Custom to Bhutan';
  if (!standard || !sameCities(cities, standard)) return 'Custom to Bhutan';
  if (totalDays === 4) return 'JOURNEY TO BHUTAN';
  if (totalDays === 5) return 'WONDERS OF BHUTAN';
  if (totalDays === 6) return 'THE ULTIMATE BHUTAN';
  return 'Custom to Bhutan';
}

function standardSeeds(totalDays: number, penultimateProgram: PenultimateProgram): DaySeed[] | null {
  if (totalDays === 4) {
    const seeds: DaySeed[] = [
      { city: 'Thimphu', title: 'Bangkok – Paro – Thimphu', overnight: 'Thimphu', activities: ['เดินทางถึงสนามบินพาโร ผ่านพิธีการตรวจคนเข้าเมือง และพบไกด์ท้องถิ่น', 'Rinpung Dzong', 'National Museum of Bhutan', 'เดินทางต่อสู่ Thimphu', 'Buddha Dordenma', 'Takin Zoo', 'National Library', 'Memorial Chorten', 'Tashichho Dzong'] },
      { city: 'Thimphu', title: 'Thimphu – Punakha – Thimphu', overnight: 'Thimphu', activities: ['Simtokha Dzong', 'Dochula Pass', 'Chimi Lhakhang', 'Punakha Dzong', 'Punakha Suspension Bridge', 'เดินทางกลับ Thimphu'] },
      { city: 'Paro', title: 'Thimphu – Paro – Taktsang', overnight: 'Paro', activities: ['เดินทางกลับสู่ Paro', 'Taktsang Monastery or Tiger’s Nest', 'Lunch at Taktsang Cafeteria'] },
      { city: 'Paro', title: 'Paro – Bangkok', overnight: '', activities: ['Kyichu Lhakhang', 'Paro Street Shopping (City Center)', 'เดินทางสู่สนามบินพาโรเพื่อเดินทางกลับกรุงเทพฯ'] },
    ];
    if (penultimateProgram === 'haa') {
      seeds[2] = { city: 'Haa', title: 'Thimphu – Haa – Paro', overnight: 'Paro', activities: ['Chele La Pass', 'Haa Valley', 'Lhakhang Karpo', 'เดินทางกลับสู่ Paro'], note: 'เดินทางกลับมาพักที่ Paro ในคืนสุดท้ายก่อนวันเดินทางกลับ' };
    }
    return seeds;
  }

  if (totalDays === 5) {
    const seeds: DaySeed[] = [
      { city: 'Thimphu', title: 'Bangkok – Paro – Thimphu', overnight: 'Thimphu', activities: ['เดินทางถึงสนามบินพาโร ผ่านพิธีการตรวจคนเข้าเมือง และพบไกด์ท้องถิ่น', 'Rinpung Dzong', 'National Museum of Bhutan', 'เดินทางต่อสู่ Thimphu', 'Buddha Dordenma', 'National Library', 'National Post Office', 'Memorial Chorten'] },
      { city: 'Punakha', title: 'Thimphu – Punakha', overnight: 'Punakha', activities: ['Sangaygang View Point', 'Takin Zoo', 'Dochula Pass', 'Chimi Lhakhang', 'Punakha Dzong', 'Punakha Suspension Bridge'] },
      { city: 'Paro', title: 'Punakha – Thimphu – Paro', overnight: 'Paro', activities: ['เดินทางกลับผ่าน Thimphu', 'Simtokha Dzong', 'เดินทางต่อสู่ Paro', 'Chuzom Bridge'] },
      { city: 'Paro', title: 'Paro – Taktsang', overnight: 'Paro', activities: ['Taktsang Monastery or Tiger’s Nest', 'Lunch at Taktsang Cafeteria'] },
      { city: 'Paro', title: 'Paro – Bangkok', overnight: '', activities: ['Kyichu Lhakhang', 'Paro Street Shopping (City Center)', 'เดินทางสู่สนามบินพาโรเพื่อเดินทางกลับกรุงเทพฯ'] },
    ];
    if (penultimateProgram === 'haa') {
      seeds[3] = { city: 'Haa', title: 'Paro – Haa – Paro', overnight: 'Paro', activities: ['Chele La Pass', 'Haa Valley', 'Lhakhang Karpo', 'เดินทางกลับสู่ Paro'], note: 'กลับมาพักที่ Paro ในคืนสุดท้ายก่อนวันเดินทางกลับ' };
    }
    return seeds;
  }

  if (totalDays === 6) {
    const seeds: DaySeed[] = [
      { city: 'Thimphu', title: 'Bangkok – Paro – Thimphu', overnight: 'Thimphu', activities: ['เดินทางถึงสนามบินพาโร ผ่านพิธีการตรวจคนเข้าเมือง และพบไกด์ท้องถิ่น', 'เดินทางต่อสู่ Thimphu', 'Tashichho Dzong', 'Memorial Chorten'] },
      { city: 'Punakha', title: 'Thimphu – Punakha', overnight: 'Punakha', activities: ['Dochula Pass', 'Chimi Lhakhang', 'Punakha Dzong', 'Punakha Suspension Bridge'] },
      { city: 'Gangtey', title: 'Punakha – Gangtey', overnight: 'Gangtey', activities: ['เดินทางสู่ Gangtey', 'Gangtey Monastery', 'Phobjikha Valley'] },
      { city: 'Paro', title: 'Gangtey – Thimphu – Paro', overnight: 'Paro', activities: ['เดินทางกลับผ่าน Thimphu', 'Buddha Dordenma', 'Sangaygang View Point', 'Takin Zoo', 'National Post Office', 'เดินทางต่อสู่ Paro', 'Kyichu Lhakhang'] },
      { city: 'Paro', title: 'Paro – Taktsang', overnight: 'Paro', activities: ['Taktsang Monastery or Tiger’s Nest', 'Lunch at Taktsang Cafeteria'] },
      { city: 'Paro', title: 'Paro – Bangkok', overnight: '', activities: ['Rinpung Dzong', 'National Museum of Bhutan', 'Paro Street Shopping (City Center)', 'เดินทางสู่สนามบินพาโรเพื่อเดินทางกลับกรุงเทพฯ'] },
    ];
    if (penultimateProgram === 'haa') {
      seeds[4] = { city: 'Haa', title: 'Paro – Haa – Paro', overnight: 'Paro', activities: ['Chele La Pass', 'Haa Valley', 'Lhakhang Karpo', 'เดินทางกลับสู่ Paro'], note: 'กลับมาพักที่ Paro ในคืนสุดท้ายก่อนวันเดินทางกลับ' };
    }
    return seeds;
  }

  return null;
}

type PlannerState = {
  city: MainCity;
  mask: number;
  score: number;
  path: MainCity[];
};

function planCoreCities(
  days: number,
  selected: MainCity[],
  festivalDayIndex: number,
  festivalCity: MainCity,
  arrivalHour: number | null,
): MainCity[] {
  if (days <= 0) return [];
  const cities = Array.from(new Set<MainCity>([...selected, festivalCity, 'Paro']));
  const selectedMask = selected.reduce((mask, city) => mask | (1 << CITY_ORDER.indexOf(city)), 0);
  const states = new Map<string, PlannerState>();
  states.set('Paro|0', { city: 'Paro', mask: 1 << CITY_ORDER.indexOf('Paro'), score: 0, path: [] });

  for (let day = 0; day < days; day += 1) {
    const nextStates = new Map<string, PlannerState>();
    const isFestivalDay = day === festivalDayIndex;
    const isLastCoreDay = day === days - 1;

    for (const state of states.values()) {
      for (const city of cities) {
        if (isFestivalDay && city !== festivalCity) continue;
        if (isLastCoreDay && city !== 'Paro') continue;

        const travel = driveHours(state.city, city);
        if (day === 0 && arrivalHour !== null) {
          if (arrivalHour >= 14 && city !== 'Paro') continue;
          if (arrivalHour >= 11 && travel > 2) continue;
        }

        const bit = 1 << CITY_ORDER.indexOf(city);
        const isNewSelected = selected.includes(city) && (state.mask & bit) === 0;
        let score = state.score - travel * 6;
        if (isNewSelected) score += 55;
        if (state.city === city) score += ATTRACTIONS[city].length >= 5 ? 5 : 1;
        if (city === 'Paro' && !isFestivalDay && !isLastCoreDay) score -= 5;
        if (travel > 4) score -= 12;
        if (isFestivalDay) score += 80;

        const mask = state.mask | bit;
        const key = city + '|' + mask;
        const candidate: PlannerState = { city, mask, score, path: [...state.path, city] };
        const existing = nextStates.get(key);
        if (!existing || candidate.score > existing.score) nextStates.set(key, candidate);
      }
    }

    states.clear();
    for (const [key, value] of nextStates) states.set(key, value);
  }

  const candidates = [...states.values()].filter((state) => state.city === 'Paro');
  const complete = candidates.filter((state) => (state.mask & selectedMask) === selectedMask);
  const best = (complete.length ? complete : candidates).sort((a, b) => b.score - a.score)[0];
  return best?.path || Array.from({ length: days }, (_, index) => index === days - 1 ? 'Paro' : selected[Math.min(index, selected.length - 1)] || 'Paro');
}

function takeUnused(city: MainCity, used: Set<string>, count: number) {
  const result: string[] = [];
  for (const place of ATTRACTIONS[city]) {
    if (used.has(place)) continue;
    used.add(place);
    result.push(place);
    if (result.length >= count) break;
  }
  return result;
}

function transitActivities(from: MainCity, to: MainCity, used: Set<string>) {
  const result: string[] = [];
  const pair = from + '>' + to;
  if ((pair === 'Thimphu>Punakha' || pair === 'Punakha>Thimphu') && !used.has('Dochula Pass')) {
    used.add('Dochula Pass');
    result.push('Dochula Pass');
  }
  if (pair === 'Punakha>Thimphu' && !used.has('Simtokha Dzong')) {
    used.add('Simtokha Dzong');
    result.push('Simtokha Dzong');
  }
  if ((pair === 'Paro>Thimphu' || pair === 'Thimphu>Paro') && !used.has('Chuzom Bridge')) {
    used.add('Chuzom Bridge');
    result.push('Chuzom Bridge');
  }
  return result;
}

function smartCustomSeeds(program: ProgramInput, totalDays: number, penultimateProgram: PenultimateProgram, catalog: TourAttraction[] = [], festivals: TourFestival[] = []): DaySeed[] {
  if (totalDays <= 1) return [{ city: 'Paro', title: 'Paro – Bangkok', overnight: '', activities: ['เดินทางสู่สนามบินพาโรเพื่อเดินทางกลับกรุงเทพฯ'] }];

  const requiredIds = Array.isArray(program.options?.requiredAttractionIds) ? program.options.requiredAttractionIds.map(String) : [];
  const requiredAttractions = catalog.filter((item) => requiredIds.includes(item.id) && item.isActive !== false);
  const requiredCities = requiredAttractions.map((item) => item.city);
  const selected = selectedMainCities([...program.cities, ...requiredCities]);
  const includeFestival = Boolean(program.options?.includeFestival);
  const selectedFestival = festivals.find((item) => program.selectedFestivalIds?.includes(item.id)) || null;
  const festivalDate = includeFestival ? String(program.options?.festivalDate || '') : '';
  const festivalName = includeFestival ? String(selectedFestival?.name || program.options?.festivalName || '').trim() : '';
  const festivalCity = toMainCity(String(selectedFestival?.city || '')) || getFestivalCity(program.options);
  const festivalVenue = selectedFestival?.venueAttractionId ? catalog.find((item) => item.id === selectedFestival.venueAttractionId) : null;
  const arrivalHour = hourFromTime(program.outboundFlight.arrivalTime);

  let specialIndex = totalDays - 2;
  const festivalIndex = festivalDate
    ? Array.from({ length: totalDays }, (_, index) => addDays(program.startDate, index)).findIndex((date) => date === festivalDate)
    : -1;

  if (festivalIndex === specialIndex && totalDays >= 4) specialIndex = totalDays - 3;

  const departureIndex = totalDays - 1;
  const coreIndices = Array.from({ length: totalDays }, (_, index) => index)
    .filter((index) => index !== specialIndex && index !== departureIndex);

  const coreFestivalIndex = festivalIndex >= 0 ? coreIndices.indexOf(festivalIndex) : -1;
  const corePath = planCoreCities(coreIndices.length, selected, coreFestivalIndex, festivalCity, arrivalHour);
  const cityByDay = new Map<number, MainCity>();
  coreIndices.forEach((dayIndex, pathIndex) => cityByDay.set(dayIndex, corePath[pathIndex] || 'Paro'));

  cityByDay.set(specialIndex, 'Paro');
  cityByDay.set(departureIndex, 'Paro');

  const used = new Set<string>();
  const requiredRemaining = new Map<string, TourAttraction[]>();
  for (const item of requiredAttractions) {
    const list = requiredRemaining.get(item.city) || [];
    list.push(item);
    requiredRemaining.set(item.city, list);
  }
  const catalogByCity = new Map<string, TourAttraction[]>();
  for (const item of catalog.filter((x) => x.isActive !== false)) {
    const list = catalogByCity.get(item.city) || [];
    list.push(item);
    catalogByCity.set(item.city, list);
  }
  for (const list of catalogByCity.values()) list.sort((a,b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  const seeds: DaySeed[] = [];
  let currentCity: MainCity = 'Paro';

  for (let index = 0; index < totalDays; index += 1) {
    const date = addDays(program.startDate, index);
    const isFirst = index === 0;
    const isDeparture = index === departureIndex;
    const isSpecial = index === specialIndex;
    const isFestival = index === festivalIndex && includeFestival && Boolean(festivalName);

    if (isDeparture) {
      const departureHour = hourFromTime(program.inboundFlight.departureTime);
      const activities = departureHour !== null && departureHour <= 10
        ? ['เดินทางสู่สนามบินพาโรเพื่อเดินทางกลับกรุงเทพฯ']
        : [...takeUnused('Paro', used, departureHour !== null && departureHour <= 14 ? 1 : 2), 'เดินทางสู่สนามบินพาโรเพื่อเดินทางกลับกรุงเทพฯ'];
      seeds.push({ city: 'Paro', title: 'Paro – Bangkok', overnight: '', activities });
      continue;
    }

    if (isSpecial) {
      if (currentCity !== 'Paro') {
        const travel = driveHours(currentCity, 'Paro');
        seeds.push({
          city: 'Paro',
          title: currentCity + ' – Paro',
          overnight: 'Paro',
          activities: ['เดินทางกลับสู่ Paro'].concat(takeUnused('Paro', used, travel >= 4 ? 1 : 2)),
          note: 'ใช้เวลาเดินทางประมาณ ' + travelTimeText(travel) + ' และพักที่ Paro เพื่อเตรียมโปรแกรมวันถัดไป',
        });
        currentCity = 'Paro';
        continue;
      }

      if (penultimateProgram === 'haa') {
        seeds.push({
          city: 'Haa',
          title: 'Paro – Haa – Paro',
          overnight: 'Paro',
          activities: ['Chele La Pass', 'Haa Valley', 'Lhakhang Karpo', 'เดินทางกลับสู่ Paro'],
          note: 'เดินทางแบบไป–กลับจาก Paro และพักคืนสุดท้ายที่ Paro',
        });
      } else {
        used.add('Taktsang Monastery or Tiger’s Nest');
        seeds.push({
          city: 'Paro',
          title: 'Paro – Taktsang',
          overnight: 'Paro',
          activities: ['Taktsang Monastery or Tiger’s Nest', 'Lunch at Taktsang Cafeteria'],
          note: 'ใช้เวลาสำหรับ Taktsang เป็นกิจกรรมหลักของวัน และพักคืนสุดท้ายที่ Paro',
        });
      }
      currentCity = 'Paro';
      continue;
    }

    const target = cityByDay.get(index) || 'Paro';
    const travel = driveHours(currentCity, target);
    const activities: string[] = [];

    if (isFirst) activities.push('เดินทางถึงสนามบินพาโร ผ่านพิธีการตรวจคนเข้าเมือง และพบไกด์ท้องถิ่น');

    if (isFestival) {
      activities.push('เทศกาล: ' + festivalName);
      used.add('เทศกาล: ' + festivalName);
      if (festivalVenue && !used.has(festivalVenue.name)) {
        activities.push(festivalVenue.name);
        used.add(festivalVenue.name);
      }
    }

    activities.push(...transitActivities(currentCity, target, used));

    const dayStartMinutes = isFirst && arrivalHour !== null ? Math.max(0, arrivalHour * 60 + 90) : 9 * 60;
    const dayEndMinutes = 17 * 60 + 30;
    let sightseeingBudget = Math.max(0, dayEndMinutes - dayStartMinutes - Math.round(travel * 60) - (isFestival ? 240 : 0));

    const requiredHere = requiredRemaining.get(target) || [];
    for (const item of requiredHere) {
      if (!used.has(item.name)) {
        activities.push(item.name);
        used.add(item.name);
        sightseeingBudget = Math.max(0, sightseeingBudget - Math.max(15, item.durationMinutes || 90));
      }
    }
    requiredRemaining.delete(target);

    if (catalogByCity.size > 0) {
      const available = (catalogByCity.get(target) || []).filter((item) => !used.has(item.name));
      for (const item of available) {
        const duration = Math.max(15, item.durationMinutes || 90);
        if (duration > sightseeingBudget) continue;
        activities.push(item.name);
        used.add(item.name);
        sightseeingBudget -= duration;
        if (sightseeingBudget < 30) break;
      }
    } else {
      const sightseeingSlots = isFestival ? 0 : travel >= 4 ? 1 : travel >= 2.5 ? 2 : 3;
      activities.push(...takeUnused(target, used, sightseeingSlots));
    }

    if (currentCity !== target) {
      const travelText = 'เดินทางต่อสู่ ' + target;
      const arrivalMarkerIndex = isFirst ? 1 : 0;
      activities.splice(Math.min(arrivalMarkerIndex, activities.length), 0, travelText);
    }

    if (activities.length === 0) activities.push('พักผ่อนและเดินเล่นในเมือง ' + target + ' ตามอัธยาศัย');

    const title = isFirst
      ? (target === 'Paro' ? 'Bangkok – Paro' : 'Bangkok – Paro – ' + target)
      : isFestival
        ? target + ' · ' + festivalName
        : currentCity === target ? target : currentCity + ' – ' + target;

    const notes: string[] = [];
    if (travel > 0) notes.push('ใช้เวลาเดินทางประมาณ ' + travelTimeText(travel));
    if (requiredHere.length) notes.push('จัดสถานที่ที่ลูกค้าระบุเป็นลำดับสำคัญก่อนสถานที่อื่น');
    if (isFestival) notes.push('จัดเทศกาลเป็นกิจกรรมหลักของวัน และลดจำนวนสถานที่เที่ยวเพื่อไม่ให้โปรแกรมแน่นเกินไป');

    seeds.push({
      city: target,
      title,
      overnight: target,
      activities,
      note: notes.join(' · '),
    });
    currentCity = target;
  }

  return seeds;
}

export function generateTourProgramDays(program: ProgramInput, catalog: TourAttraction[] = [], festivals: TourFestival[] = []): TourProgramDay[] {
  const total = Math.max(1, diffTourDays(program.startDate, program.endDate));
  const standard = STANDARD_CITIES[total];
  const penultimateProgram = getPenultimateProgram(program.options);
  const hasFestival = Boolean(program.options?.includeFestival && program.options?.festivalDate && (program.options?.festivalName || program.selectedFestivalIds?.length));
  const isStandard = !hasFestival && Boolean(standard && sameCities(program.cities, standard));
  const seeds = isStandard
    ? (standardSeeds(total, penultimateProgram) || [])
    : smartCustomSeeds(program, total, penultimateProgram, catalog, festivals);

  const arrivalHour = hourFromTime(program.outboundFlight.arrivalTime);
  const departureHour = hourFromTime(program.inboundFlight.departureTime);

  return seeds.map((seed, index) => {
    const date = addDays(program.startDate, index);
    const isFirst = index === 0;
    const isLast = index === total - 1;
    let activities = Array.from(new Set(seed.activities));

    if (isFirst && arrivalHour !== null && arrivalHour >= 14) {
      const festival = activities.find((item) => item.startsWith('เทศกาล:'));
      const essentials = activities.filter((item) => item.includes('สนามบินพาโร') || item.includes('เดินทางต่อสู่'));
      activities = festival ? [...essentials, festival] : essentials;
    }

    if (isLast && departureHour !== null && departureHour <= 10) {
      activities = activities.filter((item) => item.includes('สนามบินพาโร'));
    }

    return {
      id: uid('day'),
      dayNumber: index + 1,
      date,
      city: seed.city,
      title: seed.title,
      activities,
      meals: {
        breakfast: !isFirst,
        lunch: !(isLast && departureHour !== null && departureHour <= 12),
        dinner: !isLast,
      },
      hotel: isLast ? '' : (seed.overnight ? seed.overnight + ' Hotel' : ''),
      note: seed.note || '',
    };
  });
}
