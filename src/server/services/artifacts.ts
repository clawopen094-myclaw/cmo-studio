"use server";

/**
 * Artifact service. Versioning is keyed on (workspace, logical_key,
 * version); each version is immutable, hashed, and carries exact input
 * provenance. A new creative-package version supersedes prior approval
 * and marks downstream artifacts stale.
 */

import { fingerprint } from "@/lib/utils";
import { store } from "@/server/services/store-impl";
import type { Artifact, Id } from "@/contracts/types";

interface CreateArtifactInput {
  brandWorkspaceId: Id;
  logicalKey: string;
  type: Artifact["type"];
  title: string;
  producingAgentKey: Artifact["producingAgentKey"];
  sourceRunId?: Id;
  threadId?: Id;
  campaignId?: Id;
  taskId?: Id;
  body: string;
  mimeType: string;
  isSimulated: boolean;
  inputArtifactIds: Id[];
}

export function nextArtifactVersion(
  brandWorkspaceId: Id,
  logicalKey: string,
): number {
  const versions = store.artifacts
    .filter(
      (a) =>
        a.brandWorkspaceId === brandWorkspaceId && a.logicalKey === logicalKey,
    )
    .map((a) => a.version);
  return (versions.length === 0 ? 0 : Math.max(...versions)) + 1;
}

export function supersedePriorArtifacts(
  brandWorkspaceId: Id,
  logicalKey: string,
): void {
  for (const a of store.artifacts) {
    if (a.brandWorkspaceId === brandWorkspaceId && a.logicalKey === logicalKey) {
      if (a.status === "current") {
        a.status = "superseded";
      }
    }
  }
}

export function createArtifactVersion(input: CreateArtifactInput): Artifact {
  const version = nextArtifactVersion(input.brandWorkspaceId, input.logicalKey);
  supersedePriorArtifacts(input.brandWorkspaceId, input.logicalKey);
  const artifact: Artifact = {
    id: `art_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    customerId: "",
    brandWorkspaceId: input.brandWorkspaceId,
    logicalKey: input.logicalKey,
    version,
    type: input.type,
    title: input.title,
    producingAgentKey: input.producingAgentKey,
    sourceRunId: input.sourceRunId,
    threadId: input.threadId,
    campaignId: input.campaignId,
    taskId: input.taskId,
    body: input.body,
    mimeType: input.mimeType,
    sha256: fingerprint({ body: input.body }),
    status: "current",
    isSimulated: input.isSimulated,
    createdAt: new Date().toISOString(),
    inputArtifactIds: input.inputArtifactIds,
  };
  store.artifacts.push(artifact);
  return artifact;
}