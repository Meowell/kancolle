"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type DialogContextValue = { open: boolean; setOpen: (open: boolean) => void };
const DialogContext = React.createContext<DialogContextValue | null>(null);
function useDialog() {
  const ctx = React.useContext(DialogContext);
  if (!ctx) throw new Error("Dialog compound components must be used within <Dialog>");
  return ctx;
}

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <DialogContext.Provider value={{ open, setOpen: onOpenChange }}>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {children}
      </div>
    </DialogContext.Provider>
  );
}

export function DialogContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { setOpen } = useDialog();
  return (
    <div
      className={cn(
        "relative z-50 w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/40",
        "max-h-[85vh] overflow-auto",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      <button
        type="button"
        className="absolute right-4 top-3 text-slate-500 hover:text-slate-300 text-lg leading-none transition-colors"
        onClick={() => setOpen(false)}
        aria-label="关闭"
      >
        ✕
      </button>
      {children}
    </div>
  );
}

export function DialogHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4", className)} {...props}>{children}</div>;
}

export function DialogTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold text-white", className)} {...props}>{children}</h2>;
}

export function DialogDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1 text-sm text-slate-400", className)} {...props}>{children}</p>;
}

export function DialogFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-6 flex items-center justify-end gap-3", className)} {...props}>{children}</div>;
}
