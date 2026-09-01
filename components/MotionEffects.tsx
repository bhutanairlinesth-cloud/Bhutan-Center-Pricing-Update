"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function MotionEffects() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    const body = document.body;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    body.classList.add("motion-enabled");

    const header = document.querySelector<HTMLElement>(".site-header");
    const progress = document.querySelector<HTMLElement>(".site-progress__bar");

    const onScroll = () => {
      const y = window.scrollY || 0;
      header?.classList.toggle("is-scrolled", y > 24);

      if (progress) {
        const doc = document.documentElement;
        const max = Math.max(1, doc.scrollHeight - window.innerHeight);
        progress.style.transform = `scaleX(${Math.min(1, Math.max(0, y / max))})`;
      }

      if (!prefersReduced && window.innerWidth > 900) {
        document
          .querySelectorAll<HTMLElement>(
            ".hero-main-photo, .philosophy-media, .airline-feature-media, .package-hero-media, .destination-editorial-media"
          )
          .forEach((box) => {
            const rect = box.getBoundingClientRect();
            if (rect.bottom < -120 || rect.top > window.innerHeight + 120) return;
            const center = rect.top + rect.height / 2;
            const viewportCenter = window.innerHeight / 2;
            const offset = Math.max(-18, Math.min(18, (viewportCenter - center) * 0.035));
            box.style.setProperty("--parallax-y", `${offset}px`);
          });
      }
    };

    let raf = 0;
    const requestScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(onScroll);
    };

    window.addEventListener("scroll", requestScroll, { passive: true });
    window.addEventListener("resize", requestScroll, { passive: true });
    onScroll();

    const selectors = [
      ".section-heading",
      ".center-heading",
      ".package-card",
      ".philosophy-copy",
      ".service-grid article",
      ".airline-feature-copy",
      ".city-row",
      ".planner-copy",
      ".booking-form-card",
      ".booking-step",
      ".highlight-grid article",
      ".trip-facts > *",
      ".destination-editorial",
      ".info-card",
      ".hotel-card",
      ".journal-card",
      ".inclusion-card",
      ".itinerary-list details",
      ".callout",
    ].join(",");

    const revealItems = Array.from(document.querySelectorAll<HTMLElement>(selectors));
    revealItems.forEach((el, index) => {
      el.classList.add("motion-reveal");
      el.style.setProperty("--reveal-delay", `${Math.min((index % 4) * 70, 210)}ms`);
    });

    let observer: IntersectionObserver | null = null;
    if (prefersReduced || !("IntersectionObserver" in window)) {
      revealItems.forEach((el) => el.classList.add("is-visible"));
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              (entry.target as HTMLElement).classList.add("is-visible");
              observer?.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px -7% 0px" }
      );
      revealItems.forEach((el) => observer?.observe(el));
    }

    const shineTargets = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".package-card, .service-grid article, .city-row, .booking-form-card, .info-card, .hotel-card, .journal-card"
      )
    );

    const pointerHandlers = new Map<HTMLElement, (event: PointerEvent) => void>();
    if (!prefersReduced && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      shineTargets.forEach((el) => {
        el.classList.add("motion-shine");
        const handler = (event: PointerEvent) => {
          const rect = el.getBoundingClientRect();
          el.style.setProperty("--shine-x", `${event.clientX - rect.left}px`);
          el.style.setProperty("--shine-y", `${event.clientY - rect.top}px`);
        };
        pointerHandlers.set(el, handler);
        el.addEventListener("pointermove", handler);
      });
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", requestScroll);
      window.removeEventListener("resize", requestScroll);
      observer?.disconnect();
      revealItems.forEach((el) => {
        el.classList.remove("motion-reveal", "is-visible");
        el.style.removeProperty("--reveal-delay");
      });
      pointerHandlers.forEach((handler, el) => {
        el.removeEventListener("pointermove", handler);
        el.classList.remove("motion-shine");
      });
      body.classList.remove("motion-enabled");
    };
  }, [pathname]);

  if (pathname.startsWith("/admin")) return null;
  return (
    <div className="site-progress" aria-hidden="true">
      <div className="site-progress__bar" />
    </div>
  );
}
