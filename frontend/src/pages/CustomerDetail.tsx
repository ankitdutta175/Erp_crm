import React, { useEffect, useState } from 'react';
import { ArrowLeft, Building, Phone, Mail, MapPin, Calendar, Plus, Clock, FileText } from 'lucide-react';
import { api } from '../services/api';
import { Customer } from '../types';
import { useAuth } from '../context/AuthContext';

interface CustomerDetailProps {
  customerId: string;
  onBack: () => void;
}

export const CustomerDetail: React.FC<CustomerDetailProps> = ({ customerId, onBack }) => {
  const { hasRole } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const fetchCustomer = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/customers/${customerId}`);
      if (res.data.success) {
        setCustomer(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load customer details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [customerId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setAddingNote(true);
    try {
      const res = await api.post(`/customers/${customerId}/notes`, { note: newNote });
      if (res.data.success) {
        setNewNote('');
        fetchCustomer();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add follow-up note');
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
        Loading customer profile...
      </div>
    );
  }

  if (!customer) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#f43f5e' }}>
        Customer profile not found.
        <button className="btn btn-secondary btn-sm" onClick={onBack} style={{ marginTop: '16px' }}>
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Back Header */}
      <div>
        <button className="btn btn-secondary btn-sm" onClick={onBack} style={{ marginBottom: '12px' }}>
          <ArrowLeft size={16} /> Back to Customers List
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building size={24} color="#818cf8" />
              {customer.businessName}
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginTop: '4px' }}>
              Contact Person: {customer.name} | Customer ID: #{customer.id.slice(0, 8)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span className="badge badge-role">{customer.customerType}</span>
            <span
              className={`badge ${
                customer.status === 'ACTIVE'
                  ? 'badge-active'
                  : customer.status === 'LEAD'
                  ? 'badge-lead'
                  : 'badge-inactive'
              }`}
            >
              {customer.status}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Details Card & Notes Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '24px' }}>
        {/* Customer Information Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
            Contact & Business Overview
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Phone size={16} color="#94a3b8" />
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Mobile Number</span>
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{customer.mobile}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Mail size={16} color="#94a3b8" />
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Email Address</span>
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{customer.email}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building size={16} color="#94a3b8" />
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>GSTIN Number</span>
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{customer.gstNumber || 'Not Provided'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={16} color="#94a3b8" />
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Scheduled Follow-up Date</span>
                <span style={{ fontWeight: 600, color: '#fbbf24' }}>
                  {customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString() : 'None scheduled'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <MapPin size={16} color="#94a3b8" style={{ marginTop: '2px' }} />
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Registered Address</span>
                <span style={{ fontWeight: 500, color: '#cbd5e1' }}>{customer.address}</span>
              </div>
            </div>

            {customer.notes && (
              <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  General Notes:
                </span>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{customer.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* CRM Follow-up Notes Timeline */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
            CRM Follow-up Notes History
          </h4>

          {/* Add Note Form */}
          {hasRole(['ADMIN', 'SALES', 'ACCOUNTS']) && (
            <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Type a new follow-up interaction note (e.g. Call summary, quote discussed, payment terms)..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={addingNote}>
                  <Plus size={14} /> {addingNote ? 'Saving Note...' : 'Add Follow-up Note'}
                </button>
              </div>
            </form>
          )}

          {/* Notes Timeline List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px', maxHeight: '400px', overflowY: 'auto' }}>
            {!customer.followUpNotes || customer.followUpNotes.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
                No follow-up notes logged yet.
              </p>
            ) : (
              customer.followUpNotes.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#818cf8' }}>
                      {n.createdBy}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: '#f8fafc', whiteSpace: 'pre-line' }}>{n.note}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
