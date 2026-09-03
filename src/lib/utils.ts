import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Canonical className composition helper. Used by every primitive and
 * feature component. The second-use rule in code-standards.md says this is
 * the only place that combines clsx + tailwind-merge.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Stable opaque ID factory. UUID v4-shaped without crypto dependency so the
 * prototype can run without a server. Replace with crypto.randomUUID() in
 * the persistence phase.
 */
export function makeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const t = Date.now().toString(36);
  return `${prefix}_${t}${rand}`;
}

/**
 * Format an ISO timestamp as a short relative label, e.g. "just now",
 * "3m ago", "2h ago", "Mar 4". Server-safe and locale-aware.
 */
export function formatRelative(iso: string, now = Date.now()): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const diff = now - t;
  const sec = Math.round(diff / 1000);
  if (sec < 30) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return new Date(t).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/**
 * Stable SHA-256-ish content fingerprint over a JSON-serializable value.
 * Prototype only — uses FNV-1a over the JSON string. Replace with Web Crypto
 * sha256 in the persistence phase so we match the architecture's hash column.
 */
export function fingerprint(value: unknown): string {
  const json = JSON.stringify(value, Object.keys(value as object).sort());
  let hash = 0x811c9dc5;
  for (let i = 0; i < json.length; i++) {
    hash ^= json.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/**
 * Sentence-case helper. Status labels, page titles, and headings should use
 * sentence case per ui-tokens.md.
 */
export function sentenceCase(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}