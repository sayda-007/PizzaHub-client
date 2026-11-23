"use client";

import { Button } from "@/components/ui/button";

export default function AdminConfirmBar({
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  pending = false,
  destructive = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div
      role="group"
      aria-label="Confirm action"
      aria-live="polite"
      className="mt-4 rounded-sm border border-line bg-paper p-3"
    >
      <p className="text-sm leading-relaxed text-charcoal">{message}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className={
            destructive
              ? "h-9 bg-destructive px-3 text-paper hover:bg-destructive/90"
              : "h-9 bg-tomato px-3 text-paper hover:bg-tomato-deep hover:text-paper"
          }
        >
          {pending ? "Working..." : confirmLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={pending}
          className="h-9 border-line bg-paper px-3 text-charcoal hover:bg-muted"
        >
          {cancelLabel}
        </Button>
      </div>
    </div>
  );
}
