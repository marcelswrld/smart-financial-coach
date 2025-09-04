import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
  variant?: "default" | "outline" | "ghost";
};

export function Button({ children, className, variant = "default", ...props }: ButtonProps) {
  const base = "px-4 py-2 rounded-lg transition";
  const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border bg-white text-gray-800 hover:bg-gray-50",
    ghost: "text-gray-800 hover:bg-gray-100",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
