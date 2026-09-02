"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

export function ThemeProvider({ children, attribute, defaultTheme }: { children: ReactNode; attribute: "class"; defaultTheme?: string }) {
  return (
    <NextThemesProvider attribute={attribute} defaultTheme={defaultTheme} enableSystem>
      {children}
    </NextThemesProvider>
  );
}
