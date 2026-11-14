"use client";

import * as React from "react";
import * as Primitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = Primitive.Root;
const DialogTrigger = Primitive.Trigger;
const DialogPortal = Primitive.Portal;
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof Primitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof Primitive.Overlay>
>(({ className, ...props }, ref) => (
  <Primitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-[300] bg-navy-900/40", className)}
    {...props}
  />
));
DialogOverlay.displayName = "DialogOverlay";

const DialogContent = React.forwardRef<
  React.ElementRef<typeof Primitive.Content>,
  React.ComponentPropsWithoutRef<typeof Primitive.Content>
>(
  (
    { children, className, onOpenAutoFocus, onCloseAutoFocus, ...props },
    ref,
  ) => {
    const opener = React.useRef<HTMLElement | null>(null);
    return (
      <DialogPortal>
        <DialogOverlay />
        <Primitive.Content
          ref={ref}
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => {
            opener.current =
              document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;
            onOpenAutoFocus?.(event);
          }}
          onCloseAutoFocus={(event) => {
            onCloseAutoFocus?.(event);
            if (!event.defaultPrevented && opener.current?.isConnected) {
              event.preventDefault();
              opener.current.focus();
            }
          }}
          className={cn(
            "fixed left-1/2 top-1/2 z-[300] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-2xl border border-warm-border bg-white p-5 shadow-xl focus:outline-none sm:p-6",
            className,
          )}
          {...props}
        >
          <Primitive.Close
            className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900"
            aria-label="Tutup dialog"
          >
            <X className="h-5 w-5" />
          </Primitive.Close>
          {children}
        </Primitive.Content>
      </DialogPortal>
    );
  },
);
DialogContent.displayName = "DialogContent";

function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 space-y-2 pr-9", className)} {...props} />;
}
function DialogTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Primitive.Title>) {
  return (
    <Primitive.Title
      className={cn("text-lg font-semibold text-navy-900", className)}
      {...props}
    />
  );
}
function DialogDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Primitive.Description>) {
  return (
    <Primitive.Description
      className={cn("text-sm leading-relaxed text-slate-600", className)}
      {...props}
    />
  );
}
function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}
function DialogClose({ children }: { children: React.ReactNode }) {
  return (
    <Primitive.Close asChild={React.isValidElement(children)}>
      {children}
    </Primitive.Close>
  );
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
