import * as React from "react";

export function Separator({ className }: { className?: string }) {
  return <hr className={`border-t border-gray-300 my-4 ${className}`} />;
}
