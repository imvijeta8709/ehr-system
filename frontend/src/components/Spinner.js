import React from 'react';

export default function Spinner() {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center py-5 gap-2">
      <div
        className="spinner-border"
        role="status"
        style={{ color: 'var(--primary)', width: '2rem', height: '2rem', borderWidth: '3px' }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Loading...</span>
    </div>
  );
}
