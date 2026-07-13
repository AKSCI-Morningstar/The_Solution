export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-black/10 bg-white px-6 dark:border-white/10 dark:bg-black">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Engineering Reality Platform
        </h2>
      </div>
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-full bg-black/10 dark:bg-white/10" />
      </div>
    </header>
  );
}
