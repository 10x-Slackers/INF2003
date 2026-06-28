import type { Key, ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  cell?: (row: T) => ReactNode;
  className?: string;
  skeletonClassName?: string;
};

type DataTableProps<T> = {
  columns: readonly DataTableColumn<T>[];
  data: readonly T[];
  getRowKey?: (row: T, index: number) => Key;
  emptyMessage?: string;
  skeletonRows?: number;
};

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  emptyMessage = "No records found.",
  skeletonRows = 0,
}: DataTableProps<T>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.key}>{column.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {skeletonRows > 0
          ? Array.from({ length: skeletonRows }, (_, row) => (
              <TableRow key={row}>
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    <Skeleton
                      className={column.skeletonClassName ?? "h-5 w-full"}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))
          : data.map((row, index) => (
              <TableRow key={getRowKey?.(row, index) ?? index}>
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.cell?.(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
        {skeletonRows === 0 && data.length === 0 && (
          <TableRow>
            <TableCell colSpan={columns.length}>{emptyMessage}</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
