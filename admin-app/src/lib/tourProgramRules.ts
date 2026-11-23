import { TourProgram, TourProgramDay } from '../types';

export const STANDARD_CITIES: Record<number, string[]> = {
  4: ['Paro', 'Thimphu', 'Punakha'],
  5: ['Paro', 'Thimphu', 'Punakha'],
  6: ['Paro', 'Thimphu', 'Punakha', 'Gangtey'],
};

const ATTRACTIONS: Record<string, string[]> = {
  Paro: ['Rinpung Dzong', 'National Museum of Bhutan', 'Kyichu Lhakhang', 'Tiger’s Nest Monastery'],
  Thimphu: ['Buddha Dordenma', 'Memorial Chorten', 'National Library', 'National Post Office', 'Takin Zoo', 'Tashichho Dzong'],
  Punakha: ['Dochula Pass', 'Chimi Lhakhang', 'Punakha Dzong', 'Punakha Suspension Bridge'],
  Haa: ['Haa Valley', 'Lhakhang Karpo', 'Chele La Pass'],
  Gangtey: ['Gangtey Monastery', 'Phobjikha Valley', 'Black-necked Crane Centre'],
};

type ProgramInput = Pick<TourProgram, 'startDate' | 'endDate' | 'cities' | 'outboundFlight' | 'inboundFlight' | 'options'>;
export type PenultimateProgram = 'taktsang' | 'haa';
type DaySeed = { city: string; title: string; activities: string[]; overnight: string; note?: string };

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

export function getPenultimateProgram(options?: Record<string, unknown>): PenultimateProgram {
  return options?.penultimateProgram === 'haa' ? 'haa' : 'taktsang';
}

export function programNameFor(totalDays: number, cities: string[], options?: Record<string, unknown>) {
  const standard = STANDARD_CITIES[totalDays];
  if (getPenultimateProgram(options) === 'haa') return 'Custom to Bhutan';
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
      { city: 'Paro', title: 'Thimphu – Paro – Taktsang', overnight: 'Paro', activities: ['เดินทางกลับสู่ Paro', 'Taktsang Monastery or Tiger’s Nest', 'Lunch at Taktsang Cafeteria', 'Taktsang Monastery or Tiger’s Nest'] },
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
      { city: 'Paro', title: 'Paro – Taktsang', overnight: 'Paro', activities: ['Taktsang Monastery or Tiger’s Nest', 'Lunch at Taktsang Cafeteria', 'Taktsang Monastery or Tiger’s Nest'] },
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
      { city: 'Paro', title: 'Paro – Taktsang', overnight: 'Paro', activities: ['Taktsang Monastery or Tiger’s Nest', 'Lunch at Taktsang Cafeteria', 'Taktsang Monastery or Tiger’s Nest'] },
      { city: 'Paro', title: 'Paro – Bangkok', overnight: '', activities: ['Rinpung Dzong', 'National Museum of Bhutan', 'Paro Street Shopping (City Center)', 'เดินทางสู่สนามบินพาโรเพื่อเดินทางกลับกรุงเทพฯ'] },
    ];
    if (penultimateProgram === 'haa') {
      seeds[4] = { city: 'Haa', title: 'Paro – Haa – Paro', overnight: 'Paro', activities: ['Chele La Pass', 'Haa Valley', 'Lhakhang Karpo', 'เดินทางกลับสู่ Paro'], note: 'กลับมาพักที่ Paro ในคืนสุดท้ายก่อนวันเดินทางกลับ' };
    }
    return seeds;
  }

  return null;
}

function customSeeds(totalDays: number, cities: string[], penultimateProgram: PenultimateProgram): DaySeed[] {
  const selected = cities.length ? cities : ['Paro', 'Thimphu', 'Punakha'];
  if (totalDays <= 1) return [{ city: 'Paro', title: 'Paro – Bangkok', overnight: '', activities: ['เดินทางสู่สนามบินพาโรเพื่อเดินทางกลับกรุงเทพฯ'] }];

  const seeds: DaySeed[] = [];
  const flexibleDays = Math.max(0, totalDays - 3);

  for (let i = 0; i < flexibleDays; i += 1) {
    const city = selected[Math.min(selected.length - 1, Math.floor((i * selected.length) / Math.max(1, flexibleDays)))];
    const next = selected[Math.min(selected.length - 1, Math.floor(((i + 1) * selected.length) / Math.max(1, flexibleDays)))];
    seeds.push({
      city,
      title: i === 0 ? 'Bangkok – Paro – ' + city : (city === next ? city : city + ' – ' + next),
      overnight: next || city,
      activities: i === 0
        ? ['เดินทางถึงสนามบินพาโร ผ่านพิธีการตรวจคนเข้าเมือง และพบไกด์ท้องถิ่น'].concat((ATTRACTIONS[city] || []).slice(0, 3))
        : (ATTRACTIONS[city] || []).slice(0, 4),
      note: next !== city ? 'เดินทางต่อไปยัง ' + next : '',
    });
  }

  if (totalDays >= 3) {
    const from = seeds.length ? seeds[seeds.length - 1].overnight : selected[0];
    seeds.push({
      city: 'Paro',
      title: (from || 'Bhutan') + ' – Paro',
      overnight: 'Paro',
      activities: (ATTRACTIONS[from] || []).slice(0, 2).concat(['เดินทางกลับสู่ Paro', 'Kyichu Lhakhang', 'Paro Street Shopping (City Center)']),
      note: 'เข้าพักที่ Paro เพื่อเตรียมขึ้น Taktsang ในวันถัดไป',
    });
  }

  seeds.push(penultimateProgram === 'haa'
    ? {
        city: 'Haa',
        title: 'Paro – Haa – Paro',
        overnight: 'Paro',
        activities: ['Chele La Pass', 'Haa Valley', 'Lhakhang Karpo', 'เดินทางกลับสู่ Paro'],
        note: 'กลับมาพักที่ Paro ในคืนสุดท้ายก่อนวันเดินทางกลับ',
      }
    : {
        city: 'Paro',
        title: 'Paro – Taktsang',
        overnight: 'Paro',
        activities: ['Taktsang Monastery or Tiger’s Nest', 'Lunch at Taktsang Cafeteria', 'Taktsang Monastery or Tiger’s Nest'],
        note: 'คืนสุดท้ายพักที่ Paro เพราะสนามบินระหว่างประเทศอยู่ที่ Paro',
      }
  );

  seeds.push({
    city: 'Paro',
    title: 'Paro – Bangkok',
    overnight: '',
    activities: ['เดินทางสู่สนามบินพาโรเพื่อเดินทางกลับกรุงเทพฯ'],
  });

  return seeds.slice(-totalDays);
}

export function generateTourProgramDays(program: ProgramInput): TourProgramDay[] {
  const total = Math.max(1, diffTourDays(program.startDate, program.endDate));
  const standard = STANDARD_CITIES[total];
  const penultimateProgram = getPenultimateProgram(program.options);
  const isStandard = Boolean(standard && sameCities(program.cities, standard));
  const seeds = isStandard ? (standardSeeds(total, penultimateProgram) || []) : customSeeds(total, program.cities, penultimateProgram);
  const arrivalHour = hourFromTime(program.outboundFlight.arrivalTime);
  const departureHour = hourFromTime(program.inboundFlight.departureTime);
  const festivalDate = String(program.options?.festivalDate || '');
  const festivalName = String(program.options?.festivalName || '');

  return seeds.map((seed, index) => {
    const date = addDays(program.startDate, index);
    const isFirst = index === 0;
    const isLast = index === total - 1;
    const isPenultimateDay = index === total - 2;
    const isTaktsangDay = isPenultimateDay && penultimateProgram === 'taktsang';
    const isHaaDay = isPenultimateDay && penultimateProgram === 'haa';
    let activities = seed.activities.slice();

    if (isFirst && arrivalHour !== null && arrivalHour >= 14) {
      activities = activities.filter((item, itemIndex) => itemIndex === 0 || item.indexOf('เดินทางต่อ') >= 0).slice(0, 2);
    } else if (isFirst && arrivalHour !== null && arrivalHour >= 11) {
      activities = activities.slice(0, Math.min(5, activities.length));
    }

    if (isLast && departureHour !== null) {
      if (departureHour <= 10) activities = activities.filter((item) => item.indexOf('สนามบิน') >= 0);
      else if (departureHour <= 14) activities = activities.filter((item) => item.indexOf('Shopping') < 0).slice(0, 2);
    }

    if (isTaktsangDay) {
      activities = ['Taktsang Monastery or Tiger’s Nest', 'Lunch at Taktsang Cafeteria', 'Taktsang Monastery or Tiger’s Nest'];
    }
    if (isHaaDay) {
      activities = ['Chele La Pass', 'Haa Valley', 'Lhakhang Karpo', 'เดินทางกลับสู่ Paro'];
    }

    if (festivalDate && date === festivalDate && festivalName) {
      activities.unshift('เทศกาล: ' + festivalName);
    }

    return {
      id: uid('day'),
      dayNumber: index + 1,
      date,
      city: isLast ? 'Paro' : (isHaaDay ? 'Haa' : (isTaktsangDay ? 'Paro' : seed.city)),
      title: isLast ? 'Paro – Bangkok' : (isHaaDay ? seed.title : (isTaktsangDay ? 'Paro – Taktsang' : seed.title)),
      activities,
      meals: {
        breakfast: !isFirst,
        lunch: !(isLast && departureHour !== null && departureHour <= 12),
        dinner: !isLast,
      },
      hotel: isLast ? '' : (seed.overnight ? seed.overnight + ' Hotel' : ''),
      note: isPenultimateDay
        ? (penultimateProgram === 'haa'
            ? 'หลังเที่ยว Haa เดินทางกลับมาพักที่ Paro เพื่อเดินทางสู่สนามบินพาโรในวันถัดไป'
            : 'คืนสุดท้ายพักที่ Paro เพื่อเดินทางสู่สนามบินพาโรในวันถัดไป')
        : (seed.note || ''),
    };
  });
}
