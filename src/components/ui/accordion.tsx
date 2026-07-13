"use client";

import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  forwardRef,
  useState,
  Children,
  cloneElement,
  isValidElement,
} from "react";
import { cn } from "@/shared/utils";
import { ChevronDown } from "lucide-react";

export interface AccordionProps extends HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple";
  defaultValue?: string[];
}

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  ({ className = "", type = "single", defaultValue = [], ...props }, ref) => {
    const [openValues, setOpenValues] = useState<string[]>(defaultValue);

    const toggleValue = (value: string) => {
      if (type === "single") {
        setOpenValues(openValues.includes(value) ? [] : [value]);
      } else {
        setOpenValues(
          openValues.includes(value)
            ? openValues.filter((v) => v !== value)
            : [...openValues, value],
        );
      }
    };

    return (
      <div ref={ref} className={cn("divide-border divide-y", className)} {...props}>
        {Children.map(props.children as ReactNode, (child) => {
          if (isValidElement(child) && child.type === AccordionItem) {
            return cloneElement(
              child as React.ReactElement<{ openValues: string[]; onToggle: (v: string) => void }>,
              {
                openValues,
                onToggle: toggleValue,
              },
            );
          }
          return child;
        })}
      </div>
    );
  },
);

Accordion.displayName = "Accordion";

export interface AccordionItemProps {
  value: string;
  openValues?: string[];
  onToggle?: (value: string) => void;
  className?: string;
  children?: ReactNode;
}

export const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className = "", value, openValues = [], onToggle, children, ...props }, ref) => {
    const isOpen = openValues.includes(value);
    return (
      <div ref={ref} className={className} data-state={isOpen ? "open" : "closed"} {...props}>
        {Children.map(children as ReactNode, (child) => {
          if (isValidElement(child)) {
            if (child.type === AccordionTrigger) {
              return cloneElement(
                child as React.ReactElement<{ isOpen: boolean; onToggle: () => void }>,
                {
                  isOpen,
                  onToggle: () => onToggle?.(value),
                },
              );
            }
            if (child.type === AccordionContent) {
              return cloneElement(child as React.ReactElement<{ isOpen: boolean }>, { isOpen });
            }
          }
          return child;
        })}
      </div>
    );
  },
);

AccordionItem.displayName = "AccordionItem";

export interface AccordionTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isOpen?: boolean;
  onToggle?: () => void;
}

export const AccordionTrigger = forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className = "", isOpen, onToggle, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onToggle}
        className={cn(
          "text-foreground hover:text-muted-foreground focus-visible:ring-ring flex w-full items-center justify-between py-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown
          className={cn("size-4 shrink-0 transition-transform", isOpen && "rotate-180")}
        />
      </button>
    );
  },
);

AccordionTrigger.displayName = "AccordionTrigger";

export interface AccordionContentProps extends HTMLAttributes<HTMLDivElement> {
  isOpen?: boolean;
}

export const AccordionContent = forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className = "", isOpen, ...props }, ref) => {
    if (!isOpen) return null;
    return (
      <div
        ref={ref}
        className={cn("text-muted-foreground pt-0 pb-3 text-sm", className)}
        {...props}
      />
    );
  },
);

AccordionContent.displayName = "AccordionContent";
