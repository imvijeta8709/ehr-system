import React from 'react';

export default function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null;

  // Show max 5 page numbers around current
  const range = [];
  const delta = 2;
  for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) {
    range.push(i);
  }

  return (
    <nav aria-label="Pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
      <button
        className="page-link"
        style={{ border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 4 }}
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
      >
        <i className="bi bi-chevron-left" style={{ fontSize: '0.75rem' }} />
      </button>

      {range[0] > 1 && (
        <>
          <button className="page-link" style={{ border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)' }} onClick={() => onPageChange(1)}>1</button>
          {range[0] > 2 && <span style={{ color: 'var(--text-muted)', padding: '0 4px' }}>…</span>}
        </>
      )}

      {range.map(i => (
        <button
          key={i}
          className="page-link"
          style={{
            border: `1.5px solid ${i === page ? 'var(--primary)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-sm)',
            background: i === page ? 'var(--primary)' : 'var(--surface)',
            color: i === page ? '#fff' : 'var(--text)',
            fontWeight: i === page ? 700 : 400,
            minWidth: 36,
            textAlign: 'center',
          }}
          onClick={() => onPageChange(i)}
        >
          {i}
        </button>
      ))}

      {range[range.length - 1] < pages && (
        <>
          {range[range.length - 1] < pages - 1 && <span style={{ color: 'var(--text-muted)', padding: '0 4px' }}>…</span>}
          <button className="page-link" style={{ border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)' }} onClick={() => onPageChange(pages)}>{pages}</button>
        </>
      )}

      <button
        className="page-link"
        style={{ border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 4 }}
        onClick={() => onPageChange(page + 1)}
        disabled={page === pages}
      >
        <i className="bi bi-chevron-right" style={{ fontSize: '0.75rem' }} />
      </button>

      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 8 }}>
        Page {page} of {pages}
      </span>
    </nav>
  );
}
