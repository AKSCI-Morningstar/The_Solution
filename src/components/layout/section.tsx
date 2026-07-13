import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/shared/utils";

export interface SectionProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export const Section = forwardRef<HTMLDivElement, SectionProps>(
  ({ className = "", title, description, action, children, ...props }, ref) => {
    return (
      <section ref={ref} className={cn("flex flex-col gap-4", className)} {...props}>
        {(title || action) && (
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              {title && <h2 className="text-foreground text-base font-semibold">{title}</h2>}
              {description && <p className="text-muted-foreground text-sm">{description}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
        )}
        {children}
      </section>
    );
  },
);

Section.displayName = "Section";
