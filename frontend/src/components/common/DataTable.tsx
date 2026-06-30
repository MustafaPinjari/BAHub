import React, { useState, useMemo } from "react";
import { cn } from "../../lib/utils";
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronsUpDown, 
  Search, 
  ChevronLeft, 
  ChevronRight
} from "lucide-react";
import { Button } from "./UIComponents";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

export interface BulkAction<T> {
  label: string;
  action: (selectedRows: T[]) => void;
  variant?: "primary" | "secondary" | "destructive" | "outline";
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  bulkActions?: BulkAction<T>[];
  onRowClick?: (row: T) => void;
  initialSortKey?: string;
  initialSortDir?: "asc" | "desc";
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  searchPlaceholder = "Search items...",
  searchKeys = [],
  bulkActions = [],
  onRowClick,
  initialSortKey = "",
  initialSortDir = "asc",
}: DataTableProps<T>) {
  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<string>(initialSortKey);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(initialSortDir);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map((c) => c.key))
  );
  const [showColVisibilityMenu, setShowColVisibilityMenu] = useState(false);

  // Sorting Handler
  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // Row Selection Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>, paginatedRows: T[]) => {
    if (e.target.checked) {
      const newSelected = new Set(selectedIds);
      paginatedRows.forEach((row) => {
        if (row.id !== undefined) newSelected.add(row.id);
      });
      setSelectedIds(newSelected);
    } else {
      const newSelected = new Set(selectedIds);
      paginatedRows.forEach((row) => {
        if (row.id !== undefined) newSelected.delete(row.id);
      });
      setSelectedIds(newSelected);
    }
  };

  const handleSelectRow = (e: React.ChangeEvent<HTMLInputElement>, id: string | number) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (e.target.checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  // Filter & Search
  const filteredRows = useMemo(() => {
    if (!searchTerm || searchKeys.length === 0) return data;

    return data.filter((row) => {
      return searchKeys.some((key) => {
        const val = row[key];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm, searchKeys]);

  // Sort Rows
  const sortedRows = useMemo(() => {
    if (!sortKey) return filteredRows;

    return [...filteredRows].sort((a: any, b: any) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }

      const aString = String(aVal).toLowerCase();
      const bString = String(bVal).toLowerCase();

      if (aString < bString) return sortDir === "asc" ? -1 : 1;
      if (aString > bString) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortKey, sortDir]);

  // Paginated Rows
  const paginatedRows = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return sortedRows.slice(startIdx, startIdx + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  // Total pages
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));

  // Determine if all in page are selected
  const allPageSelected = useMemo(() => {
    if (paginatedRows.length === 0) return false;
    return paginatedRows.every((row) => row.id !== undefined && selectedIds.has(row.id));
  }, [paginatedRows, selectedIds]);

  const selectedObjects = useMemo(() => {
    return data.filter((row) => row.id !== undefined && selectedIds.has(row.id));
  }, [data, selectedIds]);

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {/* Table Controls (Search, Column Visibility, Bulk Actions) */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg bg-card border border-border text-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none placeholder:text-muted-foreground/60"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Column Visibility Selector */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColVisibilityMenu(!showColVisibilityMenu)}
              className="text-xs font-semibold"
            >
              Columns
            </Button>
            {showColVisibilityMenu && (
              <div className="absolute right-0 mt-1.5 w-48 bg-card shadow-lg rounded-xl border border-border p-2.5 z-20 flex flex-col gap-1 select-none text-foreground">
                <span className="text-[10px] font-bold text-muted-foreground px-2 py-1 uppercase tracking-wider">
                  Toggle Columns
                </span>
                {columns.map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-secondary text-xs font-medium cursor-pointer text-foreground"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns.has(col.key)}
                      onChange={(e) => {
                        const newCols = new Set(visibleColumns);
                        if (e.target.checked) {
                          newCols.add(col.key);
                        } else {
                          if (newCols.size > 1) {
                            newCols.delete(col.key);
                          }
                        }
                        setVisibleColumns(newCols);
                      }}
                      className="rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Actions Panel */}
      {selectedIds.size > 0 && bulkActions.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-secondary border border-border rounded-lg text-xs">
          <span className="font-semibold text-foreground">
            {selectedIds.size} row{selectedIds.size > 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            {bulkActions.map((act) => (
              <Button
                key={act.label}
                variant={act.variant || "outline"}
                size="sm"
                onClick={() => {
                  act.action(selectedObjects);
                  setSelectedIds(new Set());
                }}
                className="text-xs font-bold py-1 px-2.5"
              >
                {act.label}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs font-semibold py-1 px-2"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="w-full overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="border-b border-border bg-secondary/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none">
              {bulkActions.length > 0 && (
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={(e) => handleSelectAll(e, paginatedRows)}
                    className="rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                  />
                </th>
              )}
              {columns
                .filter((col) => visibleColumns.has(col.key))
                .map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key, col.sortable)}
                    className={cn(
                      "p-3.5 select-none text-[11px]",
                      col.sortable ? "cursor-pointer hover:bg-secondary" : ""
                    )}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      {col.label}
                      {col.sortable && (
                        <span className="opacity-60">
                          {sortKey !== col.key ? (
                            <ChevronsUpDown className="w-3 h-3" />
                          ) : sortDir === "asc" ? (
                            <ChevronUp className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-primary" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs text-foreground font-medium">
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.filter((c) => visibleColumns.has(c.key)).length + (bulkActions.length > 0 ? 1 : 0)}
                  className="p-8 text-center text-muted-foreground font-medium"
                >
                  No items found matching search terms.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, idx) => {
                const isSelected = row.id !== undefined && selectedIds.has(row.id);
                return (
                  <tr
                    key={row.id || idx}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      "hover:bg-secondary/30 transition-colors duration-100",
                      onRowClick ? "cursor-pointer" : "",
                      isSelected ? "bg-primary/10 hover:bg-primary/15 text-primary" : ""
                    )}
                  >
                    {bulkActions.length > 0 && (
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => row.id !== undefined && handleSelectRow(e, row.id)}
                          className="rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                        />
                      </td>
                    )}
                    {columns
                      .filter((col) => visibleColumns.has(col.key))
                      .map((col) => (
                        <td key={col.key} className="p-3.5 align-middle truncate">
                          {col.render ? col.render(row) : (row as any)[col.key]}
                        </td>
                      ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {sortedRows.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between py-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 select-none font-medium">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-card border border-border rounded-md px-1.5 py-0.5 outline-none text-foreground cursor-pointer font-bold"
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>of {sortedRows.length} items</span>
          </div>

          <div className="flex items-center gap-1.5 select-none">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="p-1 px-1.5 rounded-md"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="px-2 font-bold text-foreground">
              {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="p-1 px-1.5 rounded-md"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
