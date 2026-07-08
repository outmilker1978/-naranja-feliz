"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MessageSquare, ThumbsUp } from "lucide-react";
import { SubmissionThread } from "@/components/submission-thread";

export function SubmissionsList({ submissions }: { submissions: any[] }) {
  const [commenting, setCommenting] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const confirmReview = async (submissionId: string) => {
    setSaving(true);
    await fetch("/api/review-submission", {
      method: "POST",
      body: JSON.stringify({ submissionId, markReviewed: true }),
    });
    setSaving(false);
    router.refresh();
  };

  const sendComment = async (submissionId: string, markReviewed: boolean) => {
    setSaving(true);
    await fetch("/api/review-submission", {
      method: "POST",
      body: JSON.stringify({ submissionId, comment: comment.trim() || null, markReviewed }),
    });
    setSaving(false);
    setCommenting(null);
    setComment("");
    router.refresh();
  };

  const blockLabel = (type: string) => {
    const map: Record<string, string> = {
      text: "Текст",
      image: "Изображение",
      video: "Видео",
      fill_blank: "Заполнить пропуски",
      choice: "Выбор ответа",
      open_question: "Открытый вопрос",
      audio_answer: "Аудио-ответ",
      video_answer: "Видео-ответ",
    };
    return map[type] || type;
  };

  const blockQuestion = (block: any) => {
    if (block?.type === "audio_answer") return block.content?.question || block.content?.prompt || "Аудио-задание";
    if (block?.type === "open_question") return block.content?.question || "Вопрос";
    return "";
  };

  return (
    <div className="space-y-4">
      {submissions.map((sub: any) => {
        const block = sub.lesson_blocks;
        const isAudio = block?.type === "audio_answer";
        const isVideo = block?.type === "video_answer";

        return (
          <div
            key={sub.id}
            className={`border rounded-xl p-5 ${
              sub.reviewed ? "border-green-200 bg-green-50" : "border-border"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3 min-w-0">
                {sub.profiles?.avatar_url ? (
                  <img src={sub.profiles.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover border border-border shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center text-sm text-primary-500 font-bold shrink-0">
                    {(sub.profiles?.full_name || sub.profiles?.email || "?")[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm text-accent">
                    {sub.profiles?.full_name || sub.profiles?.email}
                  </p>
                  <p className="text-xs text-muted truncate">
                    {sub.course?.title || "Курс"} → {sub.lesson?.title || "Урок"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <span className="badge badge-orange">
                  {blockLabel(block?.type)}
                </span>
                {sub.reviewed && (
                  <span className="badge badge-green flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Проверено
                  </span>
                )}
              </div>
            </div>

            <p className="text-sm text-muted mb-2">{blockQuestion(block)}</p>

            {isAudio && (
              <div className="mb-2">
                <audio controls src={sub.answer} className="w-full max-w-md" />
              </div>
            )}
            {isVideo && (
              <div className="mb-2">
                <video controls src={sub.answer} className="w-full max-w-md rounded" />
              </div>
            )}
            {!isAudio && !isVideo && (
              <p className="text-accent font-medium mb-2">
                Ответ: <span className="font-normal">{sub.answer}</span>
              </p>
            )}

            {sub.comment && (
              <p className="text-sm text-primary-500 mb-2">
                <span className="font-medium">Комментарий учителя:</span> {sub.comment}
              </p>
            )}

            <div className="flex items-center gap-2 mt-3">
              {!sub.reviewed && (
                <button
                  onClick={() => confirmReview(sub.id)}
                  disabled={saving}
                  className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  <ThumbsUp className="w-3.5 h-3.5" /> Принять
                </button>
              )}

              {commenting === sub.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Комментарий ученику..."
                    autoFocus
                    className="flex-1 px-3 py-1.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 transition-all"
                  />
                  <button
                    onClick={() => sendComment(sub.id, true)}
                    disabled={saving}
                    className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? "..." : "Подтвердить"}
                  </button>
                  <button
                    onClick={() => sendComment(sub.id, false)}
                    disabled={saving}
                    className="btn-gradient px-3 py-1.5 text-sm disabled:opacity-50 transition-all duration-200"
                  >
                    {saving ? "..." : "Оставить замечание"}
                  </button>
                  <button
                    onClick={() => setCommenting(null)}
                    className="text-muted hover:text-accent text-sm px-2"
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setCommenting(sub.id); setComment(sub.comment || ""); }}
                  className="flex items-center gap-1 text-sm font-semibold text-primary-500"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {sub.comment ? "✎ Изменить комментарий" : "Написать комментарий"}
                </button>
              )}
            </div>

            <SubmissionThread submissionId={sub.id} />
          </div>
        );
      })}
    </div>
  );
}
