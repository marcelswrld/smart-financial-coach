import * as React from "react";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  return <input className={`w-full rounded-md border p-2 ${className}`} {...props} />;
}
