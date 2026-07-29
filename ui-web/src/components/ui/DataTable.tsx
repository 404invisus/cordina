'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  /** Tailwind grid-template-columns track, e.g. '1fr', '120px', 'minmax(0,2fr)'. */
  width?: string;
  render: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  /** For icon-only/action cells — sizes to content instead of truncating text. */
  shrink?: boolean;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  skeletonRows?: number;
  onRowClick?: (row: T) => void;
  /** Extra classes for a row — e.g. the inset accent-bar treatment for "needs attention" rows. */
  rowClassName?: (row: T) => string;
  emptyState?: React.ReactNode;
  title?: string;
  titleActions?: React.ReactNode;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
}

const alignClass = { left: 'text-left', right: 'text-right', center: 'text-center' };

export default function DataTable<T>({
  columns,
  data,
  rowKey,
  loading,
  skeletonRows = 6,
  onRowClick,
  rowClassName,
  emptyState,
  title,
  titleActions,
  page = 1,
  pageSize = 10,
  total,
  onPageChange,
}: DataTableProps<T>) {
  const gridStyle = { gridTemplateColumns: columns.map((c) => c.width ?? '1fr').join(' ') };
  const totalPages = total !== undefined ? Math.max(1, Math.ceil(total / pageSize)) : undefined;
  const showFooter = total !== undefined && onPageChange;

  return (
    <div className="bg-white border border-border rounded-[6px] overflow-hidden flex flex-col">
      {(title || titleActions) && (
        <div className="h-11 flex items-center gap-3 px-4 border-b border-border-subtle flex-none">
          {title && <span className="text-[12.5px] font-semibold text-navy-800 flex-none">{title}</span>}
          {titleActions && <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">{titleActions}</div>}
        </div>
      )}

      {/* Column headers */}
      <div className="grid px-4 h-[30px] items-center border-b border-border-subtle bg-surface-2 flex-none" style={gridStyle}>
        {columns.map((col) => (
          <div
            key={col.key}
            className={cn(
              'font-mono text-[9.5px] font-semibold tracking-[0.1em] text-text-muted uppercase truncate',
              alignClass[col.align ?? 'left'],
            )}
          >
            {col.header}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div className="flex-1">
        {loading ? (
          Array.from({ length: skeletonRows }).map((_, i) => (
            <div key={i} className="grid px-4 h-[42px] items-center border-b border-border-subtle" style={gridStyle}>
              {columns.map((col) => (
                <div key={col.key} className="pr-4">
                  <div
                    className="h-[10px] rounded-[2px] bg-border-subtle animate-pulse"
                    style={{ width: `${40 + ((col.key.length * 3) % 40)}%` }}
                  />
                </div>
              ))}
            </div>
          ))
        ) : data.length === 0 ? (
          <div className="py-2">{emptyState}</div>
        ) : (
          data.map((row) => (
            <div
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'grid px-4 h-[42px] items-center border-b border-border-subtle last:border-b-0 transition-colors',
                onRowClick && 'cursor-pointer hover:bg-surface-2',
                rowClassName?.(row),
              )}
              style={gridStyle}
            >
              {columns.map((col) =>
                col.shrink ? (
                  <div key={col.key} className={cn('flex text-[12.5px] text-navy-800', col.align === 'right' ? 'justify-end' : 'justify-start')}>
                    {col.render(row)}
                  </div>
                ) : (
                  <div key={col.key} className={cn('min-w-0 text-[12.5px] text-navy-800 truncate pr-4', alignClass[col.align ?? 'left'])}>
                    {col.render(row)}
                  </div>
                ),
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination footer */}
      {showFooter && (
        <div className="h-[38px] mt-auto border-t border-border-subtle bg-surface-2 px-4 flex items-center justify-between flex-none">
          <span className="font-mono text-[11px] text-text-muted">
            Showing {data.length === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, total!)} of {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange!(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="w-[22px] h-[22px] rounded-[4px] border border-border-input bg-white text-text-tertiary flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-2 transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <span className="font-mono text-[10.5px] font-semibold min-w-[22px] h-[22px] rounded-[4px] bg-navy-700 text-white flex items-center justify-center px-1.5">
              {page}
            </span>
            {totalPages !== undefined && <span className="font-mono text-[10.5px] text-text-muted px-1">/ {totalPages}</span>}
            <button
              onClick={() => onPageChange!(totalPages ? Math.min(totalPages, page + 1) : page + 1)}
              disabled={totalPages !== undefined && page >= totalPages}
              className="w-[22px] h-[22px] rounded-[4px] border border-border-input bg-white text-text-tertiary flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-2 transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
