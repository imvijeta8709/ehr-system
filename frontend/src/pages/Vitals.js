import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const emptyForm = {
  patient: '',
  bloodPressureSystolic: '',
  bloodPressureDiastolic: '',
  heartRate: '',
  bloodSugar: '',
  bloodSugarType: 'random',
  temperature: '',
  weight: '',
  height: '',
  oxygenSaturation: '',
  notes: '',
};

export default function Vitals() {
  const { user } = useAuth();
  const [vitals, setVitals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');

  const isDoctor = user?.role === 'doctor' || user?.role === 'admin';

  const fetchVitals = (patientId = '') => {
    const q = patientId ? `?patientId=${patientId}` : '';
    api.get(`/vitals${q}`).then((r) => setVitals(r.data.vitals)).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isDoctor) {
      api.get('/users/patients?limit=100').then((r) => setPatients(r.data.patients));
    }
    fetchVitals();
  }, [isDoctor]);

  const handlePatientFilter = (e) => {
    setSelectedPatient(e.target.value);
    fetchVitals(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!isDoctor) delete payload.patient;
      // Remove empty strings
      Object.keys(payload).forEach((k) => { if (payload[k] === '') delete payload[k]; });
      await api.post('/vitals', payload);
      toast.success('Vitals recorded');
      setForm(emptyForm);
      fetchVitals(selectedPatient);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving vitals');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vitals entry?')) return;
    await api.delete(`/vitals/${id}`);
    setVitals((v) => v.filter((x) => x._id !== id));
    toast.success('Deleted');
  };

  // Chart data
  const labels = [...vitals].reverse().map((v) => new Date(v.recordedAt).toLocaleDateString());
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Systolic BP',
        data: [...vitals].reverse().map((v) => v.bloodPressureSystolic || null),
        borderColor: 'rgb(220, 53, 69)',
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        tension: 0.3,
      },
      {
        label: 'Diastolic BP',
        data: [...vitals].reverse().map((v) => v.bloodPressureDiastolic || null),
        borderColor: 'rgb(255, 193, 7)',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        tension: 0.3,
      },
      {
        label: 'Heart Rate',
        data: [...vitals].reverse().map((v) => v.heartRate || null),
        borderColor: 'rgb(13, 110, 253)',
        backgroundColor: 'rgba(13, 110, 253, 0.1)',
        tension: 0.3,
      },
      {
        label: 'Blood Sugar',
        data: [...vitals].reverse().map((v) => v.bloodSugar || null),
        borderColor: 'rgb(25, 135, 84)',
        backgroundColor: 'rgba(25, 135, 84, 0.1)',
        tension: 0.3,
      },
    ],
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <h4 className="mb-4">Vitals Tracking</h4>

      <div className="row g-3">
        {/* Form */}
        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">Record Vitals</div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {isDoctor && (
                  <div className="mb-2">
                    <label className="form-label small">Patient</label>
                    <select
                      className="form-select form-select-sm"
                      value={form.patient}
                      onChange={(e) => setForm({ ...form, patient: e.target.value })}
                      required
                    >
                      <option value="">Select patient</option>
                      {patients.map((p) => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label small">Systolic BP</label>
                    <input type="number" className="form-control form-control-sm" placeholder="mmHg"
                      value={form.bloodPressureSystolic}
                      onChange={(e) => setForm({ ...form, bloodPressureSystolic: e.target.value })} />
                  </div>
                  <div className="col-6">
                    <label className="form-label small">Diastolic BP</label>
                    <input type="number" className="form-control form-control-sm" placeholder="mmHg"
                      value={form.bloodPressureDiastolic}
                      onChange={(e) => setForm({ ...form, bloodPressureDiastolic: e.target.value })} />
                  </div>
                  <div className="col-6">
                    <label className="form-label small">Heart Rate</label>
                    <input type="number" className="form-control form-control-sm" placeholder="bpm"
                      value={form.heartRate}
                      onChange={(e) => setForm({ ...form, heartRate: e.target.value })} />
                  </div>
                  <div className="col-6">
                    <label className="form-label small">Blood Sugar</label>
                    <input type="number" className="form-control form-control-sm" placeholder="mg/dL"
                      value={form.bloodSugar}
                      onChange={(e) => setForm({ ...form, bloodSugar: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label small">Sugar Type</label>
                    <select className="form-select form-select-sm" value={form.bloodSugarType}
                      onChange={(e) => setForm({ ...form, bloodSugarType: e.target.value })}>
                      <option value="fasting">Fasting</option>
                      <option value="postprandial">Postprandial</option>
                      <option value="random">Random</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label small">Temperature (°C)</label>
                    <input type="number" step="0.1" className="form-control form-control-sm"
                      value={form.temperature}
                      onChange={(e) => setForm({ ...form, temperature: e.target.value })} />
                  </div>
                  <div className="col-6">
                    <label className="form-label small">SpO2 (%)</label>
                    <input type="number" className="form-control form-control-sm"
                      value={form.oxygenSaturation}
                      onChange={(e) => setForm({ ...form, oxygenSaturation: e.target.value })} />
                  </div>
                  <div className="col-6">
                    <label className="form-label small">Weight (kg)</label>
                    <input type="number" step="0.1" className="form-control form-control-sm"
                      value={form.weight}
                      onChange={(e) => setForm({ ...form, weight: e.target.value })} />
                  </div>
                  <div className="col-6">
                    <label className="form-label small">Height (cm)</label>
                    <input type="number" className="form-control form-control-sm"
                      value={form.height}
                      onChange={(e) => setForm({ ...form, height: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label small">Notes</label>
                    <textarea className="form-control form-control-sm" rows={2}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-sm w-100 mt-3" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Vitals'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Chart + Table */}
        <div className="col-lg-8">
          {vitals.length > 1 && (
            <div className="card mb-3">
              <div className="card-header">Vitals Trend</div>
              <div className="card-body">
                <Line data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>Vitals History</span>
              {isDoctor && (
                <select className="form-select form-select-sm w-auto" value={selectedPatient} onChange={handlePatientFilter}>
                  <option value="">All Patients</option>
                  {patients.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              )}
            </div>
            <div className="table-responsive">
              <table className="table table-sm table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    {isDoctor && <th>Patient</th>}
                    <th>Date</th>
                    <th>BP</th>
                    <th>HR</th>
                    <th>Sugar</th>
                    <th>Temp</th>
                    <th>SpO2</th>
                    {isDoctor && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {vitals.length === 0 ? (
                    <tr><td colSpan={8} className="text-center text-muted py-3">No vitals recorded</td></tr>
                  ) : vitals.map((v) => (
                    <tr key={v._id}>
                      {isDoctor && <td>{v.patient?.name}</td>}
                      <td>{new Date(v.recordedAt).toLocaleDateString()}</td>
                      <td>
                        {v.bloodPressureSystolic && v.bloodPressureDiastolic
                          ? `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`
                          : '—'}
                      </td>
                      <td>{v.heartRate ? `${v.heartRate} bpm` : '—'}</td>
                      <td>{v.bloodSugar ? `${v.bloodSugar} mg/dL` : '—'}</td>
                      <td>{v.temperature ? `${v.temperature}°C` : '—'}</td>
                      <td>{v.oxygenSaturation ? `${v.oxygenSaturation}%` : '—'}</td>
                      {isDoctor && (
                        <td>
                          <button className="btn btn-sm btn-link text-danger p-0"
                            onClick={() => handleDelete(v._id)}>
                            <i className="bi bi-trash" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
