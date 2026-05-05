import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-700/50 bg-slate-800/70 backdrop-blur-sm p-5 shadow-lg shadow-black/10",
        className,
      )}
      {...props}
    />
  );
}
