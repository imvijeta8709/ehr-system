import React from 'react';

export default function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null;
  return (
    <nav>
      <ul className="pagination justify-content-center">
        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onPageChange(page - 1)}>Previous</button>
        </li>
        {[...Array(pages)].map((_, i) => (
          <li key={i} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
            <button className="page-link" onClick={() => onPageChange(i + 1)}>{i + 1}</button>
          </li>
        ))}
        <li className={`page-item ${page === pages ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onPageChange(page + 1)}>Next</button>
        </li>
      </ul>
    </nav>
  );
}
