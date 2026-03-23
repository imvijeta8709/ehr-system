import React from 'react';
import SymptomChecker from '../components/SymptomChecker';

export default function SymptomCheckerPage() {
  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-4">
        <i className="bi bi-robot" style={{ fontSize: '1.4rem', color: 'var(--primary)' }} />
        <h4 className="mb-0">AI Symptom Checker</h4>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card mb-3">
            <div className="card-body">
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 0 }}>
                Enter your symptoms in plain text or comma-separated format. The AI engine will analyze them and suggest possible conditions, recommended specialists, and next steps.
              </p>
            </div>
          </div>
          <SymptomChecker />
        </div>
      </div>
    </div>
  );
}
