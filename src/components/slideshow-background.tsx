"use client";
import { useEffect, useState } from "react";

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

function imgUrl(name: string) {
  return `/api/storage/${BUCKET}/${name}`;
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
  const [images, setImages] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setImages(seededShuffle(ALL_IMAGES, 42).slice(0, 10));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = setInterval(() => {
      setIdx(i => (i + 1) % images.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [ready, images.length]);

  if (!ready || images.length === 0) return null;

  return (
    <>
      {images.map((src, i) => {
        const isCurrent = i === idx;
        return (
          <div key={src}
            className={`absolute inset-0 bg-cover bg-center ${className || ""}`}
            style={{
              backgroundImage: `url('${imgUrl(src)}')`,
              opacity: isCurrent ? 1 : 0,
              zIndex: isCurrent ? 1 : 0,
              transform: isCurrent ? "scale(1)" : "scale(1.08)",
              transition: "opacity 1s ease-in-out, transform 7s ease-in-out",
            }} />
        );
      })}
    </>
  );
}
