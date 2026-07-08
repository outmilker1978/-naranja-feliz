"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Clock } from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  content: string | null;
}

interface Exercise {
  id: string;
  type: string;
  question: string;
  correct_answer: string | null;
  options: string[] | null;
  order_index: number;
}

interface Submission {
  id: string;
  exercise_id: string;
  answer: string;
  comment: string | null;
  reviewed: boolean;
}

function ExerciseCard({
  exercise,
  submission,
  studentId,
  onSubmitted,
}: {
  exercise: Exercise;
  submission: Submission | null;
  studentId: string;
  onSubmitted: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const [sending, setSending] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;
    setSending(true);

    const { error } = await supabase.from("submissions").insert({
      exercise_id: exercise.id,
      student_id: studentId,
      answer,
    });

    if (error) {
      alert("Ошибка: " + error.message);
      setSending(false);
      return;
    }

    setAnswer("");
    setSending(false);
    onSubmitted();
  };

  if (submission) {
    return (
      <div className="border rounded-lg p-5 bg-green-50 border-green-200">
        <div className="flex items-center gap-2 mb-2">
          {submission.reviewed ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : (
            <Clock className="w-4 h-4 text-yellow-500" />
          )}
          <span className="text-sm font-medium">
            {submission.reviewed ? "Проверено" : "Отправлено на проверку"}
          </span>
        </div>
        <p className="text-sm text-zinc-700">
          <span className="font-medium">Твой ответ:</span> {submission.answer}
        </p>
        {submission.comment && (
          <p className="text-sm text-primary-500 mt-2">
            <span className="font-medium">Комментарий:</span> {submission.comment}
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-primary-200 rounded-lg p-5">
      <p className="font-medium text-zinc-800 mb-3">{exercise.question}</p>

      {exercise.options && exercise.options.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-3">
          {exercise.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setAnswer(opt)}
              className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                answer === opt
                  ? "border-primary-500 bg-primary-50 text-primary-500"
                  : "border-zinc-200 text-zinc-600 hover:border-primary-300"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Твой ответ"
          className="w-full px-4 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 transition-all mb-3"
        />
      )}

      <button
        type="submit"
        disabled={sending || !answer.trim()}
        className="btn-gradient px-4 py-2 text-sm font-medium disabled:opacity-50 transition-all duration-200"
      >
        {sending ? "..." : "Отправить"}
      </button>
    </form>
  );
}

function renderContentWithBlanks(html: string): string {
  let result = html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");

  result = result.replace(
    /<span[^>]*data-answer="([^"]*)"[^>]*>.*?<\/span>/gi,
    (_, answer) => `[[${answer}]]`,
  );

  result = result.replace(
    /\[\[([^\]]+)\]\]/g,
    (_, answer) =>
      `<span class="inline-blank-wrapper"><input type="text" class="inline-blank-input" data-answer="${answer}" placeholder="..." autocomplete="off"> <span class="inline-blank-feedback"></span></span>`,
  );
  return result;
}

export function LessonContent({
  lesson,
  exercises,
  submissionMap,
  studentId,
}: {
  lesson: Lesson;
  exercises: Exercise[];
  submissionMap: Record<string, Submission>;
  studentId: string;
}) {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);

  const hasBlanks = lesson.content?.includes("[[") || lesson.content?.includes("inline-blank");

  const handleInlineSubmit = useCallback(() => {
    if (!contentRef.current) return;
    const inputs = contentRef.current.querySelectorAll<HTMLInputElement>(".inline-blank-input");
    let allCorrect = true;
    inputs.forEach((input) => {
      const correct = input.dataset.answer || "";
      const feedback = input.parentElement?.querySelector(".inline-blank-feedback");
      if (input.value.trim().toLowerCase() === correct.trim().toLowerCase()) {
        input.className = "inline-blank-input correct";
        if (feedback) {
          feedback.textContent = "✓";
          feedback.className = "inline-blank-feedback correct";
        }
      } else {
        input.className = "inline-blank-input wrong";
        if (feedback) {
          feedback.textContent = `✗ (${correct})`;
          feedback.className = "inline-blank-feedback wrong";
        }
        allCorrect = false;
      }
    });
  }, []);

  const html = lesson.content
    ? renderContentWithBlanks(
        lesson.content
          .replace(/<audio /g, '<audio controls class="w-full my-4" ')
          .replace(/<video /g, '<video controls class="w-full my-4 rounded-lg" ')
      )
    : "";

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-accent mb-6">{lesson.title}</h1>

      {html && (
        <div className="mb-8">
          <div
            ref={contentRef}
            className="text-content"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {hasBlanks && (
            <button
              onClick={handleInlineSubmit}
              className="mt-4 btn-gradient px-6 py-2 text-sm font-medium transition-all duration-200"
            >
              Проверить
            </button>
          )}
        </div>
      )}

      {exercises.length > 0 && (
        <div className="space-y-4 mt-8">
          <h2 className="text-lg font-semibold text-zinc-800">Упражнения</h2>
          {exercises.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              submission={submissionMap[ex.id] ?? null}
              studentId={studentId}
              onSubmitted={() => router.refresh()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
