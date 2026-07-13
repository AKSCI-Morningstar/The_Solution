import { APP_NAME } from "@/shared/constants";

export function Footer() {
  return (
    <footer className="flex items-center justify-between border-t border-black/10 px-6 py-4 text-xs text-zinc-500 dark:border-white/10 dark:text-zinc-500">
      <span>&copy; {new Date().getFullYear()} AKSCI. All rights reserved.</span>
      <span>{APP_NAME}</span>
    </footer>
  );
}
