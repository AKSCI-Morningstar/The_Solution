"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Tags, Building2, Hash, X } from "lucide-react";
import { cn } from "@/shared/utils";

interface SearchResult {
  id: string;
  type: "entity" | "document" | "organization" | "user";
  label: string;
  subtitle: string;
  href: string;
  icon: "Tags" | "FileText" | "Building2" | "Hash";
}

const ICONS = { Tags, FileText, Building2, Hash } as const;

function iconFor(type: SearchResult["icon"]) {
  return ICONS[type] ?? Hash;
}

export function SearchCommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Listen for the custom event from the header trigger
  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("morningstar:open-search", handler);
    return () => window.removeEventListener("morningstar:open-search", handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    if (!query.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}&limit=10`,
        );
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) {
          setResults(json.data ?? []);
          setFocusedIndex(0);
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
      setResults([]);
      setFocusedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset focused index when results change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFocusedIndex(0);
  }, [results]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, results.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" && results[focusedIndex]) {
        e.preventDefault();
        const result = results[focusedIndex];
        setIsOpen(false);
        router.push(result.href);
        return;
      }
    },
    [results, focusedIndex, router],
  );

  // Scroll focused item into view
  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.querySelector(
      `[data-index="${focusedIndex}"]`,
    ) as HTMLElement | null;
    item?.scrollIntoView({ block: "nearest" });
  }, [focusedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      <div
        className="fixed inset-0 bg-black/40"
        onClick={() => setIsOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="border-border bg-background animate-fade-in relative z-50 w-full max-w-xl rounded-lg border shadow-xl"
        onKeyDown={handleKeyDown}
      >
        <div className="border-border flex items-center gap-3 border-b px-4 py-3">
          <Search className="text-muted-foreground size-4 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search entities, documents, organizations..."
            className="text-foreground placeholder:text-muted-foreground flex-1 bg-transparent text-sm outline-none"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="text-muted-foreground hover:text-foreground rounded-md p-1 transition-colors"
            aria-label="Close search"
          >
            <X className="size-4" />
          </button>
        </div>

        <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
          {isLoading && (
            <div className="text-muted-foreground px-3 py-6 text-center text-sm">
              Searching...
            </div>
          )}
          {!isLoading && query.trim() && results.length === 0 && (
            <div className="text-muted-foreground px-3 py-6 text-center text-sm">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}
          {!isLoading && !query.trim() && (
            <div className="text-muted-foreground px-3 py-6 text-center text-sm">
              Start typing to search across the workspace
            </div>
          )}
          {!isLoading && results.length > 0 && (
            <ul className="flex flex-col gap-0.5">
              {results.map((result, index) => {
                const Icon = iconFor(result.icon);
                return (
                  <li key={`${result.type}-${result.id}`}>
                    <button
                      data-index={index}
                      onClick={() => {
                        setIsOpen(false);
                        router.push(result.href);
                      }}
                      className={cn(
                        "hover:bg-surface-hover flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
                        index === focusedIndex && "bg-surface-hover",
                      )}
                    >
                      <Icon className="text-muted-foreground size-4 shrink-0" />
                      <div className="flex flex-1 flex-col">
                        <span className="text-foreground text-sm font-medium">
                          {result.label}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {result.subtitle}
                        </span>
                      </div>
                      <span className="text-muted-foreground text-[10px] uppercase tracking-wide">
                        {result.type}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-border text-muted-foreground flex items-center justify-between border-t px-4 py-2 text-[11px]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-current/20 px-1">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-current/20 px-1">↵</kbd>
              open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-current/20 px-1">esc</kbd>
              close
            </span>
          </div>
          <span>Engineering Workspace Search</span>
        </div>
      </div>
    </div>
  );
}
