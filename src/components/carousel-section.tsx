"use client";
import { useRef, useState, useEffect, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  children: ReactNode;
  className?: string;
}

export default function CarouselSection({ children, className = "" }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [hasItems, setHasItems] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setHasItems(el.children.length > 0);
  };

  useEffect(() => {
    setMounted(true);
    const el = scrollRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(checkScroll);
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    window.addEventListener("resize", checkScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", checkScroll);
      ro.disconnect();
    };
  }, [children]);

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const child = el.firstElementChild;
    if (!child) return;
    const gap = 20;
    const visible = Math.max(1, Math.round(el.clientWidth / (child.clientWidth + gap)));
    const step = (child.clientWidth + gap) * visible * dir;
    el.scrollBy({ left: step, behavior: "smooth" });
  };

  if (!mounted || !hasItems) return (
    <div className={`relative ${className}`}>
      <div ref={scrollRef} className="flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {children}
      </div>
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => scrollBy(-1)}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/70 hover:bg-white backdrop-blur shadow-md flex items-center justify-center cursor-pointer border-none outline-none transition-all"
        aria-label="Назад"
      >
        <ChevronLeft className="w-5 h-5 text-accent" />
      </button>
      <button
        onClick={() => scrollBy(1)}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/70 hover:bg-white backdrop-blur shadow-md flex items-center justify-center cursor-pointer border-none outline-none transition-all"
        aria-label="Вперёд"
      >
        <ChevronRight className="w-5 h-5 text-accent" />
      </button>
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>
    </div>
  );
}
