/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Layers, FileText, Truck, Activity } from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search/universal?q=${encodeURIComponent(search)}`);
        if (res.ok) {
          const json = await res.json();
          setResults(json.data || []);
        }
      } catch (err) {
        console.error("Universal search error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [search]);

  if (!open) return null;

  const handleSelect = (href: string) => {
    setOpen(false);
    setSearch("");
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/80 p-4 pt-20 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in-95 w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl duration-150">
        <div className="relative flex items-center gap-3 border-b border-zinc-800 p-4">
          <Search className="size-5 shrink-0 text-zinc-400" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search everything... (drawings, decisions, suppliers, programs)"
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {isLoading ? (
            <div className="p-4 text-center text-xs text-zinc-500">
              Searching platform database...
            </div>
          ) : results.length > 0 ? (
            <div className="flex flex-col gap-1">
              {results.map((r) => (
                <div
                  key={r.id}
                  onClick={() => handleSelect(r.href)}
                  className="flex cursor-pointer items-center justify-between rounded-xl p-3 text-left transition-colors hover:bg-zinc-800"
                >
                  <div className="flex items-center gap-3">
                    {r.type === "Drawing" && <Layers className="size-4 text-indigo-400" />}
                    {r.type === "Decision" && <FileText className="size-4 text-emerald-400" />}
                    {r.type === "Supplier" && <Truck className="size-4 text-amber-400" />}
                    {r.type === "Program" && <Activity className="size-4 text-rose-400" />}
                    <span className="text-xs font-semibold text-zinc-200">{r.title}</span>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">{r.type}</span>
                </div>
              ))}
            </div>
          ) : search.trim() ? (
            <div className="p-6 text-center text-xs text-zinc-500">
              No matching entities found for &quot;{search}&quot;.
            </div>
          ) : (
            <div className="p-4 text-left text-xs text-zinc-500">
              <span className="mb-2 block font-semibold text-zinc-400">
                Quick Navigation Shortcuts:
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <button
                  onClick={() => handleSelect("/programs")}
                  className="rounded-lg bg-zinc-950 p-2 text-left hover:text-zinc-200"
                >
                  ⚡ Program Health Matrix
                </button>
                <button
                  onClick={() => handleSelect("/decisions")}
                  className="rounded-lg bg-zinc-950 p-2 text-left hover:text-zinc-200"
                >
                  ⚡ Decision Audit Trail
                </button>
                <button
                  onClick={() => handleSelect("/intelligence/supplier-risk")}
                  className="rounded-lg bg-zinc-950 p-2 text-left hover:text-zinc-200"
                >
                  ⚡ Supplier Risk Engine
                </button>
                <button
                  onClick={() => handleSelect("/patterns")}
                  className="rounded-lg bg-zinc-950 p-2 text-left hover:text-zinc-200"
                >
                  ⚡ Design Pattern Library
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
