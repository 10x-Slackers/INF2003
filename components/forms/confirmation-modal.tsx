"use client";

import { Button } from "@/components/ui/button";

type ConfirmationItem = {
  label: string;
  value: string;
};

export function ConfirmationModal({
  open,
  title,
  description,
  items,
  confirmLabel = "Confirm",
  pending,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description?: string;
  items: ConfirmationItem[];
  confirmLabel?: string;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-lg border bg-background p-5 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
      >
        <div className="grid gap-2">
          <h2 id="confirmation-title" className="text-lg font-semibold">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        <dl className="mt-4 grid gap-3 text-sm">
          {items.map((item) => (
            <div key={item.label} className="grid gap-1">
              <dt className="text-muted-foreground">{item.label}</dt>
              <dd>{item.value || "-"}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="button" disabled={pending} onClick={onConfirm}>
            {pending ? "Working..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
