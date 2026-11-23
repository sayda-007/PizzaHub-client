import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Pagination({ pagination, onChange, disabled = false }) {
  const page = pagination?.page ?? 1;
  const totalPages = pagination?.totalPages ?? 0;
  const totalItems = pagination?.totalItems ?? 0;

  if (totalItems === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Results pages"
      className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5"
    >
      <p aria-live="polite" className="text-xs text-ink-muted">
        Page {page} of {totalPages} · {totalItems} total
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || page <= 1}
          onClick={() => onChange(page - 1)}
          className="border-line bg-paper text-charcoal hover:bg-muted"
        >
          <ChevronLeft aria-hidden="true" />
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="border-line bg-paper text-charcoal hover:bg-muted"
        >
          Next
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
