import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

function printPrescription(record) {
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>Prescription</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 40px; }
      h2 { color: #0d6efd; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
      th { background: #f0f0f0; }
      .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0d6efd; padding-bottom: 12px; margin-bottom: 20px; }
      .footer { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 12px; font-size: 12px; color: #666; }
    </style>
    </head><body>
    <div class="header">
      <div><h2>E-Prescription</h2><div>EHR System</div></div>
      <div style="text-align:right">
        <div><strong>Date:</strong> ${new Date(record.visitDate).toLocaleDateString()}</div>
        <div><strong>Doctor:</strong> Dr. ${record.doctor?.name}</div>
        ${record.doctor?.specialization ? `<div>${record.doctor.specialization}</div>` : ''}
      </div>
    </div>
    <div><strong>Patient:</strong> ${record.patient?.name} &nbsp;|&nbsp;
      <strong>Age:</strong> ${record.patient?.age || '—'} &nbsp;|&nbsp;
      <strong>Gender:</strong> ${record.patient?.gender || '—'} &nbsp;|&nbsp;
      <strong>Blood Group:</strong> ${record.patient?.bloodGroup || '—'}
    </div>
    <div style="margin-top:12px"><strong>Diagnosis:</strong> ${record.diagnosis}</div>
    ${record.symptoms ? `<div><strong>Symptoms:</strong> ${record.symptoms}</div>` : ''}
    <table>
      <thead><tr><th>#</th><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr></thead>
      <tbody>
        ${record.prescriptions.map((p, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${p.medication}</td>
            <td>${p.dosage || '—'}</td>
            <td>${p.frequency || '—'}</td>
            <td>${p.duration || '—'}</td>
          </tr>`).join('')}
      </tbody>
    </table>
    ${record.notes ? `<div style="margin-top:16px"><strong>Notes:</strong> ${record.notes}</div>` : ''}
    ${record.followUpDate ? `<div style="margin-top:8px"><strong>Follow-up:</strong> ${new Date(record.followUpDate).toLocaleDateString()}</div>` : ''}
    <div class="footer">This is a computer-generated prescription. &nbsp; Generated on ${new Date().toLocaleString()}</div>
    </body></html>
  `);
  win.document.close();
  win.print();
}

export default function RecordDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/records/${id}`).then((r) => setRecord(r.data.record)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (!record) return <div className="alert alert-danger">Record not found</div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Medical Record</h4>
        <div className="d-flex gap-2">
          {record.prescriptions?.length > 0 && (
            <button className="btn btn-sm btn-success" onClick={() => printPrescription(record)}>
              <i className="bi bi-printer me-1" />Print Prescription
            </button>
          )}
          {(user?.role === 'doctor' || user?.role === 'admin') && (
            <Link to={`/records/${id}/edit`} className="btn btn-sm btn-outline-primary">
              <i className="bi bi-pencil me-1" />Edit
            </Link>
          )}
          <Link to={-1} className="btn btn-sm btn-outline-secondary">Back</Link>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">Patient Info</div>
            <div className="card-body">
              <p><strong>Name:</strong> {record.patient?.name}</p>
              <p><strong>Email:</strong> {record.patient?.email}</p>
              <p><strong>Age:</strong> {record.patient?.age || '—'}</p>
              <p><strong>Gender:</strong> {record.patient?.gender || '—'}</p>
              <p className="mb-0"><strong>Blood Group:</strong> {record.patient?.bloodGroup || '—'}</p>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-header">Visit Details</div>
            <div className="card-body">
              <p><strong>Doctor:</strong> {record.doctor?.name}</p>
              <p><strong>Specialization:</strong> {record.doctor?.specialization || '—'}</p>
              <p><strong>Visit Date:</strong> {new Date(record.visitDate).toLocaleDateString()}</p>
              {record.followUpDate && (
                <p><strong>Follow-up:</strong> {new Date(record.followUpDate).toLocaleDateString()}</p>
              )}
              <p className="mb-0"><strong>Diagnosis:</strong> {record.diagnosis}</p>
            </div>
          </div>
        </div>

        {record.symptoms && (
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">Symptoms</div>
              <div className="card-body">{record.symptoms}</div>
            </div>
          </div>
        )}

        {record.notes && (
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">Doctor Notes</div>
              <div className="card-body">{record.notes}</div>
            </div>
          </div>
        )}

        {record.prescriptions?.length > 0 && (
          <div className="col-12">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <span>Prescriptions</span>
                <button className="btn btn-sm btn-outline-success" onClick={() => printPrescription(record)}>
                  <i className="bi bi-download me-1" />Download PDF
                </button>
              </div>
              <div className="card-body p-0">
                <table className="table mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Medication</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.prescriptions.map((p, i) => (
                      <tr key={i}>
                        <td>{p.medication}</td>
                        <td>{p.dosage || '—'}</td>
                        <td>{p.frequency || '—'}</td>
                        <td>{p.duration || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {record.labReports?.length > 0 && (
          <div className="col-12">
            <div className="card">
              <div className="card-header">Lab Reports</div>
              <div className="card-body p-0">
                <table className="table mb-0">
                  <thead className="table-light">
                    <tr><th>Test</th><th>Result</th><th>Normal Range</th><th>File</th></tr>
                  </thead>
                  <tbody>
                    {record.labReports.map((l, i) => (
                      <tr key={i}>
                        <td>{l.testName}</td>
                        <td>{l.result || '—'}</td>
                        <td>{l.normalRange || '—'}</td>
                        <td>
                          {l.fileUrl ? (
                            <a href={`http://localhost:8000${l.fileUrl}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-link p-0">
                              View
                            </a>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {record.attachments?.length > 0 && (
          <div className="col-12">
            <div className="card">
              <div className="card-header">Attachments</div>
              <div className="card-body d-flex flex-wrap gap-2">
                {record.attachments.map((a, i) => (
                  <a
                    key={i}
                    href={`http://localhost:8000${a.fileUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline-secondary btn-sm"
                  >
                    <i className="bi bi-paperclip me-1" />{a.filename}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
