import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Dialog Root ─────────────────────────────────────────────────────────────
interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const DialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>({ open: false, onOpenChange: () => {} });

function Dialog({ open = false, onOpenChange = () => {}, children }: DialogProps) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

// ─── Dialog Trigger ───────────────────────────────────────────────────────────
function DialogTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const { onOpenChange } = React.useContext(DialogContext);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => onOpenChange(true),
    });
  }
  return <button onClick={() => onOpenChange(true)}>{children}</button>;
}

// ─── Dialog Portal (Overlay + Content wrapper) ────────────────────────────────
function DialogPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// ─── Dialog Overlay ───────────────────────────────────────────────────────────
function DialogOverlay({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { open, onOpenChange } = React.useContext(DialogContext);
  if (!open) return null;
  return (
    <div
      className={cn(
        "fixed inset-0 z-[300] bg-navy-900/40 backdrop-blur-sm",
        "animate-in fade-in-0 duration-200",
        className
      )}
      onClick={() => onOpenChange(false)}
      {...props}
    />
  );
}

// ─── Dialog Content ───────────────────────────────────────────────────────────
interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function DialogContent({ children, className, ...props }: DialogContentProps) {
  const { open, onOpenChange } = React.useContext(DialogContext);
  if (!open) return null;
  return (
    <>
      <DialogOverlay />
      <div
        className={cn(
          "fixed left-1/2 top-1/2 z-[300] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2",
          "max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain bg-white rounded-lg shadow-lg border border-warm-border p-4 sm:p-6",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          className
        )}
        {...props}
      >
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 rounded-md p-1 text-gray-400 transition-colors hover:bg-slate-100 hover:text-navy-900 sm:right-4 sm:top-4"
          aria-label="Tutup dialog"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </>
  );
}

// ─── Dialog sub-components ────────────────────────────────────────────────────
function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 space-y-1.5", className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-base font-bold text-navy-900", className)} {...props} />;
}

function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-gray-500 leading-relaxed", className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2", className)}
      {...props}
    />
  );
}

function DialogClose({ children }: { children: React.ReactNode }) {
  const { onOpenChange } = React.useContext(DialogContext);
  if (React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => onOpenChange(false),
    });
  }
  return <button onClick={() => onOpenChange(false)}>{children}</button>;
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
};
