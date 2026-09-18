import { forwardRef } from "react";

export const TextInput = forwardRef(function TextInput({ className = "", ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`w-full rounded border border-border bg-surface px-4 py-3 text-base text-fg placeholder:text-muted focus:border-fg focus:outline-none ${className}`}
      {...props}
    />
  );
});
