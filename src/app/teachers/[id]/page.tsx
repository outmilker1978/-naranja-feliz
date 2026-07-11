import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function TeacherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const svc = createServiceClient();
  const { data: t } = await svc
    .from("content")
    .select("*")
    .eq("id", id)
    .eq("type", "teacher")
    .eq("status", "published")
    .maybeSingle();

  if (!t) notFound();

  const photos: string[] = t.content?.photos ?? [];
  const quote: string = t.content?.quote ?? "";
  const bio: string = t.content?.text ?? "";
  const social: { vk?: string; telegram?: string; email?: string } = t.content?.social ?? {};

  return (
    <div className="max-w-4xl mx-auto px-5 md:px-8 py-12">
      <Link href="/teachers" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent mb-8 transition-colors">
        ← Все преподаватели
      </Link>

      {/* Photo gallery */}
      {photos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {photos.map((url, i) => (
            <div key={i} className={`rounded-2xl overflow-hidden shadow-md ${i === 0 && photos.length === 1 ? "sm:col-span-2 max-w-lg mx-auto" : ""}`}>
              <img src={url} alt={`${t.title} — фото ${i + 1}`} loading="lazy" className="w-full h-72 object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Name */}
      <h1 className="text-3xl sm:text-4xl font-bold text-accent mb-4">{t.title}</h1>

      {/* Quote */}
      {quote && (
        <div className="border-l-4 border-primary-500 pl-5 mb-8">
          <p className="text-xl italic text-muted leading-relaxed">&ldquo;{quote}&rdquo;</p>
        </div>
      )}

      {/* Bio */}
      {bio && (
        <div className="text-accent leading-relaxed whitespace-pre-line mb-10">
          {bio}
        </div>
      )}

      {/* Social links */}
      <div className="flex flex-wrap gap-4">
        {social.vk && (
          <a href={social.vk} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-sm font-medium">
            <VkIcon /> VK
          </a>
        )}
        {social.telegram && (() => {
          const tg = social.telegram.startsWith("@") ? `https://t.me/${social.telegram.slice(1)}` : social.telegram.startsWith("http") ? social.telegram : `https://t.me/${social.telegram}`;
          return (
            <a href={tg} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors text-sm font-medium">
              <TelegramIcon /> {social.telegram.startsWith("@") ? social.telegram : "Telegram"}
            </a>
          );
        })()}
        {social.email && (
          <a href={`mailto:${social.email}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors text-sm font-medium">
            <MailIcon /> {social.email}
          </a>
        )}
      </div>
    </div>
  );
}

function VkIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.684 0H8.316C3.712 0 0 3.712 0 8.316v7.368C0 20.288 3.712 24 8.316 24h7.368C20.288 24 24 20.288 24 15.684V8.316C24 3.712 20.288 0 15.684 0zm3.828 16.82h-1.472c-.572 0-.748-.452-1.764-1.476-.884-.856-1.268-.968-1.488-.968-.308 0-.396.092-.396.548v1.356c0 .36-.12.548-1.052.548-1.56 0-3.284-.96-4.504-2.748C6.672 11.236 5.992 9.14 5.992 8.604c0-.24.092-.456.548-.456h1.472c.416 0 .568.184.724.624.792 2.148 2.108 4.028 2.652 4.028.204 0 .296-.092.296-.588v-2.28c-.064-1.064-.628-1.152-.628-1.536 0-.192.152-.368.396-.368h2.312c.332 0 .452.168.452.556v2.996c0 .328.144.444.232.444.192 0 .352-.116.696-.468.824-.932 1.488-2.384 1.488-2.384.076-.196.196-.368.608-.368h1.472c.42 0 .516.228.42.548-.176.804-1.944 3.108-1.944 3.108-.152.248-.208.368 0 .648.148.2.644.636.976 1.02.612.672 1.088 1.236 1.216 1.624.124.388-.084.584-.464.584z"/>
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.127.087.62.087.62l-1.424 6.8c-.105.51-.417.626-.852.41l-2.347-1.7-1.057.998c-.146.14-.247.235-.497.235-.13 0-.224-.045-.288-.126l-.148-.273-.62-2.352-1.773-.574c-.306-.107-.32-.302-.06-.456l6.828-4.172c.258-.152.508-.012.311.26l-3.026 3.366" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 4l-10 8L2 4" />
    </svg>
  );
}
