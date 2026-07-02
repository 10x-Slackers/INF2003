import type { MouseEvent } from "react";
import { getPaginationRange } from "@/components/dashboard/pagination-range";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type PaginationWrapperProps = {
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
};

export function PaginationWrapper({
  currentPage,
  pageCount,
  onPageChange,
}: PaginationWrapperProps) {
  const pages = getPaginationRange(currentPage, pageCount);

  function changePage(event: MouseEvent<HTMLAnchorElement>, page: number) {
    event.preventDefault();
    onPageChange(page);
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            className={
              currentPage === 1 ? "pointer-events-none opacity-50" : ""
            }
            href="#"
            onClick={(event) => changePage(event, currentPage - 1)}
          />
        </PaginationItem>

        {pages.map((page, index) =>
          page === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink
                href="#"
                isActive={page === currentPage}
                onClick={(event) => changePage(event, page)}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            className={
              currentPage === pageCount ? "pointer-events-none opacity-50" : ""
            }
            href="#"
            onClick={(event) => changePage(event, currentPage + 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
