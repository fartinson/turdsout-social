"use client";

import { AppStateProvider } from "@/lib/app-state";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AppStateProvider>{children}</AppStateProvider>;
}
