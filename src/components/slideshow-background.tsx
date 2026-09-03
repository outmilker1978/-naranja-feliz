"use client";
import { useEffect, useMemo, useState } from "react";

const BUCKET = "hero";

const ALL_IMAGES = [
  "andres-garcia-_SWgYuWS9wY-unsplash.jpg",
  "quino-al-tFbN1bnBynU-unsplash.jpg",
  "mario-la-pergola-hxCQXj5mB7Y-unsplash.jpg",
  "chris-boland-KZKtkNij_ko-unsplash.jpg",
  "daniel-lloyd-blunk-fernandez-IuOOiHgPEpY-unsplash.jpg",
  "alexander-jawfox-l8V8q01KVxA-unsplash.jpg",
  "andreas-m-0kqLwki3IZQ-unsplash.jpg",
  "andrey-zvyagintsev-EQj1ZMpq_VM-unsplash.jpg",
  "angela-compagnone-7-rUmLJK5Qo-unsplash.jpg",
  "anna-murzilon-Eu8v-aKZdFg-unsplash.jpg",
  "belinda-fewings-EHPq7LxwFog-unsplash.jpg",
  "florian-wehde-WBGjg0DsO_g-unsplash.jpg",
  "hector-j-rivas-wV-icTT5x74-unsplash.jpg",
  "jennie-clavel-X7O48jBHzVI-unsplash.jpg",
  "jimmy-woo-XE727t0QtBs-unsplash.jpg",
  "jonas-hoss-p0R8R5IS6aA-unsplash.jpg",
  "jonny-james-TE0leJlNX8Y-unsplash.jpg",
  "kaitlin-dowis-VjM2t7VH9Uo-unsplash.jpg",
  "kazuo-ota-O_ox-HvdgFA-unsplash.jpg",
  "kazuo-ota-QgISXGAFNJg-unsplash.jpg",
  "matthew-waring-zp295I3rJJ8-unsplash.jpg",
  "richard-hewat-sSyRnrhAqU8-unsplash.jpg",
  "sam-williams-UuGAw6nF0Vw-unsplash.jpg",
  "sydney-rae-XIgj8Mk94ts-unsplash.jpg",
  "victor-rosario-kjoaKUBpudw-unsplash.jpg",
];

// Background cover needs a reasonable width — wider than typical viewports
// but far smaller than the 1920 default. Let the proxy produce a webp for
// whichever format the browser prefers.
const BG_WIDTH = 1600;

function imgUrl(name: string) {
  return `/api/storage/${BUCKET}/${name}`;
}

function srcUrl(name: string, width: number) {
  return `${imgUrl(name)}?w=${width}&q=72`;
}

function seededShuffle(arr: string[], seed: number): string[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SlideshowBackground({ className }: { className?: string }) {
  const images = useMemo(() => seededShuffle(ALL_IMAGES, 42).slice(0, 10), []);
  const [idx, setIdx] = useState(0);
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState<boolean[]>(() => images.map(() => false));

  const markLoaded = (i: number) =>
    setLoaded(prev => (prev[i] ? prev : prev.map((v, j) => (j === i ? true : v))));

  // Initial fade-in once the component mounts (first image fades in via CSS).
  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = setInterval(() => {
      setIdx(i => (i + 1) % images.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [ready, images.length]);

  // Preload the next image so the crossfade never flashes empty.
  useEffect(() => {
    if (!ready) return;
    const next = (idx + 1) % images.length;
    if (loaded[next]) return;
    const img = new Image();
    img.onload = () => markLoaded(next);
    img.src = srcUrl(images[next], BG_WIDTH);
  }, [ready, idx, images, loaded]);

  if (!ready) return null;

  // Only render current + previous (for the fade-out tail) as backgrounds.
  const shown = images
    .map((src, i) => ({ src, i }))
    .filter(({ i }) => i === idx || i === (idx - 1 + images.length) % images.length);

  return (
    <>
      {shown.map(({ src, i }) => (
        <div
          key={src}
          className={`absolute inset-0 bg-cover bg-center ${className || ""}`}
          style={{
            backgroundImage: `url('${srcUrl(src, BG_WIDTH)}')`,
            opacity: i === idx ? 1 : 0,
            zIndex: i === idx ? 1 : 0,
            transform: i === idx ? "scale(1)" : "scale(1.08)",
            transition: "opacity 1s ease-in-out, transform 7s ease-in-out",
          }}
        />
      ))}
    </>
  );
}
