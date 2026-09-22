import Link from "next/link";
import SectionIntro from "@/components/SectionIntro";
import { metadataForPath } from "@/lib/seo-config";
import { loadSeoState } from "@/lib/seo-store";

export async function generateMetadata() {
  const seo = await loadSeoState();
  return metadataForPath("/journal", seo.pages);
}

const articles = [
  { title: "จองตั๋วไปภูฏานยังไง มีกี่สายการบิน?", summary: "ภาพรวมการเดินทางทางอากาศสู่สนามบินพาโร และสิ่งที่ควรรู้ก่อนเลือกเที่ยวบิน", href: "https://www.bhutancenter.org/airlines-of-bhutan", tag: "Flight" },
  { title: "ค่าเหยียบแผ่นดินคืออะไร ทำไมต้องจ่าย?", summary: "ทำความเข้าใจ Sustainable Development Fee (SDF) ก่อนวางงบสำหรับทริปภูฏาน", href: "https://www.bhutancenter.org/the-sustainable-development-fee", tag: "Travel info" },
  { title: "ภูฏานมีกี่ฤดู ช่วงไหนน่าเที่ยวที่สุด?", summary: "เปรียบเทียบฤดูกาลและบรรยากาศ เพื่อเลือกช่วงเดินทางให้เหมาะกับสไตล์ของคุณ", href: "https://www.bhutancenter.org/season-of-bhutan", tag: "Season" },
  { title: "ภูฏาน ดินแดนธรรมชาติที่คาร์บอนไดออกไซด์ติดลบ", summary: "มองภูฏานผ่านธรรมชาติและแนวทางการพัฒนาที่ให้ความสำคัญกับสิ่งแวดล้อม", href: "https://www.bhutancenter.org/carbon-negative-bhutan", tag: "Sustainability" },
  { title: "ภูฏาน ประเทศที่มีความสุขที่สุดในโลก", summary: "เรื่องราวของธรรมชาติ ผู้คน วิถีชีวิต และแนวคิดความสุขที่ทำให้ภูฏานแตกต่าง", href: "https://www.bhutancenter.org/land-happiness-bhutan", tag: "Culture" },
  { title: "วัฒนธรรมการกินที่ทุกมื้อต้องมี ‘พริก’", summary: "ทำความรู้จักอาหารภูฏาน วัตถุดิบหลัก ชีส ข้าว และเมนูที่ควรลอง", href: "https://www.bhutancenter.org/foods-of-bhutan", tag: "Food" },
  { title: "ความเป็นมาและความรื่นเริงระบำหน้ากากภูฏาน", summary: "ทำความเข้าใจความเชื่อ การแต่งกาย และความหมายของการร่ายรำในเทศกาลสำคัญ", href: "https://www.bhutancenter.org/bhutan-tshechu-story", tag: "Festival" },
  { title: "7 สิ่งพิเศษแห่งภูฏานที่ไม่อาจลืม", summary: "รวมเสน่ห์และประสบการณ์ที่ทำให้การเดินทางภูฏานมีความทรงจำเฉพาะตัว", href: "https://www.bhutancenter.org/7special-thing-of-bhutan", tag: "Inspiration" },
  { title: "ซัมเมอร์นี้เที่ยวภูฏาน", summary: "อีกมุมของภูฏานในช่วงฤดูร้อน เมื่อหุบเขาเขียวชอุ่มและบรรยากาศต่างจากไฮซีซัน", href: "https://www.bhutancenter.org/summer-in-bhutan", tag: "Season" },
  { title: "เทศกาลระบำหน้ากากภูฏาน", summary: "Tshechu Festival ประเพณีสำคัญที่เชื่อมศาสนา ประวัติศาสตร์ ชุมชน และศิลปะการแสดง", href: "https://www.bhutancenter.org/tshechufestivalsbhutan", tag: "Festival" },
];

export default function JournalPage() {
  return <>
    <section className="page-hero journal-hero"><div className="container"><span className="breadcrumbs">Stories / Bhutan Journal</span><h1>อ่านให้รู้ก่อน<br/>แล้วเที่ยวได้ลึกกว่าเดิม</h1><p>รวมเรื่องที่คนกำลังวางแผนเที่ยวภูฏานถามบ่อย ตั้งแต่เที่ยวบิน ฤดูกาล SDF อาหาร ไปจนถึงวัฒนธรรมและเทศกาล</p></div></section>
    <section className="section"><div className="container"><SectionIntro eyebrow="Bhutan Journal" title="เลือกอ่านเรื่องที่ช่วยตัดสินใจ" body="ถ้ากำลังเลือกช่วงเดินทาง จำนวนวัน หรืออยากรู้ว่าภูฏานเหมาะกับคุณไหม เริ่มจากหัวข้อด้านล่างได้เลย" />
      <div className="journal-grid">{articles.map((article, i) => <article className={`journal-card ${i===0 ? "journal-card--featured" : ""}`} key={article.href}><span className="journal-tag">{article.tag}</span><h2>{article.title}</h2><p>{article.summary}</p><a href={article.href} target="_blank" rel="noreferrer" className="text-link">อ่านบทความ <span>↗</span></a></article>)}</div>
    </div></section>
    <section className="section section--white"><div className="container callout"><div><h2>อ่านแล้วอยากไปจริง?</h2><p>เริ่มจากจำนวนวันและวันที่อยากเดินทาง แล้วให้ทีม Bhutan Center ช่วยจัดทางเลือกกับราคาให้</p></div><Link href="/booking" className="button button--gold">เริ่มวางแผนทริป <span>→</span></Link></div></section>
  </>;
}
