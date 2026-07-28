import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Sheet Root ───────────────────────────────────────────────────────────────
interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const SheetContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>({ open: false, onOpenChange: () => {} });

function Sheet({ open = false, onOpenChange = () => {}, children }: SheetProps) {
  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

// ─── Sheet Trigger ────────────────────────────────────────────────────────────
function SheetTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const { onOpenChange } = React.useContext(SheetContext);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => onOpenChange(true),
    });
  }
  return <button onClick={() => onOpenChange(true)}>{children}</button>;
}

// ─── Sheet Overlay ────────────────────────────────────────────────────────────
function SheetOverlay({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { open, onOpenChange } = React.useContext(SheetContext);
  if (!open) return null;
  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] bg-navy-900/30 backdrop-blur-sm",
        "animate-in fade-in-0 duration-200",
        className
      )}
      onClick={() => onOpenChange(false)}
      {...props}
    />
  );
}

// ─── Sheet Content — panel geser dari sisi layar ──────────────────────────────
// Sesuai COMPONENT_INVENTORY.md: dipakai untuk form tambahan di mobile-width
interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "left" | "right" | "top" | "bottom";
  children: React.ReactNode;
}

function SheetContent({ side = "right", children, className, ...props }: SheetContentProps) {
  const { open, onOpenChange } = React.useContext(SheetContext);
  if (!open) return null;

  const sideClasses = {
    right: "right-0 top-0 h-full w-full max-w-sm border-l",
    left: "left-0 top-0 h-full w-full max-w-sm border-r",
    top: "top-0 left-0 w-full max-h-96 border-b",
    bottom: "bottom-0 left-0 w-full max-h-96 border-t",
  };

  return (
    <>
      <SheetOverlay />
      <div
        className={cn(
          "fixed z-[200] bg-white shadow-lg",
          sideClasses[side],
          "animate-in slide-in-from-right duration-300",
          className
        )}
        {...props}
      >
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 text-gray-400 hover:text-navy-900 transition-colors"
          aria-label="Tutup panel"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </>
  );
}

// ─── Sheet sub-components ─────────────────────────────────────────────────────
function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pt-6 pb-4 border-b border-warm-border space-y-1", className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-base font-bold text-navy-900", className)} {...props} />;
}

function SheetDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-gray-500", className)} {...props} />;
}

function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-6 py-4 border-t border-warm-border flex justify-end gap-2", className)}
      {...props}
    />
  );
}

function SheetClose({ children }: { children: React.ReactNode }) {
  const { onOpenChange } = React.useContext(SheetContext);
  if (React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => onOpenChange(false),
    });
  }
  return <button onClick={() => onOpenChange(false)}>{children}</button>;
}

export { Sheet, SheetTrigger, SheetOverlay, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose };
