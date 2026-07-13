import type { ReactNode } from "react";
import { ThemeProvider } from "./theme-provider";
import { ErrorBoundary } from "./error-boundary";

export { ThemeProvider, useTheme } from "./theme-provider";
export { ErrorBoundary } from "./error-boundary";

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>{children}</ThemeProvider>
    </ErrorBoundary>
  );
}
