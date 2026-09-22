"use client";

import { useEffect, useState } from "react";

const slides = [
  { id: "paro", label: "Paro", title: "Tiger’s Nest", subtitle: "วัดทักซังบนหน้าผา", image: "/images/tiger-nest-paro-real.png", alt: "Paro Taktsang, Tiger's Nest, Bhutan" },
  { id: "thimphu", label: "Thimphu", title: "Tashichho Dzong", subtitle: "เสน่ห์เมืองหลวงของภูฏาน", image: "https://upload.wikimedia.org/wikipedia/commons/c/c9/Tashichho_Dzong_2012-11-19.jpg", alt: "Tashichho Dzong in Thimphu, Bhutan" },
  { id: "punakha", label: "Punakha", title: "Punakha Dzong", subtitle: "ป้อมริมแม่น้ำที่สวยที่สุดแห่งหนึ่ง", image: "https://upload.wikimedia.org/wikipedia/commons/5/58/Punakha_dzong.jpg", alt: "Punakha Dzong in Bhutan" },
  { id: "gangtey", label: "Gangtey", title: "Phobjikha Valley", subtitle: "หุบเขาธรรมชาติที่สงบและเขียวสวย", image: "https://upload.wikimedia.org/wikipedia/commons/7/76/Phobjikha_valley.jpg", alt: "Phobjikha Valley in Bhutan" },
] as const;

export default function HomeHeroGallery(){
  const [active, setActive] = useState(2);
  useEffect(() => {
    const id = setInterval(() => setActive((current) => (current + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, []);
  const slide = slides[active];
  return (
    <div className="home-hero-visual">
      <div className="hero-main-photo">
        <img src={slide.image} alt={slide.alt} />
        <div className="hero-route-pill"><span>BKK</span><i></i><span>PBH</span><small>Bhutan Airlines</small></div>
        <div className="hero-photo-caption"><small>{slide.label.toUpperCase()}</small><strong>{slide.title}</strong><em>{slide.subtitle}</em></div>
        <div className="hero-switch-hint">แตะชื่อเมืองเพื่อสลับภาพ</div>
        <div className="hero-place-nav" aria-label="สลับภาพสถานที่ท่องเที่ยวภูฏาน">
          {slides.map((item, index) => (
            <button type="button" key={item.id} className={index === active ? "active" : ""} onClick={() => setActive(index)} aria-pressed={index === active}>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
