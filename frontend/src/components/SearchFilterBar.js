import React, { useState } from 'react';

/**
 * Reusable search + filter bar.
 *
 * Props:
 *  - search: string
 *  - onSearchChange: fn(value)
 *  - searchPlaceholder: string
 *  - filters: array of filter config objects (see below)
 *  - values: { [filterKey]: value }
 *  - onFilterChange: fn(key, value)
 *  - onReset: fn()
 *  - resultCount: number (optional)
 *  - resultLabel: string (optional, e.g. 'patient')
 *
 * Filter config object:
 *  { key, label, type: 'select'|'date'|'number', options: [{value, label}], placeholder }
 */
export default function SearchFilterBar({
  search = '',
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters = [],
  values = {},
  onFilterChange,
  onReset,
  resultCount,
  resultLabel = 'result',
}) {
  const [expanded, setExpanded] = useState(false);

  const activeFilterCount = filters.filter(f => values[f.key] && values[f.key] !== '').length;
  const hasAny = search || activeFilterCount > 0;

  return (
    <div className="card mb-3">
      <div className="card-body py-2 px-3">
        {/* Search row */}
        <div className="d-flex gap-2 align-items-center flex-wrap">
          <div className="input-group flex-grow-1" style={{ minWidth: 200 }}>
            <span className="input-group-text" style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', borderRight: 'none' }}>
              <i className="bi bi-search" style={{ color: 'var(--text-muted)' }} />
            </span>
            <input
              className="form-control"
              style={{ borderLeft: 'none' }}
              placeholder={searchPlaceholder}
              value={search}
              onChange={e => onSearchChange(e.target.value)}
            />
            {search && (
              <button className="btn btn-outline-secondary" onClick={() => onSearchChange('')}>
                <i className="bi bi-x" />
              </button>
            )}
          </div>

          {filters.length > 0 && (
            <button
              className={`btn btn-sm ${expanded ? 'btn-primary' : 'btn-outline-secondary'}`}
              style={{ whiteSpace: 'nowrap' }}
              onClick={() => setExpanded(v => !v)}
            >
              <i className="bi bi-funnel me-1" />
              Filters
              {activeFilterCount > 0 && (
                <span style={{ marginLeft: 6, background: expanded ? 'rgba(255,255,255,0.3)' : 'var(--primary)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: 99 }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}

          {hasAny && (
            <button className="btn btn-sm btn-outline-danger" onClick={onReset} title="Clear all filters">
              <i className="bi bi-x-circle me-1" />Clear
            </button>
          )}

          {resultCount !== undefined && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {resultCount} {resultLabel}{resultCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Filter panel */}
        {expanded && filters.length > 0 && (
          <div className="row g-2 mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            {filters.map(f => (
              <div key={f.key} className="col-6 col-md-4 col-lg-3">
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 3, display: 'block' }}>
                  {f.label}
                </label>
                {f.type === 'select' ? (
                  <select
                    className="form-select form-select-sm"
                    value={values[f.key] || ''}
                    onChange={e => onFilterChange(f.key, e.target.value)}
                  >
                    <option value="">All</option>
                    {(f.options || []).map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : f.type === 'date' ? (
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={values[f.key] || ''}
                    onChange={e => onFilterChange(f.key, e.target.value)}
                  />
                ) : f.type === 'number' ? (
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder={f.placeholder || ''}
                    min={f.min}
                    max={f.max}
                    value={values[f.key] || ''}
                    onChange={e => onFilterChange(f.key, e.target.value)}
                  />
                ) : (
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder={f.placeholder || ''}
                    value={values[f.key] || ''}
                    onChange={e => onFilterChange(f.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
