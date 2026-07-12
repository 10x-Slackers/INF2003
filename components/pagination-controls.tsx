import { type FormEvent, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PaginationControls({
  page,
  totalPages,
  totalLabel,
  loading,
  onPrev,
  onNext,
  onGoToPage,
}: {
  page: number;
  totalPages: number;
  totalLabel: string;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
  onGoToPage: (page: number) => void;
}) {
  const [draft, setDraft] = useState({ page, value: String(page) });
  const draftValue = draft.page === page ? draft.value : String(page);

  function handleGoToPage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextPage = Math.min(totalPages, Math.max(1, Number(draftValue) || 1));
    setDraft({ page: nextPage, value: String(nextPage) });
    onGoToPage(nextPage);
  }

  return (
    <nav className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">{totalLabel}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={page <= 1 || loading}
        >
          <ChevronLeft />
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={page >= totalPages || loading}
        >
          <ChevronRight />
        </Button>
        <form className="flex items-center gap-2" onSubmit={handleGoToPage}>
          <Input
            className="w-16"
            type="number"
            min={1}
            max={totalPages}
            step={1}
            required
            value={draftValue}
            onChange={(event) => setDraft({ page, value: event.target.value })}
            disabled={loading}
          />
          <Button type="submit" size="sm" disabled={loading}>
            Go
          </Button>
        </form>
      </div>
    </nav>
  );
}
