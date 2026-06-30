import type { MouseEvent } from "react";
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
  const pages = paginationItems(currentPage, pageCount);

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

        {pages.map((page) => (
          <PaginationItem key={page}>
            {typeof page === "number" ? (
              <PaginationLink
                href="#"
                isActive={page === currentPage}
                onClick={(event) => changePage(event, page)}
              >
                {page}
              </PaginationLink>
            ) : (
              <PaginationEllipsis />
            )}
          </PaginationItem>
        ))}

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

function paginationItems(currentPage: number, pageCount: number) {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const pages: Array<number | string> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(pageCount - 1, currentPage + 1);

  if (start > 2) pages.push("start-ellipsis");
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < pageCount - 1) pages.push("end-ellipsis");
  pages.push(pageCount);

  return pages;
}
