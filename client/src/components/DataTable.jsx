import { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search } from 'lucide-react';

const PAGE_SIZE = 10;

export default function DataTable({ columns, data, searchPlaceholder = 'Search...', emptyMessage = 'No data.' }) {
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  });

  const rows = table.getRowModel().rows;
  const pageCount = table.getPageCount();
  const pageIndex = table.getState().pagination.pageIndex;

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-3">
        <div className="relative w-full max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <span className="whitespace-nowrap text-xs text-slate-400">{data.length} total</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={`px-4 py-2 ${header.column.getCanSort() ? 'cursor-pointer select-none hover:text-slate-700' : ''}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' && <ArrowUp size={12} />}
                      {header.column.getIsSorted() === 'desc' && <ArrowDown size={12} />}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2.5 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 p-3 text-sm text-slate-500">
          <span>
            Page {pageIndex + 1} of {pageCount}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1 disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1 disabled:opacity-40"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
