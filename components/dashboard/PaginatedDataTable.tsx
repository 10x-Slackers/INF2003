import type { Key } from "react";
import { DataTable, DataTableColumn } from "@/components/dashboard/DataTable";
import { PaginationWrapper } from "@/components/dashboard/PaginationWrapper";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type PaginatedDataTableProps<T> = {
  columns: readonly DataTableColumn<T>[];
  data: readonly T[];
  currentPage: number;
  pageCount: number;
  onPageChange?: (page: number) => void;
  getPageHref?: (page: number) => string;
  getRowKey?: (row: T, index: number) => Key;
  emptyMessage?: string;
};

export function PaginatedDataTable<T>({
  columns,
  data,
  currentPage,
  pageCount,
  onPageChange,
  getPageHref,
  getRowKey,
  emptyMessage,
}: PaginatedDataTableProps<T>) {
  return (
    <div className="flex flex-col gap-4">
      <DataTable
        columns={columns}
        data={data}
        emptyMessage={emptyMessage}
        getRowKey={getRowKey}
      />
      {onPageChange ? (
        <PaginationWrapper
          currentPage={currentPage}
          pageCount={pageCount}
          onPageChange={onPageChange}
        />
      ) : (
        getPageHref && (
          <LinkedPagination
            currentPage={currentPage}
            getPageHref={getPageHref}
            pageCount={pageCount}
          />
        )
      )}
    </div>
  );
}

function LinkedPagination({
  currentPage,
  getPageHref,
  pageCount,
}: {
  currentPage: number;
  getPageHref: (page: number) => string;
  pageCount: number;
}) {
  const pages = paginationItems(currentPage, pageCount);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            className={
              currentPage === 1 ? "pointer-events-none opacity-50" : ""
            }
            href={getPageHref(Math.max(currentPage - 1, 1))}
          />
        </PaginationItem>

        {pages.map((page) => (
          <PaginationItem key={page}>
            {typeof page === "number" ? (
              <PaginationLink
                href={getPageHref(page)}
                isActive={page === currentPage}
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
            href={getPageHref(Math.min(currentPage + 1, pageCount))}
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
