import React from 'react';

/* Full-page centered spinner */
export default function Spinner({ text = 'Loading...' }) {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center py-5 gap-3">
      <div style={{ position: 'relative', width: 44, height: 44 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          border: '3px solid var(--primary-light)',
          borderTopColor: 'var(--primary)',
          animation: 'spin 0.75s linear infinite',
        }} />
      </div>
      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>{text}</span>
    </div>
  );
}

/* Table skeleton — rows of shimmer lines */
export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="card">
      <div style={{ padding: '0.8rem 1rem', borderBottom: '2px solid var(--border)', display: 'flex', gap: 16 }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton skeleton-text" style={{ flex: i === 0 ? 2 : 1, height: 12 }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ padding: '0.9rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: 16, alignItems: 'center' }}>
          <div className="skeleton skeleton-circle" style={{ width: 32, height: 32, flexShrink: 0 }} />
          {Array.from({ length: cols - 1 }).map((_, c) => (
            <div key={c} className="skeleton skeleton-text" style={{ flex: c === 0 ? 2 : 1, height: 12 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* Card grid skeleton */
export function CardSkeleton({ count = 4 }) {
  return (
    <div className="row g-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="col-sm-6 col-xl-3">
          <div className="skeleton-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: 10 }} />
                <div className="skeleton skeleton-title" style={{ width: '40%' }} />
              </div>
              <div className="skeleton skeleton-circle" style={{ width: 44, height: 44 }} />
            </div>
            <div className="skeleton skeleton-text" style={{ width: '50%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* Inline button spinner */
export function BtnSpinner() {
  return (
    <span style={{
      display: 'inline-block', width: 14, height: 14,
      border: '2px solid rgba(255,255,255,0.4)',
      borderTopColor: '#fff',
      borderRadius: '50%',
      animation: 'spin 0.65s linear infinite',
    }} />
  );
}
