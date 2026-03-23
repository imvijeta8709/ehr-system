import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import Spinner from '../components/Spinner';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Generate half-hour slots 08:00 AM – 07:00 PM
function generateAllSlots() {
  const slots = [];
  for (let h = 8; h <= 19; h++) {
    ['00', '30'].forEach(m => {
      if (h === 19 && m === '30') return;
      const period = h < 12 ? 'AM' : 'PM';
      const hour12 = h <= 12 ? h : h - 12;
      slots.push(`${String(hour12).padStart(2, '0')}:${m} ${period}`);
    });
  }
  return slots;
}
const ALL_SLOTS = generateAllSlots();

function SlotPicker({ selected, onChange }) {
  const toggle = (slot) => {
    if (selected.includes(slot)) onChange(selected.filter(s => s !== slot));
    else onChange([...selected, slot].sort((a, b) => ALL_SLOTS.indexOf(a) - ALL_SLOTS.indexOf(b)));
  };
  return (
    <div className="d-flex flex-wrap gap-1 mt-1">
      {ALL_SLOTS.map(slot => (
        <button
          key={slot}
          type="button"
          onClick={() => toggle(slot)}
          style={{
            padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer',
            border: selected.includes(slot) ? '1.5px solid var(--primary)' : '1px solid var(--border)',
            background: selected.includes(slot) ? 'var(--primary)' : 'var(--card-bg)',
            color: selected.includes(slot) ? '#fff' : 'var(--text)',
            fontWeight: selected.includes(slot) ? 600 : 400,
          }}
        >
          {slot}
        </button>
      ))}
    </div>
  );
}

export default function DoctorAvailability() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // weeklySchedule: array of { day: 0-6, slots: [] }
  const [weekly, setWeekly] = useState(
    DAYS.map((_, i) => ({ day: i, slots: [], enabled: false }))
  );
  // overrides: { date: 'YYYY-MM-DD', slots: [], isOff: bool }
  const [overrides, setOverrides] = useState([]);
  const [overrideDate, setOverrideDate] = useState('');
  const [overrideSlots, setOverrideSlots] = useState([]);
  const [overrideIsOff, setOverrideIsOff] = useState(false);
  const [activeTab, setActiveTab] = useState('weekly');

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/availability/me/schedule');
      const sched = res.data.schedule;
      if (sched?.weeklySchedule?.length) {
        setWeekly(DAYS.map((_, i) => {
          const found = sched.weeklySchedule.find(w => w.day === i);
          return { day: i, slots: found?.slots || [], enabled: !!(found?.slots?.length) };
        }));
      }
      if (sched?.overrides) setOverrides(sched.overrides);
    } catch {
      // no schedule yet — defaults fine
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  const handleSaveWeekly = async () => {
    setSaving(true);
    try {
      const weeklySchedule = weekly
        .filter(w => w.enabled && w.slots.length > 0)
        .map(w => ({ day: w.day, slots: w.slots }));
      await api.put('/availability', { weeklySchedule, overrides });
      toast.success('Schedule saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (i) => {
    setWeekly(w => w.map((d, idx) => idx === i ? { ...d, enabled: !d.enabled, slots: !d.enabled ? d.slots : [] } : d));
  };

  const setDaySlots = (i, slots) => {
    setWeekly(w => w.map((d, idx) => idx === i ? { ...d, slots } : d));
  };

  const handleAddOverride = async () => {
    if (!overrideDate) return toast.error('Select a date');
    if (!overrideIsOff && overrideSlots.length === 0) return toast.error('Add slots or mark as day off');
    try {
      const res = await api.patch('/availability/override', {
        date: overrideDate, slots: overrideSlots, isOff: overrideIsOff,
      });
      setOverrides(res.data.schedule.overrides);
      setOverrideDate(''); setOverrideSlots([]); setOverrideIsOff(false);
      toast.success('Override saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const removeOverride = async (date) => {
    const newOverrides = overrides.filter(o => o.date !== date);
    try {
      await api.put('/availability', {
        weeklySchedule: weekly.filter(w => w.enabled && w.slots.length).map(w => ({ day: w.day, slots: w.slots })),
        overrides: newOverrides,
      });
      setOverrides(newOverrides);
      toast.success('Override removed');
    } catch {
      toast.error('Failed to remove');
    }
  };

  if (loading) return <Spinner />;

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-0">My Availability</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
            Set your weekly schedule and date-specific overrides
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="d-flex gap-2 mb-4">
        {['weekly', 'overrides'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '7px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
              background: activeTab === tab ? 'var(--primary)' : 'var(--card-bg)',
              color: activeTab === tab ? '#fff' : 'var(--text)',
              boxShadow: activeTab === tab ? '0 2px 8px rgba(42,127,255,0.25)' : 'none',
            }}
          >
            <i className={`bi ${tab === 'weekly' ? 'bi-calendar-week' : 'bi-calendar-event'} me-2`} />
            {tab === 'weekly' ? 'Weekly Schedule' : 'Date Overrides'}
            {tab === 'overrides' && overrides.length > 0 && (
              <span style={{ marginLeft: 6, background: '#ef4444', color: '#fff', fontSize: '0.65rem', padding: '1px 6px', borderRadius: 99 }}>
                {overrides.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Weekly Schedule */}
      {activeTab === 'weekly' && (
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
              Toggle days on/off and select available time slots for each day.
            </p>
            {weekly.map((dayObj, i) => (
              <div key={i} className="mb-3 p-3 rounded" style={{ border: '1px solid var(--border)', background: dayObj.enabled ? 'var(--bg)' : 'transparent' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="form-check form-switch mb-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`day-${i}`}
                      checked={dayObj.enabled}
                      onChange={() => toggleDay(i)}
                      style={{ cursor: 'pointer' }}
                    />
                    <label className="form-check-label fw-semibold" htmlFor={`day-${i}`} style={{ cursor: 'pointer', minWidth: 90 }}>
                      {DAYS[i]}
                    </label>
                  </div>
                  {dayObj.enabled && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {dayObj.slots.length} slot{dayObj.slots.length !== 1 ? 's' : ''} selected
                    </span>
                  )}
                </div>
                {dayObj.enabled && (
                  <SlotPicker selected={dayObj.slots} onChange={(slots) => setDaySlots(i, slots)} />
                )}
              </div>
            ))}
            <div className="mt-3">
              <button className="btn btn-primary" onClick={handleSaveWeekly} disabled={saving}>
                {saving ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-check2 me-2" />}
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Overrides */}
      {activeTab === 'overrides' && (
        <div className="row g-3">
          {/* Add override */}
          <div className="col-md-5">
            <div className="card h-100">
              <div className="card-body">
                <h6 className="mb-3">Add Date Override</h6>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Override your weekly schedule for a specific date — add custom slots or mark as day off.
                </p>
                <div className="mb-3">
                  <label className="form-label">Date *</label>
                  <input type="date" className="form-control" value={overrideDate} min={today}
                    onChange={e => { setOverrideDate(e.target.value); setOverrideSlots([]); }} />
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="isOff" checked={overrideIsOff}
                      onChange={e => { setOverrideIsOff(e.target.checked); if (e.target.checked) setOverrideSlots([]); }} />
                    <label className="form-check-label" htmlFor="isOff">Mark as Day Off (no appointments)</label>
                  </div>
                </div>
                {!overrideIsOff && (
                  <div className="mb-3">
                    <label className="form-label">Custom Slots</label>
                    <SlotPicker selected={overrideSlots} onChange={setOverrideSlots} />
                  </div>
                )}
                <button className="btn btn-primary btn-sm" onClick={handleAddOverride}>
                  <i className="bi bi-plus-lg me-1" />Add Override
                </button>
              </div>
            </div>
          </div>

          {/* Existing overrides */}
          <div className="col-md-7">
            <div className="card h-100">
              <div className="card-body">
                <h6 className="mb-3">Existing Overrides</h6>
                {overrides.length === 0 ? (
                  <div className="text-center py-4" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <i className="bi bi-calendar-check d-block mb-2" style={{ fontSize: '2rem' }} />
                    No overrides set
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {[...overrides].sort((a, b) => a.date.localeCompare(b.date)).map(ov => (
                      <div key={ov.date} className="d-flex align-items-start justify-content-between p-2 rounded"
                        style={{ border: '1px solid var(--border)', background: ov.isOff ? '#fff5f5' : 'var(--bg)' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            {new Date(ov.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          {ov.isOff ? (
                            <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>
                              <i className="bi bi-x-circle me-1" />Day Off
                            </span>
                          ) : (
                            <div className="d-flex flex-wrap gap-1 mt-1">
                              {ov.slots.map(s => (
                                <span key={s} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 6, background: '#e0f2fe', color: '#0369a1' }}>{s}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button className="btn btn-sm btn-outline-danger" style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                          onClick={() => removeOverride(ov.date)}>
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
