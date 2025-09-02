"use client";
import {
   ColumnDef,
   flexRender,
   getCoreRowModel,
   useReactTable,
   getPaginationRowModel,
   SortingState,
   getSortedRowModel,
   ColumnFiltersState,
   getFilteredRowModel,
} from "@tanstack/react-table";

import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import UserAvatar from "../common/UserAvatar";
import BlockButton from "../block/BlockButton";
import { useBlock } from "@/hooks/use-block";
import { trpc } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { format } from "date-fns";
export type BlockedUser = {
   username: string;
   userId: string;
   imageUrl: string;
   createAt: string;
   isBlocked: boolean;
};

export function DataTable() {
   const [sorting, setSorting] = useState<SortingState>([]);
   const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

   const { data } = trpc.blocks.getMany.useInfiniteQuery(
      {
         limit: DEFAULT_LIMIT,
      },
      {
         getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
   );

   const formatDate = useMemo(() => {
      return (date: Date) => format(date, "dd/MM/yyyy");
   }, []);

   const columns: ColumnDef<BlockedUser>[] = useMemo(
      () => [
         {
            accessorKey: "username",
            header: ({ column }) => (
               <Button
                  variant="ghost"
                  onClick={() => {
                     column.toggleSorting(column.getIsSorted() === "asc");
                  }}
               >
                  Username
                  <ArrowUpDown className=" ml-2 h-4 w-4" />
               </Button>
            ),
            cell: ({ row }) => (
               <div className="flex items-center gap-x-2">
                  <UserAvatar
                     name={row.original.username}
                     imageUrl={row.original.imageUrl}
                  />
                  <span>{row.original.username}</span>
               </div>
            ),
         },
         {
            accessorKey: "createAt",
            header: ({ column }) => (
               <Button
                  variant="ghost"
                  onClick={() => {
                     column.toggleSorting(column.getIsSorted() === "asc");
                  }}
               >
                  Date blocked
                  <ArrowUpDown className=" ml-2 h-4 w-4" />
               </Button>
            ),
         },
         {
            accessorKey: "actions",
            cell: ({ row }) => {
               return (
                  <UnblockCell
                     userId={row.original.userId}
                     isBlocked={row.original.isBlocked}
                  />
               );
            },
         },
      ],
      []
   );
   const processedData = useMemo(() => {
      return (
         data?.pages.flatMap((page) =>
            page.items.map((item) => ({
               username: item.blocked.name,
               imageUrl: item.blocked.imageUrl,
               userId: item.blocked.id,
               createAt: formatDate(item.blocked.createdAt),
               isBlocked: true,
            }))
         ) ?? []
      );
   }, [data, formatDate]);
   const table = useReactTable({
      data: processedData,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      onSortingChange: setSorting,
      getSortedRowModel: getSortedRowModel(),
      onColumnFiltersChange: setColumnFilters,
      getFilteredRowModel: getFilteredRowModel(),
      state: {
         sorting,
         columnFilters,
      },
   });

   return (
      <div>
         <div className="flex items-center py-4">
            <Input
               placeholder="Filter users..."
               value={
                  (table.getColumn("username")?.getFilterValue() as string) ??
                  ""
               }
               onChange={(event) =>
                  table
                     .getColumn("username")
                     ?.setFilterValue(event.target.value)
               }
               className="max-w-sm"
            />
         </div>
         <div className="rounded-md border">
            <Table>
               <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                     <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                           return (
                              <TableHead key={header.id}>
                                 {header.isPlaceholder
                                    ? null
                                    : flexRender(
                                         header.column.columnDef.header,
                                         header.getContext()
                                      )}
                              </TableHead>
                           );
                        })}
                     </TableRow>
                  ))}
               </TableHeader>
               <TableBody>
                  {table.getRowModel().rows?.length ? (
                     table.getRowModel().rows.map((row) => (
                        <TableRow
                           key={row.id}
                           data-state={row.getIsSelected() && "selected"}
                        >
                           {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                 {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                 )}
                              </TableCell>
                           ))}
                        </TableRow>
                     ))
                  ) : (
                     <TableRow>
                        <TableCell
                           colSpan={columns.length}
                           className="h-24 text-center"
                        >
                           No results.
                        </TableCell>
                     </TableRow>
                  )}
               </TableBody>
            </Table>
         </div>
         <div className="flex items-center justify-end space-x-2 py-4">
            <Button
               variant="outline"
               size="sm"
               onClick={() => table.previousPage()}
               disabled={!table.getCanPreviousPage()}
            >
               Previous
            </Button>
            <Button
               variant="outline"
               size="sm"
               onClick={() => table.nextPage()}
               disabled={!table.getCanNextPage()}
            >
               Next
            </Button>
         </div>
      </div>
   );
}

function UnblockCell({
   userId,
   isBlocked,
}: {
   userId: string;
   isBlocked: boolean;
}) {
   const { isPending, onClick } = useBlock({ userId, isBlocked });
   return (
      <BlockButton
         style="full"
         onClick={onClick}
         disabled={isPending}
         isBlocked={isBlocked}
      />
   );
}
