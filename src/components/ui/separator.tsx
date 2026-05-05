import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type SeparatorProps = HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical";
};

export function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorProps) {
  return (
    <div
      className={cn(
        "shrink-0 bg-slate-700/50",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      role="separator"
      aria-orientation={orientation}
      {...props}
    />
  );
}
