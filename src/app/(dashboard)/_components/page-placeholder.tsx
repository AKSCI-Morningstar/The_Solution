import { Breadcrumbs } from "@/components/layout";
import type { PageMeta } from "@/shared/types";
import Link from "next/link";

interface PagePlaceholderProps {
  meta: PageMeta;
}

function PagePlaceholder({ meta }: PagePlaceholderProps) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex flex-col gap-2">
        <Breadcrumbs items={meta.breadcrumbs} />
        <h1 className="text-3xl font-bold tracking-tight text-black dark:text-zinc-50">
          {meta.title}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">{meta.description}</p>
      </div>
      <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-black/10 dark:border-white/10">
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
            <span className="text-2xl">&#9733;</span>
          </div>
          <p className="text-lg font-medium text-black dark:text-zinc-50">{meta.title}</p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
            This module is coming soon.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex items-center text-sm text-black underline underline-offset-4 dark:text-zinc-50"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export { PagePlaceholder };
