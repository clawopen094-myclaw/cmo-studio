"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { LIMITS, overLimit } from "@/contracts/limits";
import { createWorkspaceAction } from "@/server/mock-runtime/store";

/**
 * Brand workspace create form. Required fields: brand name and product
 * summary. Optional: audience, voice, approved claims, restrictions, and
 * default approval mode. Validation messages appear inline and are kept
 * until success — per ui-rules.md, do not close/reset on failure.
 */

interface State {
  name: string;
  productSummary: string;
  audience: string;
  voice: string;
  approvedClaimsText: string;
  restrictionsText: string;
  defaultApprovalMode: "manual" | "auto";
}

const INITIAL: State = {
  name: "",
  productSummary: "",
  audience: "",
  voice: "",
  approvedClaimsText: "",
  restrictionsText: "",
  defaultApprovalMode: "manual",
};

function parseList(s: string): string[] {
  return s
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

export function CreateWorkspaceForm() {
  const router = useRouter();
  const [state, setState] = React.useState<State>(INITIAL);
  const [errors, setErrors] = React.useState<Partial<Record<keyof State, string>>>(
    {},
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [topError, setTopError] = React.useState<string | null>(null);

  function update<K extends keyof State>(key: K, value: State[K]) {
    setState((s) => ({ ...s, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!state.name.trim()) {
      next.name = "Brand name is required.";
    } else if (overLimit("workspaceName", state.name)) {
      next.name = `Keep it under ${LIMITS.workspaceName.max} characters.`;
    }
    if (!state.productSummary.trim()) {
      next.productSummary = "Tell the agents what the brand sells.";
    } else if (overLimit("productSummary", state.productSummary)) {
      next.productSummary = `Keep it under ${LIMITS.productSummary.max} characters.`;
    }
    if (state.audience && overLimit("audience", state.audience)) {
      next.audience = `Keep it under ${LIMITS.audience.max} characters.`;
    }
    if (state.voice && overLimit("voice", state.voice)) {
      next.voice = `Keep it under ${LIMITS.voice.max} characters.`;
    }
    const claims = parseList(state.approvedClaimsText);
    if (
      overLimit("approvedClaims", claims) ||
      overLimit("approvedClaims", state.approvedClaimsText)
    ) {
      next.approvedClaimsText = `Up to ${LIMITS.approvedClaims.entries} claims, each under ${LIMITS.approvedClaims.each} characters.`;
    }
    const restrictions = parseList(state.restrictionsText);
    if (
      overLimit("restrictions", restrictions) ||
      overLimit("restrictions", state.restrictionsText)
    ) {
      next.restrictionsText = `Up to ${LIMITS.restrictions.entries} restrictions, each under ${LIMITS.restrictions.each} characters.`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTopError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { workspaceId } = await createWorkspaceAction({
        name: state.name.trim(),
        productSummary: state.productSummary.trim(),
        audience: state.audience.trim() || undefined,
        voice: state.voice.trim() || undefined,
        approvedClaims: parseList(state.approvedClaimsText),
        restrictions: parseList(state.restrictionsText),
        defaultApprovalMode: state.defaultApprovalMode,
      });
      router.push(`/app/${workspaceId}/chat/ai_cmo`);
    } catch (err) {
      setTopError("Could not create the workspace. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-6"
      aria-describedby={topError ? "create-workspace-top-error" : undefined}
    >
      {topError ? (
        <p
          id="create-workspace-top-error"
          role="alert"
          className="rounded-md border border-app-danger bg-app-danger-soft p-3 text-sm text-app-danger"
        >
          {topError}
        </p>
      ) : null}

      <FormField label="Brand name" required error={errors.name}>
        <Input
          value={state.name}
          onChange={(e) => update("name", e.target.value)}
          maxLength={LIMITS.workspaceName.max + 50}
          placeholder="Atelier Lumière"
        />
      </FormField>

      <FormField
        label="Product summary"
        required
        description="A short, plain-language description of what the brand sells."
        error={errors.productSummary}
      >
        <Textarea
          value={state.productSummary}
          onChange={(e) => update("productSummary", e.target.value)}
          placeholder="Hand-poured botanical candles sold direct to consumers."
          rows={4}
        />
      </FormField>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          label="Audience"
          description="Optional. Specific group of people this brand serves."
          error={errors.audience}
        >
          <Textarea
            value={state.audience}
            onChange={(e) => update("audience", e.target.value)}
            placeholder="Design-led shoppers aged 28–45."
            rows={3}
          />
        </FormField>
        <FormField
          label="Voice"
          description="Optional. How the brand sounds."
          error={errors.voice}
        >
          <Textarea
            value={state.voice}
            onChange={(e) => update("voice", e.target.value)}
            placeholder="Quiet, sensory, slightly poetic."
            rows={3}
          />
        </FormField>
      </div>

      <FormField
        label="Approved claims"
        description="One per line. Optional."
        error={errors.approvedClaimsText}
      >
        <Textarea
          value={state.approvedClaimsText}
          onChange={(e) => update("approvedClaimsText", e.target.value)}
          placeholder={
            "Hand-poured in small batches.\n100% soy wax with cotton wicks."
          }
          rows={3}
        />
      </FormField>

      <FormField
        label="Restrictions"
        description="One per line. Things the brand must avoid."
        error={errors.restrictionsText}
      >
        <Textarea
          value={state.restrictionsText}
          onChange={(e) => update("restrictionsText", e.target.value)}
          placeholder={
            "Do not claim organic certification.\nAvoid urgency language."
          }
          rows={3}
        />
      </FormField>

      <FormField
        label="Default approval mode"
        description="Manual waits for your decision before simulated production. Auto continues after preflight."
      >
        <Select
          value={state.defaultApprovalMode}
          onValueChange={(v) =>
            update(
              "defaultApprovalMode",
              v === "auto" ? "auto" : "manual",
            )
          }
          ariaLabel="Default approval mode"
          options={[
            {
              value: "manual",
              label: "Manual",
              description:
                "Wait for your decision at pre-production before media generation.",
            },
            {
              value: "auto",
              label: "Auto",
              description:
                "Continue automatically after preflight validation. The decision is still recorded.",
            },
          ]}
        />
      </FormField>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/app/workspaces")}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" variant="default" disabled={submitting}>
          {submitting ? "Creating…" : "Create brand"}
        </Button>
      </div>
    </form>
  );
}