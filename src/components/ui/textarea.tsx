import { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none resize-y",
        "placeholder:text-slate-500",
        "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
        "transition-colors",
        className,
      )}
      {...props}
    />
  );
}
