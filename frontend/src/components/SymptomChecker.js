import React, { useState, useCallback } from 'react';
import api from '../utils/api';

const URGENCY_CONFIG = {
  emergency: { color: '#dc2626', bg: '#fff0f0', border: '#fca5a5', label: 'EMERGENCY', icon: 'bi-exclamation-octagon-fill' },
  high:      { color: '#ea580c', bg: '#fff7ed', border: '#fdba74', label: 'HIGH',      icon: 'bi-exclamation-triangle-fill' },
  medium:    { color: '#d97706', bg: '#fffbeb', border: '#fcd34d', label: 'MEDIUM',    icon: 'bi-exclamation-circle-fill' },
  low:       { color: '#16a34a', bg: '#f0fdf4', border: '#86efac', label: 'LOW',       icon: 'bi-info-circle-fill' },
};

export default function SymptomChecker({ symptomsText = '' }) {
  const [input, setInput] = useState(symptomsText);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = useCallback(async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/ai/suggest', { symptoms: input });
      setResults(data.suggestions);
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }, [input]);

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginTop: 8 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #2A7FFF 0%, #00C9A7 100%)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <i className="bi bi-robot text-white" style={{ fontSize: '1.1rem' }} />
        <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>AI Symptom Checker</span>
        <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
          RULE-BASED
        </span>
      </div>

      <div style={{ padding: 16, background: 'var(--bg)' }}>
        <div className="d-flex gap-2 mb-3">
          <textarea
            className="form-control form-control-sm"
            rows={2}
            placeholder="e.g. fever, cough, shortness of breath, loss of smell..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ resize: 'none', fontSize: '0.85rem' }}
          />
          <button
            className="btn btn-primary btn-sm"
            style={{ whiteSpace: 'nowrap', alignSelf: 'flex-end' }}
            onClick={analyze}
            disabled={loading || !input.trim()}
          >
            {loading
              ? <span className="spinner-border spinner-border-sm" />
              : <><i className="bi bi-search me-1" />Analyze</>
            }
          </button>
        </div>

        {error && <div className="alert alert-danger py-2 mb-3" style={{ fontSize: '0.82rem' }}>{error}</div>}

        {results !== null && results.length === 0 && (
          <div className="text-center py-3" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <i className="bi bi-search d-block mb-1" style={{ fontSize: '1.4rem' }} />
            No matching conditions found. Try adding more specific symptoms.
          </div>
        )}

        {results && results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {results.map((r, i) => {
              const cfg = URGENCY_CONFIG[r.urgency] || URGENCY_CONFIG.low;
              return (
                <div key={i} style={{ border: `1px solid ${cfg.border}`, borderRadius: 10, background: cfg.bg, overflow: 'hidden' }}>
                  {/* Condition header */}
                  <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <i className={`bi ${cfg.icon}`} style={{ color: cfg.color, fontSize: '1rem' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>{r.name}</span>
                    <span style={{ marginLeft: 'auto', background: cfg.color, color: '#fff', fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
                      {cfg.label}
                    </span>
                    <span style={{ background: 'rgba(0,0,0,0.07)', color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99 }}>
                      {r.score}% match
                    </span>
                  </div>

                  <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Description */}
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.description}</p>

                    {/* Specialty */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className="bi bi-person-badge" style={{ color: '#2A7FFF', fontSize: '0.8rem' }} />
                      <span style={{ fontSize: '0.78rem', color: '#2A7FFF', fontWeight: 600 }}>{r.specialty}</span>
                    </div>

                    {/* Matched symptoms chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {r.matchedSymptoms.map((s, j) => (
                        <span key={j} style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--text)', fontSize: '0.7rem', padding: '2px 8px', borderRadius: 99, fontWeight: 500 }}>
                          {s}
                        </span>
                      ))}
                    </div>

                    {/* Recommendations */}
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.78rem', color: 'var(--text)', lineHeight: 1.7 }}>
                      {r.recommendations.map((rec, j) => <li key={j}>{rec}</li>)}
                    </ul>
                  </div>
                </div>
              );
            })}

            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
              <i className="bi bi-info-circle me-1" />
              This is a rule-based suggestion tool, not a medical diagnosis. Always consult a qualified physician.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
