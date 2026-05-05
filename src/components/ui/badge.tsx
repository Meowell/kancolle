import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "outline" | "accent";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-blue-600 text-white",
  secondary: "bg-slate-700 text-slate-300",
  outline: "border border-slate-600 text-slate-400",
  accent: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
