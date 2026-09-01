import Link from "next/link";
import SectionIntro from "@/components/SectionIntro";
import { metadataForPath } from "@/lib/seo-config";
import { loadSeoState } from "@/lib/seo-store";

export async function generateMetadata() {
  const seo = await loadSeoState();
  return metadataForPath("/journal", seo.pages);
}

const articles = [
  { title: "จองตั๋วไปภูฏานยังไง มีกี่สายการบิน?", summary: "ภาพรวมการเดินทางทางอากาศสู่สนามบินพาโร และสายการบินที่ให้บริการเส้นทางภูฏาน", href: "https://www.bhutancenter.org/airlines-of-bhutan", tag: "Flight" },
  { title: "ค่าเหยียบแผ่นดินคืออะไร ทำไมต้องจ่าย?", summary: "ทำความเข้าใจ Sustainable Development Fee (SDF) และเหตุผลที่ภูฏานใช้ค่าธรรมเนียมนี้กับนักท่องเที่ยว", href: "https://www.bhutancenter.org/the-sustainable-development-fee", tag: "Travel info" },
  { title: "ภูฏานมีกี่ฤดู ช่วงไหนน่าเที่ยวที่สุด?", summary: "รู้จักฤดูใบไม้ผลิ ฤดูร้อน ฤดูใบไม้ร่วง และฤดูหนาว เพื่อเลือกช่วงเดินทางให้เหมาะกับสไตล์ของคุณ", href: "https://www.bhutancenter.org/season-of-bhutan", tag: "Season" },
  { title: "ภูฏาน ดินแดนธรรมชาติที่คาร์บอนไดออกไซด์ติดลบ", summary: "เรื่องราวด้านสิ่งแวดล้อมและแนวทางการพัฒนาที่ทำให้ธรรมชาติเป็นส่วนสำคัญของอัตลักษณ์ภูฏาน", href: "https://www.bhutancenter.org/carbon-negative-bhutan", tag: "Sustainability" },
  { title: "ภูฏาน ประเทศที่มีความสุขที่สุดในโลก", summary: "มองภูฏานผ่านธรรมชาติ ผู้คน วิถีชีวิต และแนวคิดความสุขที่ทำให้ประเทศนี้แตกต่าง", href: "https://www.bhutancenter.org/land-happiness-bhutan", tag: "Culture" },
  { title: "วัฒนธรรมการกินที่ทุกมื้อต้องมี ‘พริก’", summary: "ทำความรู้จักอาหารภูฏาน วัตถุดิบหลัก ชีส ข้าว และพริกที่ปรากฏอยู่ในอาหารหลายเมนู", href: "https://www.bhutancenter.org/foods-of-bhutan", tag: "Food" },
  { title: "ความเป็นมาและความรื่นเริงระบำหน้ากากภูฏาน", summary: "เรื่องราวความเชื่อ การแต่งกาย และความหมายของการร่ายรำที่สืบทอดในเทศกาลสำคัญ", href: "https://www.bhutancenter.org/bhutan-tshechu-story", tag: "Festival" },
  { title: "7 สิ่งพิเศษแห่งภูฏานที่ไม่อาจลืม", summary: "รวมเสน่ห์และประสบการณ์ที่ทำให้การเดินทางภูฏานมีความทรงจำเฉพาะตัว", href: "https://www.bhutancenter.org/7special-thing-of-bhutan", tag: "Inspiration" },
  { title: "ซัมเมอร์นี้เที่ยวภูฏาน", summary: "อีกมุมของภูฏานในช่วงฤดูร้อน เมื่อหุบเขาเขียวชอุ่มและบรรยากาศต่างจากฤดูยอดนิยม", href: "https://www.bhutancenter.org/summer-in-bhutan", tag: "Season" },
  { title: "เทศกาลระบำหน้ากากภูฏาน", summary: "Tshechu Festival ประเพณีสำคัญที่เชื่อมโยงศาสนา ประวัติศาสตร์ ชุมชน และศิลปะการแสดง", href: "https://www.bhutancenter.org/tshechufestivalsbhutan", tag: "Festival" },
];

export default function JournalPage() {
  return <>
    <section className="page-hero journal-hero"><div className="container"><span className="breadcrumbs">Stories / Bhutan Journal</span><h1>Stories worth<br/>travelling for.</h1><p>รวมบทความเดิมของ Bhutan Center ไว้ในโครงสร้างใหม่ เพื่อให้ข้อมูลก่อนเดินทางยังหาเจอได้ง่าย</p></div></section>
    <section className="section"><div className="container"><SectionIntro eyebrow="Bhutan Journal" title="อ่านก่อนออกเดินทาง" body="ใน V1 หน้านี้ทำหน้าที่เป็น Journal Index และเชื่อมกลับไปยังบทความต้นฉบับเดิม เพื่อไม่ให้เนื้อหาที่มีอยู่สูญหายระหว่างการย้ายเว็บไซต์" />
      <div className="journal-grid">{articles.map((article, i) => <article className={`journal-card ${i===0 ? "journal-card--featured" : ""}`} key={article.href}><span className="journal-tag">{article.tag}</span><h2>{article.title}</h2><p>{article.summary}</p><a href={article.href} target="_blank" rel="noreferrer" className="text-link">อ่านบทความเดิม <span>↗</span></a></article>)}</div>
      <div className="migration-note"><strong>พร้อมสำหรับ Phase 2:</strong> สามารถย้ายบทความทั้งหมดเข้าฐานข้อมูล/Blog CMS ของเว็บไซต์ใหม่ภายหลัง โดย URL เดิมสามารถทำ redirect เพื่อรักษา SEO ได้</div>
    </div></section>
    <section className="section section--white"><div className="container callout"><div><h2>พร้อมออกแบบทริปจริงแล้ว?</h2><p>เริ่มจากจำนวนวันและวันที่อยากเดินทาง แล้วให้ทีม Bhutan Center ช่วยจัดรายละเอียดต่อ</p></div><Link href="/packagetours-bhutan-booking" className="button button--gold">วางแผนทริป <span>→</span></Link></div></section>
  </>;
}
