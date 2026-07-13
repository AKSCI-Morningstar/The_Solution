import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <header className="border-border flex items-center justify-center border-b px-6 py-4">
        <Link href="/" className="text-foreground text-lg font-semibold">
          The Morningstar Solution
        </Link>
      </header>
      <main className="flex flex-1">{children}</main>
    </div>
  );
}
