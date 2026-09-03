import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Form label. Persistent visible label — never replaced by placeholder text.
 * Used through FormField; do not pass className to change colors.
 */
function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      data-slot="label"
      className={cn(
        "text-sm font-medium leading-none text-app-ink",
        className,
      )}
      {...props}
    />
  );
}

export { Label };