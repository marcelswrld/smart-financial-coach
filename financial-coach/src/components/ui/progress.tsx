import * as React from "react";
import { motion } from "framer-motion";

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={`w-full h-3 rounded-full bg-gray-200 overflow-hidden ${className}`}>
      <motion.div 
        className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-green-500"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ 
          duration: 1,
          ease: "easeOut",
          delay: 0.3
        }}
      />
    </div>
  );
}
