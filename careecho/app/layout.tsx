import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MemorAId MVP",
  description: "Assistive caregiving prototype for repeated practical questions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
