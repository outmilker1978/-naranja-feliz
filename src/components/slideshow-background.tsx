"use client";
import { useEffect, useState } from "react";

const ALL_IMAGES = [
  "/images/bg/andres-garcia-_SWgYuWS9wY-unsplash.jpg",
  "/images/bg/quino-al-tFbN1bnBynU-unsplash.jpg",
  "/images/bg/mario-la-pergola-hxCQXj5mB7Y-unsplash.jpg",
  "/images/bg/chris-boland-KZKtkNij_ko-unsplash.jpg",
  "/images/bg/daniel-lloyd-blunk-fernandez-IuOOiHgPEpY-unsplash.jpg",
  "/images/bg/alexander-jawfox-l8V8q01KVxA-unsplash.jpg",
  "/images/bg/andreas-m-0kqLwki3IZQ-unsplash.jpg",
  "/images/bg/andrey-zvyagintsev-EQj1ZMpq_VM-unsplash.jpg",
  "/images/bg/angela-compagnone-7-rUmLJK5Qo-unsplash.jpg",
  "/images/bg/anna-murzilon-Eu8v-aKZdFg-unsplash.jpg",
  "/images/bg/belinda-fewings-EHPq7LxwFog-unsplash.jpg",
  "/images/bg/florian-wehde-WBGjg0DsO_g-unsplash.jpg",
  "/images/bg/hector-j-rivas-wV-icTT5x74-unsplash.jpg",
  "/images/bg/jennie-clavel-X7O48jBHzVI-unsplash.jpg",
  "/images/bg/jimmy-woo-XE727t0QtBs-unsplash.jpg",
  "/images/bg/jonas-hoss-p0R8R5IS6aA-unsplash.jpg",
  "/images/bg/jonny-james-TE0leJlNX8Y-unsplash.jpg",
  "/images/bg/kaitlin-dowis-VjM2t7VH9Uo-unsplash.jpg",
  "/images/bg/kazuo-ota-O_ox-HvdgFA-unsplash.jpg",
  "/images/bg/kazuo-ota-QgISXGAFNJg-unsplash.jpg",
  "/images/bg/matthew-waring-zp295I3rJJ8-unsplash.jpg",
  "/images/bg/richard-hewat-sSyRnrhAqU8-unsplash.jpg",
  "/images/bg/sam-williams-UuGAw6nF0Vw-unsplash.jpg",
  "/images/bg/sydney-rae-XIgj8Mk94ts-unsplash.jpg",
  "/images/bg/victor-rosario-kjoaKUBpudw-unsplash.jpg",
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let cachedImages: string[] | null = null;

function getImages(): string[] {
  if (!cachedImages) {
    cachedImages = shuffle(ALL_IMAGES).slice(0, 10);
  }
  return cachedImages;
}

export default function SlideshowBackground({ className }: { className?: string }) {
  const [idx, setIdx] = useState(0);
  const [remountKey, setRemountKey] = useState(0);
  const images = getImages();

  useEffect(() => {
    const id = setInterval(() => {
      setIdx(prev => {
        const next = (prev + 1) % images.length;
        setRemountKey(k => k + 1);
        return next;
      });
    }, 6000);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <>
      {images.map((src, i) => {
        const isCurrent = i === idx;
        return (
          <div key={`${src}${isCurrent ? `-a${remountKey}` : ""}`}
            className={`absolute inset-0 bg-cover bg-center ${className || ""}`}
            style={{
              backgroundImage: `url('${src}')`,
              opacity: isCurrent ? 1 : 0,
              animation: isCurrent ? "kenburns 6s ease-in-out forwards" : undefined,
              transition: "opacity 1.5s ease-in-out",
              zIndex: isCurrent ? 1 : 0,
              ...(isCurrent ? {} : { transform: "scale(1.08)" }),
            }} />
        );
      })}
      <style>{`
        @keyframes kenburns {
          0% { transform: scale(1); }
          100% { transform: scale(1.08); }
        }
      `}</style>
    </>
  );
}
