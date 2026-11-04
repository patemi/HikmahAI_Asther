"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  conversationListSchema,
  type ConversationItem,
} from "@/lib/chat-contract";
import { apiError } from "./useChat";
export function useConversationList(
  query: string,
  archived: boolean,
  refreshKey: number,
  onError: (error: string) => void,
) {
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [resolvedKey, setResolvedKey] = useState<string | null>(null);
  const queryKey = archived + "|" + query;
  const controller = useRef<AbortController | null>(null);
  const version = useRef(0);
  const load = useCallback(
    async (page = 1) => {
      controller.current?.abort();
      const abort = new AbortController();
      controller.current = abort;
      const current = ++version.current;
      setLoading(true);
      try {
        const response = await fetch(
          "/api/chat/conversations?q=" +
            encodeURIComponent(query) +
            "&page=" +
            page +
            "&archived=" +
            archived,
          { cache: "no-store", signal: abort.signal },
        );
        if (!response.ok) throw new Error(await apiError(response));
        const data = conversationListSchema.parse(await response.json());
        if (current !== version.current || abort.signal.aborted) return;
        setItems((old) =>
          page === 1
            ? data.conversations
            : [
                ...old,
                ...data.conversations.filter(
                  (m) => !old.some((o) => o.participantId === m.participantId),
                ),
              ],
        );
        setNextPage(data.nextPage);
        setResolvedKey(queryKey);
      } catch (error) {
        if (!abort.signal.aborted) {
          if (page === 1) {
            setItems([]);
            setNextPage(null);
          }
          setResolvedKey(queryKey);
          onError(
            error instanceof Error
              ? error.message
              : "Riwayat belum dapat dimuat.",
          );
        }
      } finally {
        if (current === version.current && !abort.signal.aborted)
          setLoading(false);
      }
    },
    [query, archived, onError, queryKey],
  );
  useEffect(() => {
    const timer = setTimeout(() => void load(), query ? 250 : 0);
    return () => {
      clearTimeout(timer);
      controller.current?.abort();
    };
  }, [load, query, refreshKey]);
  return {
    items: resolvedKey === queryKey ? items : [],
    loading: loading || resolvedKey !== queryKey,
    nextPage: resolvedKey === queryKey ? nextPage : null,
    load,
  };
}
