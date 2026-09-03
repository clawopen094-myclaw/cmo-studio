import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";

import { CreateWorkspaceForm } from "../_components/create-workspace-form";

export default function NewWorkspacePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <Link
        href="/app/workspaces"
        className="mb-4 inline-flex items-center gap-1 text-sm text-app-ink-muted hover:text-app-ink"
      >
        <ChevronLeft aria-hidden className="size-4" />
        Back to brands
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Create a brand workspace</CardTitle>
          <CardDescription>
            Brand name and product summary are required. The other fields help
            the agents write better copy. You can edit them later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateWorkspaceForm />
        </CardContent>
      </Card>
    </div>
  );
}