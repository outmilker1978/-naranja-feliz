"use client";
import { useEffect, useState } from "react";

const SUPABASE_URL = "https://zphehhzgbudetyzezunk.supabase.co";
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
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${name}`;
}

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
              backgroundImage: `url('${imgUrl(src)}')`,
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
