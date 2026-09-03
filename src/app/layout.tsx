import type { Metadata } from "next";
import "./globals.css";

/**
 * Root layout. Owns only global CSS, font registration, and neutral document
 * structure. Marketing providers live in (marketing)/layout.tsx; the product
 * shell in src/app/app/layout.tsx. Per code-standards.md and library-docs.md.
 */
export const metadata: Metadata = {
  title: "CMO Studio",
  description: "Multi-brand AI marketing workspace.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}