"use client";

import { type HTMLAttributes, forwardRef, useState, createContext, useContext } from "react";
import { cn } from "@/shared/utils";

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs subcomponents must be used within Tabs");
  return ctx;
}

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  (
    { className = "", defaultValue, value: controlledValue, onValueChange, children, ...props },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState(defaultValue ?? "");
    const value = controlledValue ?? internalValue;
    const changeValue = onValueChange ?? setInternalValue;

    return (
      <TabsContext.Provider value={{ value, onValueChange: changeValue }}>
        <div ref={ref} className={className} data-value={value} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  },
);

Tabs.displayName = "Tabs";

export type TabsListProps = HTMLAttributes<HTMLDivElement>;

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ className = "", ...props }, ref) => {
    return <div ref={ref} role="tablist" className={className} {...props} />;
  },
);

TabsList.displayName = "TabsList";

export interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className = "", value, ...props }, ref) => {
    const { value: selectedValue, onValueChange } = useTabsContext();
    const isSelected = value === selectedValue;
    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={isSelected}
        className={cn("transition-colors", className)}
        data-state={isSelected ? "active" : "inactive"}
        onClick={() => onValueChange(value)}
        {...props}
      />
    );
  },
);

TabsTrigger.displayName = "TabsTrigger";

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className = "", value, ...props }, ref) => {
    const { value: selectedValue } = useTabsContext();
    if (value !== selectedValue) return null;
    return <div ref={ref} role="tabpanel" className={className} data-state="active" {...props} />;
  },
);

TabsContent.displayName = "TabsContent";
