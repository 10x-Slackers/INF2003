export type PaginationRangeItem = number | "ellipsis";

export function getPaginationRange(
  currentPage: number,
  pageCount: number,
): PaginationRangeItem[] {
  const siblingCount = 1;
  const totalVisible = siblingCount * 2 + 5;

  if (pageCount <= totalVisible) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const start = Math.max(2, currentPage - siblingCount);
  const end = Math.min(pageCount - 1, currentPage + siblingCount);
  const pages: PaginationRangeItem[] = [1];

  if (start > 2) pages.push("ellipsis");
  for (let page = start; page <= end; page++) pages.push(page);
  if (end < pageCount - 1) pages.push("ellipsis");

  pages.push(pageCount);
  return pages;
}
