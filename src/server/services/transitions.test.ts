/**
 * Smoke tests for the state transition tables. Pure-function tests; safe
 * to run in any Node environment.
 */

import {
  assertTransition,
  canTransition,
  isTerminal,
  TransitionError,
} from "./transitions";

const cases: Array<{
  name: string;
  pass: boolean;
  family: Parameters<typeof canTransition>[0];
  from: string;
  to: string;
}> = [
  { name: "campaign draft → running", pass: true, family: "campaign", from: "draft", to: "running" },
  { name: "campaign completed → running (rejected, terminal)", pass: false, family: "campaign", from: "completed", to: "running" },
  { name: "task queued → running", pass: true, family: "task", from: "queued", to: "running" },
  { name: "task completed → queued (rejected, terminal)", pass: false, family: "task", from: "completed", to: "queued" },
  { name: "approval pending → approved", pass: true, family: "approval", from: "pending", to: "approved" },
  { name: "approval pending → changes_requested", pass: true, family: "approval", from: "pending", to: "changes_requested" },
  { name: "approval approved → superseded", pass: true, family: "approval", from: "approved", to: "superseded" },
  { name: "approval superseded → approved (rejected, terminal)", pass: false, family: "approval", from: "superseded", to: "approved" },
  { name: "handoff needs_clarification → pending", pass: true, family: "handoff", from: "needs_clarification", to: "pending" },
  { name: "memory proposed → active", pass: true, family: "memory", from: "proposed", to: "active" },
  { name: "memory active → proposed (rejected)", pass: false, family: "memory", from: "active", to: "proposed" },
];

let failures = 0;
for (const c of cases) {
  const got = canTransition(
    c.family,
    c.from as never,
    c.to as never,
  );
  const ok = got === c.pass;
  if (!ok) {
    failures++;
    console.error(
      `[FAIL] ${c.name}: expected ${c.pass}, got ${got}`,
    );
  } else {
    console.log(`[ ok ] ${c.name}`);
  }
}

const terminalChecks: Array<[string, boolean]> = [
  ["completed", true],
  ["failed", true],
  ["cancelled", true],
  ["running", false],
  ["draft", false],
  ["pending", false],
];

for (const [status, expected] of terminalChecks) {
  const got = isTerminal(status as never);
  if (got !== expected) {
    failures++;
    console.error(
      `[FAIL] isTerminal(${status}): expected ${expected}, got ${got}`,
    );
  } else {
    console.log(`[ ok ] isTerminal(${status})`);
  }
}

try {
  assertTransition("approval", "superseded", "approved");
  failures++;
  console.error("[FAIL] assertTransition should have thrown");
} catch (err) {
  if (err instanceof TransitionError) {
    console.log(`[ ok ] assertTransition threw TransitionError`);
  } else {
    failures++;
    console.error(`[FAIL] assertTransition threw wrong error: ${err}`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log("\nAll transition tests passed.");