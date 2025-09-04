import * as React from "react";

export function Switch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onCheckedChange(!checked)}
      className={`w-12 h-6 flex items-center rounded-full p-1 transition ${checked ? "bg-green-500" : "bg-gray-300"}`}
    >
      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${checked ? "translate-x-6" : ""}`} />
    </button>
  );
}
