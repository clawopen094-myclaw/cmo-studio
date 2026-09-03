/**
 * Boundary limits. Contract constants — never scattered literals. Mirrors the
 * table in architecture.md. Values may change only through context review.
 */

export const LIMITS = {
  workspaceName: { min: 1, max: 80 },
  productSummary: { max: 2_000 },
  audience: { max: 2_000 },
  voice: { max: 2_000 },
  approvedClaims: { entries: 25, each: 500 },
  restrictions: { entries: 25, each: 500 },
  campaignTitle: { max: 120 },
  campaignObjective: { max: 2_000 },
  campaignAudience: { max: 2_000 },
  campaignDeliverable: { max: 2_000 },
  campaignProductField: { max: 2_000 },
  campaignChannel: { max: 100 },
  campaignDuration: { max: 100 },
  campaignCallToAction: { max: 500 },
  userMessage: { max: 12_000 },
  memoryRecord: { max: 4_000 },
  artifactBody: { max: 200_000 },
  runProgressEvent: { max: 32 * 1024 },
  runTerminalResult: { max: 512 * 1024 },
  sseOutboxPayload: { max: 16 * 1024 },
} as const;

export type LimitKey = keyof typeof LIMITS;

export function overLimit(
  field: LimitKey,
  value: string | string[],
): boolean {
  const limit = LIMITS[field] as { max?: number; entries?: number; each?: number };
  if (Array.isArray(value)) {
    if (limit.entries !== undefined && value.length > limit.entries) return true;
    if (limit.each !== undefined) {
      return value.some((v) => v.length > limit.each);
    }
    return false;
  }
  if (limit.max !== undefined && value.length > limit.max) return true;
  return false;
}