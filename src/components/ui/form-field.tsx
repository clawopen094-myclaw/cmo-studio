"use client";

import * as React from "react";
import { useId } from "react";

import { cn } from "@/lib/utils";

import { Label } from "./label";

interface FormFieldContextValue {
  id: string;
  invalid: boolean;
  descriptionId: string;
  errorId: string;
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(
  null,
);

function useFormField(): FormFieldContextValue {
  const ctx = React.useContext(FormFieldContext);
  if (!ctx) {
    throw new Error("FormField subcomponents must be rendered inside FormField.");
  }
  return ctx;
}

interface FormFieldProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Form field shell. Stable IDs for label/control/description/error
 * relationships, plus aria-invalid on the control via the FormFieldContext.
 * Used by every form primitive so screen-reader announcements are
 * consistent.
 */
function FormField({
  label,
  description,
  error,
  required,
  className,
  children,
}: FormFieldProps) {
  const id = useId();
  const ctx: FormFieldContextValue = {
    id,
    invalid: Boolean(error),
    descriptionId: `${id}-description`,
    errorId: `${id}-error`,
  };
  return (
    <FormFieldContext.Provider value={ctx}>
      <div className={cn("flex flex-col gap-1.5", className)}>
        <Label htmlFor={id}>
          {label}
          {required ? (
            <span className="ml-0.5 text-app-danger" aria-hidden>
              *
            </span>
          ) : null}
        </Label>
        {description ? (
          <p
            id={ctx.descriptionId}
            className="text-xs text-app-ink-muted"
          >
            {description}
          </p>
        ) : null}
        {children}
        {error ? (
          <p
            id={ctx.errorId}
            role="alert"
            className="text-xs text-app-danger"
          >
            {error}
          </p>
        ) : null}
      </div>
    </FormFieldContext.Provider>
  );
}

export { FormField, useFormField };
export type { FormFieldProps };