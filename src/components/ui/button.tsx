import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40",
        "hover:-translate-y-0.5 active:translate-y-0",
        variant === "primary" &&
          "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20",
        variant === "secondary" &&
          "border border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:border-slate-500",
        variant === "danger" &&
          "bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/20",
        variant === "ghost" &&
          "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60",
        className,
      )}
      {...props}
    />
  );
}
