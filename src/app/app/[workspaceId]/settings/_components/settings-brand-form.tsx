"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { LIMITS, overLimit } from "@/contracts/limits";
import { updateProfileAction } from "@/server/mock-runtime/store";

interface Initial {
  productSummary: string;
  audience: string;
  voice: string;
  approvedClaims: string[];
  restrictions: string[];
  defaultApprovalMode: "manual" | "auto";
}

interface Props {
  workspaceId: string;
  initial: Initial;
}

/**
 * Brand profile editor. Explicit Save and Cancel — never auto-save long
 * text per ui-rules.md. Keeps the user's values when Save fails.
 */
export function BrandSettingsForm({ workspaceId, initial }: Props) {
  const router = useRouter();
  const [state, setState] = React.useState({
    productSummary: initial.productSummary,
    audience: initial.audience,
    voice: initial.voice,
    approvedClaimsText: initial.approvedClaims.join("\n"),
    restrictionsText: initial.restrictions.join("\n"),
    defaultApprovalMode: initial.defaultApprovalMode,
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  function validate() {
    const next: Record<string, string> = {};
    if (!state.productSummary.trim()) {
      next.productSummary = "Required.";
    } else if (overLimit("productSummary", state.productSummary)) {
      next.productSummary = `Keep it under ${LIMITS.productSummary.max} characters.`;
    }
    if (state.audience && overLimit("audience", state.audience)) {
      next.audience = `Keep it under ${LIMITS.audience.max} characters.`;
    }
    if (state.voice && overLimit("voice", state.voice)) {
      next.voice = `Keep it under ${LIMITS.voice.max} characters.`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(false);
    if (!validate()) return;
    setSaving(true);
    try {
      await updateProfileAction({
        workspaceId,
        productSummary: state.productSummary.trim(),
        audience: state.audience.trim() || undefined,
        voice: state.voice.trim() || undefined,
        approvedClaims: state.approvedClaimsText
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
        restrictions: state.restrictionsText
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
      });
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={onSave}>
      <FormField label="Product summary" required error={errors.productSummary}>
        <Textarea
          value={state.productSummary}
          onChange={(e) =>
            setState((s) => ({ ...s, productSummary: e.target.value }))
          }
          rows={4}
        />
      </FormField>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Audience" error={errors.audience}>
          <Textarea
            value={state.audience}
            onChange={(e) =>
              setState((s) => ({ ...s, audience: e.target.value }))
            }
            rows={3}
          />
        </FormField>
        <FormField label="Voice" error={errors.voice}>
          <Textarea
            value={state.voice}
            onChange={(e) => setState((s) => ({ ...s, voice: e.target.value }))}
            rows={3}
          />
        </FormField>
      </div>
      <FormField label="Approved claims (one per line)">
        <Textarea
          value={state.approvedClaimsText}
          onChange={(e) =>
            setState((s) => ({ ...s, approvedClaimsText: e.target.value }))
          }
          rows={3}
        />
      </FormField>
      <FormField label="Restrictions (one per line)">
        <Textarea
          value={state.restrictionsText}
          onChange={(e) =>
            setState((s) => ({ ...s, restrictionsText: e.target.value }))
          }
          rows={3}
        />
      </FormField>
      <FormField
        label="Default approval mode"
        description="Applies to new campaigns in this workspace. Editing it does not change existing campaigns."
      >
        <Select
          value={state.defaultApprovalMode}
          onValueChange={(v) =>
            setState((s) => ({
              ...s,
              defaultApprovalMode: v === "auto" ? "auto" : "manual",
            }))
          }
          ariaLabel="Default approval mode"
          options={[
            { value: "manual", label: "Manual" },
            { value: "auto", label: "Auto" },
          ]}
        />
      </FormField>

      <div className="flex items-center justify-end gap-2">
        {saved ? (
          <span
            aria-live="polite"
            className="mr-auto text-xs text-app-success"
          >
            Saved.
          </span>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(`/app/${workspaceId}/chat/ai_cmo`)}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button type="submit" variant="default" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}