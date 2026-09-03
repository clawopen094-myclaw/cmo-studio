"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

type ThemePreference = "dark" | "light" | "system";

const STORAGE_KEY = "cmo-studio-theme";

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: "dark" | "light";
  setPreference: (p: ThemePreference) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

/**
 * Theme provider. Resolves System to dark/light before paint; .cmo-app owns
 * data-theme. Marketing routes are untouched.
 */
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = React.useState<ThemePreference>(
    () => {
      if (typeof window === "undefined") return "dark";
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "dark" || stored === "light" || stored === "system") {
        return stored;
      }
      return "dark";
    },
  );

  const [systemDark, setSystemDark] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const resolved: "dark" | "light" =
    preference === "system" ? (systemDark ? "dark" : "light") : preference;

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.querySelector(".cmo-app");
    if (!root) return;
    root.setAttribute("data-theme", resolved);
  }, [resolved]);

  const setPreference = React.useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, p);
    }
  }, []);

  const value = React.useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider.");
  return ctx;
}

/**
 * Compact theme selector. Lives in the top bar. Icon + label for the active
 * preference plus the two unselected icons as toggles. No raw palette
 * utilities — uses semantic tokens only.
 */
function ThemeSelector() {
  const { preference, setPreference } = useTheme();
  const options: Array<{ key: ThemePreference; icon: React.ElementType; label: string }> =
    [
      { key: "dark", icon: Moon, label: "Dark" },
      { key: "light", icon: Sun, label: "Light" },
      { key: "system", icon: Monitor, label: "System" },
    ];
  return (
    <div
      role="radiogroup"
      aria-label="Theme preference"
      className="flex items-center gap-1 rounded-md border border-app-border-strong p-0.5"
    >
      {options.map((opt) => {
        const isActive = preference === opt.key;
        const Icon = opt.icon;
        return (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={opt.label}
            onClick={() => setPreference(opt.key)}
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-sm text-app-ink-muted hover:bg-app-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus",
              isActive && "bg-app-surface-subtle text-app-ink",
            )}
          >
            <Icon aria-hidden className="size-4" />
          </button>
        );
      })}
    </div>
  );
}

export { ThemeProvider, ThemeSelector, useTheme };
export type { ThemePreference };