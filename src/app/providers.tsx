"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          // This ensures the toasts match your rounded-2xl/xl UI theme
          style: {
            borderRadius: "1.25rem",
            padding: "16px",
          },
          className: "font-sans",
        }}
      />
    </SessionProvider>
  );
}
