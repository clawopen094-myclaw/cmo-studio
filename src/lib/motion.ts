"use client";

/**
 * Motion design tokens + reduced-motion aware variants.
 * Per ui-rules.md: hover/focus 120–150ms, drawer/dialog 180–220ms,
 * standard ease-out, no animation on initial page render, restrained
 * pulse on skeletons, prefers-reduced-motion honored.
 */

import type { Transition, Variants } from "motion/react";

const EASE_OUT: Transition["ease"] = [0.16, 1, 0.3, 1];

export const transitions = {
  /** Hover/focus micro-interactions on controls. */
  fast: { duration: 0.14, ease: EASE_OUT } as Transition,
  /** Drawer/dialog entrance. */
  medium: { duration: 0.2, ease: EASE_OUT } as Transition,
  /** Status / state morphs inside cards. */
  slow: { duration: 0.28, ease: EASE_OUT } as Transition,
};

/** Standard variants for elements that fade + lift in. */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: transitions.medium },
};

/** Drawer slide-in. */
export const drawer: Variants = {
  hidden: { x: "-100%" },
  visible: { x: 0, transition: transitions.medium },
  exit: { x: "-100%", transition: transitions.fast },
};

/** Popover fade + scale. */
export const popover: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: -4 },
  visible: { opacity: 1, scale: 1, y: 0, transition: transitions.fast },
  exit: { opacity: 0, scale: 0.96, y: -4, transition: transitions.fast },
};

/** Pulse for running/in-progress status dots. */
export const pulse: Variants = {
  initial: { opacity: 1 },
  animate: {
    opacity: [0.45, 1, 0.45],
    transition: { duration: 1.6, ease: "easeInOut", repeat: Infinity },
  },
};

/**
 * Read prefers-reduced-motion at runtime. Always returns `false` during
 * SSR to avoid hydration mismatches; the consuming component should also
 * check `useReducedMotion()` from motion/react for component-level guards.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}