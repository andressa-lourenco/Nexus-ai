"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { embedQuery, streamAnswer } from "@/lib/client/api";
import { RAG_CONFIG } from "@/lib/rag/config";
import { retrieve } from "@/lib/rag/retrieve";
import type { ChatTurn, SourceRef } from "@/lib/rag/types";
import { useLibrary } from "./library-provider";

export type MessageStatus = "retrieving" | "generating" | "done" | "no_results" | "stopped" | "error";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: MessageStatus;
  sources?: SourceRef[];
  error?: string;
  searchedChunks?: number;
  question?: string;
}

interface ChatContextValue {
  messages: ChatMessage[];
  busy: boolean;
  ask: (question: string) => Promise<void>;
  stop: () => void;
  clear: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export const NO_RESULTS_MESSAGE =
  "I couldn't find any passage in your documents that is relevant to this question, so I won't guess. Try rephrasing, or add a document that covers this topic.";

export function ChatProvider({ children }: { children: ReactNode }) {
  const { documents, totals } = useLibrary();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const counter = useRef(0);

  const patch = useCallback((id: string, update: Partial<ChatMessage> | ((m: ChatMessage) => Partial<ChatMessage>)) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...(typeof update === "function" ? update(m) : update) } : m)));
  }, []);

  const ask = useCallback(
    async (rawQuestion: string) => {
      const question = rawQuestion.trim().slice(0, RAG_CONFIG.maxQuestionChars);
      if (!question || busy) return;

      const history: ChatTurn[] = messages
        .filter((m) => m.content && (m.role === "user" || m.status === "done"))
        .slice(-RAG_CONFIG.maxHistoryTurns)
        .map((m) => ({ role: m.role, content: m.content }));

      const userId = `m${++counter.current}`;
      const botId = `m${++counter.current}`;
      setMessages((prev) => [
        ...prev,
        { id: userId, role: "user", content: question },
        { id: botId, role: "assistant", content: "", status: "retrieving", searchedChunks: totals.chunks, question },
      ]);
      setBusy(true);
      const abort = new AbortController();
      controller.current = abort;

      try {
        const embedding = await embedQuery(question, abort.signal);
        const sources = retrieve(embedding, documents);
        if (sources.length === 0) {
          patch(botId, { status: "no_results", content: NO_RESULTS_MESSAGE, sources: [] });
          return;
        }
        patch(botId, { status: "generating", sources });
        await streamAnswer(question, sources, history, (delta) => patch(botId, (m) => ({ content: m.content + delta })), abort.signal);
        patch(botId, (m) => ({ status: m.content.trim() ? "done" : "error", error: m.content.trim() ? undefined : "The model returned an empty answer." }));
      } catch (error) {
        if ((error as Error).name === "AbortError") patch(botId, { status: "stopped" });
        else patch(botId, { status: "error", error: (error as Error).message });
      } finally {
        controller.current = null;
        setBusy(false);
      }
    },
    [busy, messages, documents, totals.chunks, patch],
  );

  const stop = useCallback(() => controller.current?.abort(), []);
  const clear = useCallback(() => {
    controller.current?.abort();
    setMessages([]);
  }, []);

  const value = useMemo(() => ({ messages, busy, ask, stop, clear }), [messages, busy, ask, stop, clear]);
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside <ChatProvider>.");
  return ctx;
}
