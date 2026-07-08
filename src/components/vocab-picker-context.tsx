"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface VocabContextType {
  pickMode: boolean;
  togglePickMode: () => void;
  disabled: boolean;
  pendingPick: { word: string; context: string } | null;
  pickWord: (word: string, context?: string) => void;
  clearPick: () => void;
}

const VocabContext = createContext<VocabContextType>({
  pickMode: false, togglePickMode: () => {}, disabled: false,
  pendingPick: null, pickWord: () => {}, clearPick: () => {},
});

export function VocabPickerProvider({ children, disabled = false }: { children: ReactNode; disabled?: boolean }) {
  const [pickMode, setPickMode] = useState(false);
  const [pendingPick, setPendingPick] = useState<{ word: string; context: string } | null>(null);
  const togglePickMode = useCallback(() => setPickMode(p => !p), []);
  const pickWord = useCallback((word: string, context = "") => setPendingPick({ word, context }), []);
  const clearPick = useCallback(() => setPendingPick(null), []);
  return <VocabContext.Provider value={{ pickMode, togglePickMode, disabled, pendingPick, pickWord, clearPick }}>{children}</VocabContext.Provider>;
}

export function useVocabPicker() {
  return useContext(VocabContext);
}
