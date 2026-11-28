import { Check, Circle, X } from "lucide-react";

import { orderTimeline, timelineState } from "@/lib/status";

export default function OrderTimeline({ status }) {
  const steps = orderTimeline(status);

  return (
    <ol className="relative space-y-5" aria-label="Order progress">
      {steps.map((step, index) => {
        const state = timelineState(status, index);
        const isCancelled = state === "cancelled";
        const isRejected = state === "rejected";
        const isComplete = state === "complete";

        return (
          <li key={step.key} className="relative flex gap-3">
            {index < steps.length - 1 ? (
              <span
                aria-hidden="true"
                className={`absolute top-6 left-[0.6875rem] h-[calc(100%+0.5rem)] w-px ${
                  isComplete ? "bg-olive" : "bg-line"
                }`}
              />
            ) : null}
            <span
              aria-hidden="true"
              className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border ${
                isComplete
                  ? "border-olive bg-olive text-paper"
                  : isCancelled || isRejected
                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                    : "border-line bg-muted text-ink-muted"
              }`}
            >
              {isComplete ? (
                <Check className="size-3.5" />
              ) : isCancelled || isRejected ? (
                <X className="size-3.5" />
              ) : (
                <Circle className="size-2 fill-current" />
              )}
            </span>
            <div>
              <p
                className={`text-sm font-medium ${
                  isComplete || isCancelled || isRejected
                    ? "text-charcoal"
                    : "text-ink-muted"
                }`}
              >
                {step.label}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                {isComplete
                  ? index === 0
                    ? "Your order is recorded."
                    : index === 1
                      ? "Waiting for the kitchen."
                      : "The kitchen has responded."
                  : isRejected
                    ? "The kitchen could not accept this order."
                    : isCancelled
                      ? "This step did not happen."
                      : "Not reached yet."}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
