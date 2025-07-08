import React, { useState } from 'react';

const LocationReportModal = ({ location, onClose }) => {
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    // TODO: Replace with your actual API call
    await new Promise((res) => setTimeout(res, 1000));
    setSuccess(true);
    setSubmitting(false);
    setTimeout(onClose, 1500);
  };

  if (success) return <div className="modal">Report submitted! Thank you.</div>;

  return (
    <div className="modal" style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 12px #0002', maxWidth: 400, margin: '40px auto' }}>
      <h2>Report Location</h2>
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Reason:
          <input value={reason} onChange={e => setReason(e.target.value)} required style={{ width: '100%', marginTop: 4 }} />
        </label>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Evidence (optional):
          <input value={evidence} onChange={e => setEvidence(e.target.value)} style={{ width: '100%', marginTop: 4 }} />
        </label>
        <button type="submit" disabled={submitting} style={{ marginRight: 8 }}>Submit</button>
        <button type="button" onClick={onClose} disabled={submitting}>Cancel</button>
      </form>
    </div>
  );
};

export default LocationReportModal; 