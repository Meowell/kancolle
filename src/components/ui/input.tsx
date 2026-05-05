import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none",
        "placeholder:text-slate-500",
        "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
        "transition-colors",
        type === "file" && "file:mr-3 file:rounded-md file:border-0 file:bg-slate-700 file:px-3 file:py-1 file:text-xs file:text-slate-300 file:cursor-pointer hover:file:bg-slate-600",
        className,
      )}
      {...props}
    />
  );
}
