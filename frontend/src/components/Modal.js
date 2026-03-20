import React, { useEffect, useRef } from 'react';

/**
 * Reusable animated modal.
 * Props: open, onClose, title, size ('sm'|'md'|'lg'|'xl'), children, footer
 */
export default function Modal({ open, onClose, title, size = 'md', children, footer }) {
  const overlayRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const widthMap = { sm: 420, md: 560, lg: 720, xl: 900 };

  return (
    <div
      ref={overlayRef}
      className="ehr-modal-overlay"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="ehr-modal"
        style={{ maxWidth: widthMap[size] }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="ehr-modal-header">
          <h5 id="modal-title" className="ehr-modal-title">{title}</h5>
          <button className="ehr-modal-close" onClick={onClose} aria-label="Close">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* Body */}
        <div className="ehr-modal-body">{children}</div>

        {/* Footer */}
        {footer && <div className="ehr-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
