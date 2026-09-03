import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Event Classics — Marketing Site",
  description: "Event Classics landing page.",
};

/**
 * Marketing route group. Preserves the original Event Classics look.
 * No app shell, no .cmo-app boundary, no product primitives. Marketing-only
 * effects (SmoothScroll, GSAP, shaders, Three.js) would be mounted here if
 * shipped. The prototype intentionally keeps this minimal.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}