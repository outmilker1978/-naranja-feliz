"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { AddWordFromLesson } from "./add-word-from-lesson";
import { useVocabPicker } from "./vocab-picker-context";

/**
 * Splits text into clickable word spans when vocab pick mode is active.
 * Use this to wrap text content in lesson blocks.
 */
export function PickableText({ text, lessonId }: { text: string; lessonId?: string }) {
  const { pickMode, disabled } = useVocabPicker();
  const [pickedWord, setPickedWord] = useState<string | null>(null);
  const [contextSent, setContextSent] = useState("");

  if (disabled || !pickMode) return <>{text}</>;

  // Split into words (including punctuation)
  const parts = text.split(/(\s+|[.,!?;:()"«»]+)/g);

  return (
    <>
      {parts.map((part, i) => {
        const isWord = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]+$/.test(part);
        if (!isWord || part.length < 2) return <span key={i}>{part}</span>;
        return (
          <WordPop key={i} word={part} contextSentence={text} lessonId={lessonId}>
            {part}
          </WordPop>
        );
      })}
    </>
  );
}

function WordPop({ word, contextSentence, lessonId, children }: { word: string; contextSentence?: string; lessonId?: string; children: React.ReactNode }) {
  const { pickMode } = useVocabPicker();
  const [show, setShow] = useState(false);

  if (!pickMode) return <>{children}</>;

  return (
    <>
      <span onClick={() => setShow(true)}
        className="cursor-pointer border-b border-dashed border-primary-300 hover:border-primary-500 transition-colors"
      >
        {children}
      </span>
      {show && (
        <AddWordFromLesson
          word={word}
          contextSentence={contextSentence}
          lessonId={lessonId}
          onAdded={() => setShow(false)}
        />
      )}
    </>
  );
}
