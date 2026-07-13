import { APP_NAME } from "@/shared/constants";

export function Footer() {
  return (
    <footer className="border-border text-muted-foreground flex items-center justify-between border-t px-6 py-4 text-xs">
      <span>&copy; {new Date().getFullYear()} AKSCI. All rights reserved.</span>
      <span>{APP_NAME}</span>
    </footer>
  );
}
