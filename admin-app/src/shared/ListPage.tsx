import React, { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { PageHeader, SectionCard } from './ui';

export interface ListColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

interface Props<T> {
  title: string;
  subtitle?: string;
  rows: T[];
  columns: ListColumn<T>[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T | ((row: T) => string))[];
  statusFilter?: { key: string; label: string; match: (row: T) => boolean }[];
  onRowClick?: (row: T) => void;
  onCreate?: () => void;
  createLabel?: string;
  headerActions?: React.ReactNode;
  prepend?: React.ReactNode;
  emptyLabel?: string;
  pageSize?: number;
  getRowId: (row: T) => string;
}

export function ListPage<T>({
  title,
  subtitle,
  rows,
  columns,
  searchPlaceholder = 'ค้นหา...',
  searchKeys = [],
  statusFilter = [],
  onRowClick,
  onCreate,
  createLabel = 'สร้างใหม่',
  headerActions,
  prepend,
  emptyLabel = 'ไม่พบรายการ',
  pageSize = 20,
  getRowId,
}: Props<T>) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((row) => {
      const matchFilter = filter === 'all' || statusFilter.find((f) => f.key === filter)?.match(row);
      if (!matchFilter) return false;
      if (!query) return true;
      const hay = searchKeys.map((k) => (typeof k === 'function' ? k(row) : String(row[k] ?? ''))).join(' ').toLowerCase();
      return hay.includes(query);
    });
  }, [rows, q, filter, searchKeys, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="module-list-page bo-list-page">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={(
          <>
            {headerActions}
            {onCreate && (
              <button type="button" className="primary-btn" onClick={onCreate}>
                <Plus size={16} /> {createLabel}
              </button>
            )}
          </>
        )}
      />

      {prepend}

      <SectionCard title="">
        <div className="bo-list-card-toolbar">
          <div className="module-search bo-search">
            <Search size={16} />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder={searchPlaceholder}
            />
          </div>
          {statusFilter.length > 0 && (
            <div className="module-filter-chips">
              <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => { setFilter('all'); setPage(1); }}>ทั้งหมด</button>
              {statusFilter.map((f) => (
                <button key={f.key} type="button" className={filter === f.key ? 'active' : ''} onClick={() => { setFilter(f.key); setPage(1); }}>
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="module-table-wrap bo-table-wrap">
          <table className="module-table bo-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className={c.className}>{c.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr><td colSpan={columns.length} className="module-empty">{emptyLabel}</td></tr>
              ) : pageRows.map((row) => (
                <tr
                  key={getRowId(row)}
                  className={onRowClick ? 'clickable' : ''}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={c.className}>{c.render(row)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length > pageSize && (
          <div className="module-pagination bo-pagination">
            <span>{filtered.length} รายการ</span>
            <div>
              <button type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>ก่อนหน้า</button>
              <span>{safePage} / {totalPages}</span>
              <button type="button" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>ถัดไป</button>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
