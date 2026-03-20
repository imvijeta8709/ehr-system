import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';
import Spinner from '../components/Spinner';

const emptyPrescription = { medication: '', dosage: '', frequency: '', duration: '' };

export default function RecordForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState({
    patient: searchParams.get('patient') || '',
    visitDate: new Date().toISOString().split('T')[0],
    diagnosis: '',
    symptoms: '',
    notes: '',
    followUpDate: '',
    prescriptions: [{ ...emptyPrescription }],
  });

  useEffect(() => {
    api.get('/users/patients?limit=100').then((r) => setPatients(r.data.patients));
    if (isEdit) {
      setLoading(true);
      api.get(`/records/${id}`).then((r) => {
        const rec = r.data.record;
        setForm({
          patient: rec.patient._id,
          visitDate: rec.visitDate?.split('T')[0] || '',
          diagnosis: rec.diagnosis,
          symptoms: rec.symptoms || '',
          notes: rec.notes || '',
          followUpDate: rec.followUpDate?.split('T')[0] || '',
          prescriptions: rec.prescriptions?.length ? rec.prescriptions : [{ ...emptyPrescription }],
        });
      }).finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const setPrescription = (i, field) => (e) => {
    const updated = [...form.prescriptions];
    updated[i] = { ...updated[i], [field]: e.target.value };
    setForm({ ...form, prescriptions: updated });
  };

  const addPrescription = () =>
    setForm({ ...form, prescriptions: [...form.prescriptions, { ...emptyPrescription }] });

  const removePrescription = (i) =>
    setForm({ ...form, prescriptions: form.prescriptions.filter((_, idx) => idx !== i) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'prescriptions') data.append(k, JSON.stringify(v));
        else data.append(k, v);
      });
      files.forEach((f) => data.append('attachments', f));

      if (isEdit) {
        await api.put(`/records/${id}`, data);
        toast.success('Record updated');
      } else {
        await api.post('/records', data);
        toast.success('Record created');
      }
      navigate(-1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save record');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) return <Spinner />;

  return (
    <div>
      <h4 className="mb-4">{isEdit ? 'Edit' : 'New'} Medical Record</h4>
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Patient *</label>
                <select className="form-select" value={form.patient} onChange={set('patient')} required>
                  <option value="">Select patient</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Visit Date *</label>
                <input type="date" className="form-control" value={form.visitDate} onChange={set('visitDate')} required />
              </div>
              <div className="col-md-3">
                <label className="form-label">Follow-up Date</label>
                <input type="date" className="form-control" value={form.followUpDate} onChange={set('followUpDate')} />
              </div>
              <div className="col-12">
                <label className="form-label">Diagnosis *</label>
                <input className="form-control" value={form.diagnosis} onChange={set('diagnosis')} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Symptoms</label>
                <textarea className="form-control" rows={3} value={form.symptoms} onChange={set('symptoms')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Notes</label>
                <textarea className="form-control" rows={3} value={form.notes} onChange={set('notes')} />
              </div>

              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label mb-0">Prescriptions</label>
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={addPrescription}>
                    <i className="bi bi-plus-lg me-1" />Add
                  </button>
                </div>
                {form.prescriptions.map((p, i) => (
                  <div key={i} className="row g-2 mb-2 align-items-end">
                    <div className="col-md-3">
                      <input className="form-control form-control-sm" placeholder="Medication" value={p.medication} onChange={setPrescription(i, 'medication')} />
                    </div>
                    <div className="col-md-3">
                      <input className="form-control form-control-sm" placeholder="Dosage" value={p.dosage} onChange={setPrescription(i, 'dosage')} />
                    </div>
                    <div className="col-md-2">
                      <input className="form-control form-control-sm" placeholder="Frequency" value={p.frequency} onChange={setPrescription(i, 'frequency')} />
                    </div>
                    <div className="col-md-2">
                      <input className="form-control form-control-sm" placeholder="Duration" value={p.duration} onChange={setPrescription(i, 'duration')} />
                    </div>
                    <div className="col-md-2">
                      <button type="button" className="btn btn-sm btn-outline-danger w-100" onClick={() => removePrescription(i)}>
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="col-12">
                <label className="form-label">Attachments (PDF/Images)</label>
                <input
                  type="file"
                  className="form-control"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFiles(Array.from(e.target.files))}
                />
              </div>
            </div>

            <div className="mt-4 d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                {isEdit ? 'Update Record' : 'Create Record'}
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
