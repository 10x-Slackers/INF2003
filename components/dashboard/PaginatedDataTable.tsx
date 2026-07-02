import type { Key } from "react";
import { DataTable, DataTableColumn } from "@/components/dashboard/DataTable";
import { getPaginationRange } from "@/components/dashboard/pagination-range";
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
  const pages = getPaginationRange(currentPage, pageCount);

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

        {pages.map((page, index) =>
          page === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink
                href={getPageHref(page)}
                isActive={page === currentPage}
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
            href={getPageHref(Math.min(currentPage + 1, pageCount))}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
