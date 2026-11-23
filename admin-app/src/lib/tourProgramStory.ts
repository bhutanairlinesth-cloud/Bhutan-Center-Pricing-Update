import { TourProgramDay } from '../types';

export type StoryPlace = {
  key: string;
  title: string;
  subtitle: string;
  story: string;
  image: string;
};

const commons = (fileName: string) =>
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/' + encodeURIComponent(fileName);

export const STORY_PLACES: StoryPlace[] = [
  {
    key: 'paro-airport',
    title: 'พาโร',
    subtitle: 'PARO · THE GATEWAY TO BHUTAN',
    story: 'ประตูแรกของการเดินทางคือพาโร เมืองในหุบเขาที่โอบล้อมด้วยภูเขาสูง และเป็นที่ตั้งของสนามบินนานาชาติของภูฏาน จากตรงนี้การเดินทางของเราจะค่อย ๆ ลึกเข้าไปสู่เมืองหลวง หุบเขา และเรื่องราวของอาณาจักรแห่งความสุข',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Bhutan_Airlines_Airbus_A319_%28A5-BAC%29_at_Paro_Airport.jpg/1920px-Bhutan_Airlines_Airbus_A319_%28A5-BAC%29_at_Paro_Airport.jpg',
  },
  {
    key: 'rinpung',
    title: 'Rinpung Dzong',
    subtitle: 'ป้อมปราการแห่งพาโร',
    story: 'ก่อนออกจากพาโร เราจะได้รู้จัก Rinpung Dzong ป้อม–อารามสำคัญที่ยืนอยู่ริมแม่น้ำพาโร สถาปัตยกรรมขนาดใหญ่และลานภายในทำให้เห็นว่าศาสนา การปกครอง และวิถีชีวิตของภูฏานเชื่อมโยงกันอย่างไร',
    image: 'https://cdn1.tripoto.com/media/filter/nxxl/img/271519/TripDocument/1554273918_batch_paro_dzong.jpg.webp',
  },
  {
    key: 'thimphu',
    title: 'ทิมพู',
    subtitle: 'THIMPHU · THE CAPITAL',
    story: 'จากพาโร เราจะเดินทางสู่ทิมพู เมืองหลวงปัจจุบันของภูฏาน เมืองนี้มีทั้งความร่วมสมัยและวัฒนธรรมดั้งเดิมอยู่ด้วยกัน เราจะได้เห็นชีวิตประจำวันของชาวภูฏานควบคู่ไปกับสถานที่สำคัญของประเทศ',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Tashichho_Dzong_2012-11-19.jpg/1920px-Tashichho_Dzong_2012-11-19.jpg',
  },
  {
    key: 'buddha',
    title: 'Buddha Dordenma',
    subtitle: 'พระใหญ่เหนือหุบเขาทิมพู',
    story: 'บนเนินเขาเหนือเมืองทิมพูคือ Buddha Dordenma พระพุทธรูปขนาดใหญ่ที่มองเห็นได้จากหลายมุมของเมือง ที่นี่ไม่ใช่เพียงจุดถ่ายภาพ แต่ยังเป็นจุดที่ทำให้เราได้มองย้อนกลับไปเห็นทั้งเมืองและหุบเขาทิมพูในภาพเดียว',
    image: 'https://foto.soiono.com/fotos_de_viaje/viaje_a_Butan/butan-gran-buda-thimphu.jpg',
  },
  {
    key: 'dochula',
    title: 'Dochula Pass',
    subtitle: '108 เจดีย์บนเส้นทางสู่พูนาคา',
    story: 'ออกจากทิมพู เราจะค่อย ๆ ไต่ระดับขึ้นสู่ Dochula Pass จุดพักสำคัญบนเส้นทางไปพูนาคา ที่นี่มีเจดีย์ Druk Wangyal 108 องค์เรียงตัวอยู่บนสันเขา และในวันที่อากาศเปิดสามารถมองเห็นแนวเทือกเขาหิมาลัยทอดยาวอยู่เบื้องหน้า',
    image: 'https://www.odysseyexplore.com/tours/images/big/big-bhutan-1.jpg',
  },
  {
    key: 'chimi',
    title: 'Chimi Lhakhang',
    subtitle: 'วัดแห่งเรื่องเล่าของ Divine Madman',
    story: 'ก่อนเข้าสู่ใจกลางพูนาคา เราจะแวะ Chimi Lhakhang วัดเล็กกลางหุบเขาที่มีเรื่องเล่าเฉพาะตัวเกี่ยวกับ Drukpa Kunley หรือ Divine Madman เป็นอีกหนึ่งสถานที่ที่สะท้อนว่าศรัทธาและอารมณ์ขันสามารถอยู่ร่วมกันในวัฒนธรรมภูฏานได้อย่างน่าสนใจ',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Punakha_dzong.jpg/1920px-Punakha_dzong.jpg',
  },
  {
    key: 'punakha',
    title: 'พูนาคา',
    subtitle: 'PUNAKHA · THE OLD CAPITAL',
    story: 'จากนั้นเราจะเข้าสู่พูนาคา อดีตเมืองหลวงของภูฏาน เมืองนี้มีอากาศอบอุ่นกว่าเมืองบนที่สูง และมี Punakha Dzong ตั้งเด่นอยู่ตรงจุดบรรจบของแม่น้ำ Pho Chhu และ Mo Chhu ป้อมแห่งนี้เป็นหนึ่งในสถานที่สำคัญที่สุดในประวัติศาสตร์ของประเทศ',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Punakha_dzong.jpg/1920px-Punakha_dzong.jpg',
  },
  {
    key: 'bridge',
    title: 'Punakha Suspension Bridge',
    subtitle: 'สะพานแขวนเหนือสายน้ำ',
    story: 'หลังชม Punakha Dzong เราจะออกไปสัมผัสบรรยากาศของหุบเขาที่สะพานแขวนพูนาคา สะพานยาวเหนือสายน้ำที่เต็มไปด้วยธงมนต์ เป็นช่วงเวลาที่จังหวะการเดินทางช้าลงและได้เห็นภูฏานในมุมของธรรมชาติและชุมชน',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Punakha_dzong.jpg/1920px-Punakha_dzong.jpg',
  },
  {
    key: 'gangtey',
    title: 'กังเต / โฟบจิกา',
    subtitle: 'GANGTEY · THE QUIET VALLEY',
    story: 'หากทริปพาเราไปไกลขึ้น เราจะเข้าสู่กังเตและหุบเขาโฟบจิกา พื้นที่ที่ต่างจากเมืองหลักอย่างชัดเจน ทั้งทุ่งหญ้า ป่าสน และหมู่บ้านเล็ก ๆ ทำให้วันนี้เป็นวันที่เงียบและใกล้ธรรมชาติที่สุดของการเดินทาง',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Phobjikha_valley.jpg/1920px-Phobjikha_valley.jpg',
  },
  {
    key: 'simtokha',
    title: 'Simtokha Dzong',
    subtitle: 'ซองเก่าแก่บนเส้นทางกลับ',
    story: 'ระหว่างทางกลับสู่พาโร เราจะแวะ Simtokha Dzong หนึ่งในซองเก่าแก่ของภูฏาน จุดนี้ทำหน้าที่เหมือนบทเชื่อมจากเมืองหลวงกลับสู่หุบเขาพาโร ก่อนที่เราจะเข้าสู่ช่วงท้ายของทริป',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Tashichho_Dzong_2012-11-19.jpg/1920px-Tashichho_Dzong_2012-11-19.jpg',
  },
  {
    key: 'taktsang',
    title: 'Taktsang · Tiger’s Nest',
    subtitle: 'ไฮไลต์ของการเดินทาง',
    story: 'วันก่อนเดินทางกลับถูกเก็บไว้สำหรับ Taktsang หรือ Tiger’s Nest วัดที่เกาะอยู่บนหน้าผาเหนือหุบเขาพาโร เราจะค่อย ๆ เดินขึ้นตามเส้นทาง ผ่านป่าสน จุดพัก และ Taktsang Cafeteria ก่อนถึงวัด ไฮไลต์วันนี้ไม่ใช่แค่ปลายทาง แต่คือประสบการณ์ตลอดเส้นทางขึ้นและลง',
    image: '/images/tiger-nest-paro-real.png',
  },
  {
    key: 'haa',
    title: 'Haa Valley',
    subtitle: 'ทางเลือกสำหรับวันก่อนกลับ',
    story: 'หากไม่ขึ้นทักซัง เราสามารถเปลี่ยนวันก่อนกลับเป็นเส้นทาง Haa Valley ผ่าน Chele La สู่หุบเขาฮาที่เงียบสงบกว่าเมืองหลัก ช่วงเย็นเราจะเดินทางกลับมาพักที่พาโร เพื่อเตรียมตัวเดินทางสู่สนามบินในวันรุ่งขึ้น',
    image: 'https://www.ampersandtravel.com/media/845774/haa-valley-bhutan-3.jpg?height=534&mode=crop&quality=95&width=820',
  },
  {
    key: 'kyichu',
    title: 'Kyichu Lhakhang',
    subtitle: 'ปิดท้ายด้วยความสงบที่พาโร',
    story: 'ก่อนอำลาภูฏาน เราจะแวะ Kyichu Lhakhang วัดเก่าแก่ในหุบเขาพาโร บรรยากาศของวัดสงบและเรียบง่าย เหมาะสำหรับเป็นช่วงสุดท้ายของทริปก่อนเดินทางไปสนามบิน',
    image: 'https://assets.atlasobscura.com/media/W1siZiIsInVwbG9hZHMvcGxhY2VfaW1hZ2VzLzNhNmUyMmM1LTg0MTEtNDI5Ni1hM2YyLWNmOGJiODk4NjQ1MjI2OTA1YzQ1MzgwOTlkOWMzY19iaHV0YW4gdGVtcGxlLmpwZyJdLFsicCIsInRodW1iIiwiMTIwMHg-Il0sWyJwIiwiY29udmVydCIsIi1xdWFsaXR5IDgxIC1hdXRvLW9yaWVudCJdXQ/bhutan%20temple.jpg',
  },
];

const containsAny = (haystack: string, terms: string[]) => terms.some((term) => haystack.includes(term));

export function storyPlacesForDay(day: TourProgramDay): StoryPlace[] {
  const haystack = (day.title + ' ' + day.city + ' ' + day.activities.join(' ')).toLowerCase();
  const keys: string[] = [];

  if (containsAny(haystack, ['airport', 'สนามบิน', 'bangkok – paro', 'bangkok - paro'])) keys.push('paro-airport');
  if (containsAny(haystack, ['rinpung'])) keys.push('rinpung');
  if (containsAny(haystack, ['thimphu', 'ทิมพู'])) keys.push('thimphu');
  if (containsAny(haystack, ['buddha dordenma'])) keys.push('buddha');
  if (containsAny(haystack, ['dochula'])) keys.push('dochula');
  if (containsAny(haystack, ['chimi'])) keys.push('chimi');
  if (containsAny(haystack, ['punakha', 'พูนาคา'])) keys.push('punakha');
  if (containsAny(haystack, ['suspension bridge'])) keys.push('bridge');
  if (containsAny(haystack, ['gangtey', 'phobjikha', 'กังเต'])) keys.push('gangtey');
  if (containsAny(haystack, ['simtokha'])) keys.push('simtokha');
  if (containsAny(haystack, ['taktsang', 'tiger'])) keys.push('taktsang');
  if (containsAny(haystack, ['haa', 'chele la', 'ฮา'])) keys.push('haa');
  if (containsAny(haystack, ['kyichu'])) keys.push('kyichu');

  const unique = Array.from(new Set(keys))
    .map((key) => STORY_PLACES.find((item) => item.key === key))
    .filter((item): item is StoryPlace => Boolean(item));

  if (unique.length >= 2) return unique.slice(0, 3);

  const fallbackKey =
    day.city === 'Punakha' ? 'punakha' :
    day.city === 'Thimphu' ? 'thimphu' :
    day.city === 'Gangtey' ? 'gangtey' :
    day.city === 'Haa' ? 'haa' :
    'rinpung';

  const fallback = STORY_PLACES.find((item) => item.key === fallbackKey);
  return fallback ? Array.from(new Set([...unique, fallback])).slice(0, 3) : unique;
}

export function dayJourneyLead(day: TourProgramDay) {
  const title = day.title.toLowerCase();
  if (title.includes('bangkok') && title.includes('thimphu')) {
    return 'เริ่มต้นการเดินทางด้วยการบินเข้าสู่หุบเขาพาโร ก่อนทำความรู้จักภูฏานผ่านเมืองพาโร แล้วค่อยเดินทางต่อสู่ทิมพู เมืองหลวงที่เป็นหัวใจของประเทศในปัจจุบัน';
  }
  if (title.includes('thimphu') && title.includes('punakha')) {
    return 'วันนี้เราจะออกจากเมืองหลวง มุ่งหน้าสู่พูนาคา ระหว่างทางเส้นทางจะค่อย ๆ ไต่ขึ้นสู่ Dochula Pass ก่อนลดระดับลงสู่หุบเขาที่อากาศอบอุ่นกว่า และเข้าสู่อดีตเมืองหลวงของภูฏาน';
  }
  if (title.includes('punakha') && title.includes('paro')) {
    return 'หลังใช้เวลาอยู่ในหุบเขาพูนาคา เราจะเริ่มเดินทางย้อนกลับทางตะวันตก ผ่านทิมพูและจุดสำคัญระหว่างทาง ก่อนกลับเข้าสู่พาโร เพื่อเตรียมเข้าสู่ช่วงไฮไลต์สุดท้ายของทริป';
  }
  if (title.includes('gangtey')) {
    return 'เส้นทางวันนี้พาเราออกจากเมืองหลักเข้าสู่หุบเขาที่เงียบกว่าเดิม ธรรมชาติของกังเตและโฟบจิกาจะเปลี่ยนอารมณ์ของทริปให้ช้าลง ก่อนที่เราจะค่อย ๆ เดินทางกลับสู่เส้นทางหลัก';
  }
  if (title.includes('taktsang')) {
    return 'วันนี้คือวันที่เราเก็บไว้ให้กับหนึ่งในภาพจำสำคัญที่สุดของภูฏาน เราจะใช้เวลาอย่างเต็มที่กับเส้นทางเดินขึ้นวัดทักซัง และกลับมาพักที่พาโรในคืนสุดท้ายก่อนเดินทางกลับ';
  }
  if (title.includes('haa')) {
    return 'วันนี้เราเลือกเส้นทางที่สงบกว่าแทนการขึ้นทักซัง เดินทางจากพาโรผ่าน Chele La สู่ Haa Valley แล้ววกกลับมาพักที่พาโรในช่วงเย็น เพื่อเตรียมตัวเดินทางกลับในวันถัดไป';
  }
  if (title.includes('bangkok')) {
    return 'เช้าวันสุดท้ายยังมีเวลาให้เราเก็บบรรยากาศของพาโรอีกเล็กน้อย ก่อนปิดการเดินทางที่สนามบินนานาชาติพาโรและบินกลับกรุงเทพฯ';
  }
  return 'วันนี้เราจะเดินทางต่ออย่างค่อยเป็นค่อยไป ใช้เวลาอยู่กับสถานที่สำคัญของเส้นทาง และเก็บเรื่องราวของแต่ละเมืองให้มากกว่าการแวะถ่ายภาพแล้วผ่านไป';
}
