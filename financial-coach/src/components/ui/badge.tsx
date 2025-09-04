import * as React from "react";

export function Badge({ children, className, variant = "default" }: { children: React.ReactNode; className?: string; variant?: "default" | "secondary" }) {
  const variants: Record<"default" | "secondary", string> = {
    default: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800",
  };
  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
