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
  const [error, setError] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("morningstar:open-search", handler);
    return () => window.removeEventListener("morningstar:open-search", handler);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (!query.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&limit=10`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json.error ?? "Search failed");
        }
        if (!cancelled) {
          setResults(json.data ?? []);
          setFocusedIndex(0);
        }
      } catch (err) {
        if (!cancelled) {
          setResults([]);
          setError(err instanceof Error ? err.message : "Search failed");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, isOpen]);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
      setResults([]);
      setFocusedIndex(0);
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFocusedIndex(0);
  }, [results]);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
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
      }
    },
    [results, focusedIndex, router],
  );

  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.querySelector(
      `[data-index="${focusedIndex}"]`,
    ) as HTMLElement | null;
    item?.scrollIntoView({ block: "nearest" });
  }, [focusedIndex]);

  if (!isOpen) return null;

  const activeId = results[focusedIndex]
    ? `search-option-${results[focusedIndex].type}-${results[focusedIndex].id}`
    : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      <div
        className="fixed inset-0 bg-black/40"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="border-border bg-background animate-fade-in relative z-50 w-full max-w-xl rounded-lg border shadow-xl"
        onKeyDown={handleKeyDown}
      >
        <div className="border-border flex items-center gap-3 border-b px-4 py-3">
          <Search className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            id="command-palette-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search entities, documents, organizations..."
            className="text-foreground placeholder:text-muted-foreground flex-1 bg-transparent text-sm outline-none"
            aria-label="Search workspace"
            aria-controls="command-palette-results"
            aria-autocomplete="list"
            aria-activedescendant={activeId}
            role="combobox"
            aria-expanded={results.length > 0}
          />
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-muted-foreground hover:text-foreground rounded-md p-1 transition-colors"
            aria-label="Close search"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div
          ref={listRef}
          id="command-palette-results"
          className="max-h-[50vh] overflow-y-auto p-2"
          role="listbox"
          aria-label="Search results"
        >
          {isLoading && (
            <div className="text-muted-foreground px-3 py-6 text-center text-sm" role="status">
              Searching...
            </div>
          )}
          {!isLoading && error && (
            <div className="text-destructive px-3 py-6 text-center text-sm" role="alert">
              {error}
            </div>
          )}
          {!isLoading && !error && query.trim() && results.length === 0 && (
            <div className="text-muted-foreground px-3 py-6 text-center text-sm">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}
          {!isLoading && !error && !query.trim() && (
            <div className="text-muted-foreground px-3 py-6 text-center text-sm">
              Start typing to search across the workspace
            </div>
          )}
          {!isLoading && !error && results.length > 0 && (
            <ul className="flex flex-col gap-0.5">
              {results.map((result, index) => {
                const Icon = iconFor(result.icon);
                const optionId = `search-option-${result.type}-${result.id}`;
                return (
                  <li key={`${result.type}-${result.id}`} role="presentation">
                    <button
                      id={optionId}
                      type="button"
                      role="option"
                      aria-selected={index === focusedIndex}
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
                      <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
                      <div className="flex flex-1 flex-col">
                        <span className="text-foreground text-sm font-medium">{result.label}</span>
                        <span className="text-muted-foreground text-xs">{result.subtitle}</span>
                      </div>
                      <span className="text-muted-foreground text-[10px] tracking-wide uppercase">
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
          <button
            type="button"
            className="hover:text-foreground underline-offset-2 hover:underline"
            onClick={() => {
              setIsOpen(false);
              router.push(
                query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search",
              );
            }}
          >
            Open full search
          </button>
        </div>
      </div>
    </div>
  );
}
