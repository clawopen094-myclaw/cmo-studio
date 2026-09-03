/**
 * Backward-compat re-export. The implementation moved to
 * src/server/services/store.ts in Phase 2.06. Existing imports keep
 * working; new code should import from "@/server/services/store" and
 * access the typed `repositories` facade for read/write consistency.
 */
export * from "@/server/services/store";