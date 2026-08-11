import React, { useEffect, useState } from 'react';
import { Search, Plus, FileText, Printer, CheckCircle, XCircle, AlertCircle, Trash2, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { api } from '../services/api';
import { SalesChallan, Customer, Product, Pagination } from '../types';
import { useAuth } from '../context/AuthContext';

export const Challans: React.FC = () => {
  const { hasRole } = useAuth();
  const [challans, setChallans] = useState<SalesChallan[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Customers & Products options for dropdowns
  const [customerOptions, setCustomerOptions] = useState<Customer[]>([]);
  const [productOptions, setProductOptions] = useState<Product[]>([]);

  // Create Challan Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [challanStatus, setChallanStatus] = useState<'DRAFT' | 'CONFIRMED'>('DRAFT');
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: '', quantity: 1 },
  ]);
  const [errorMsg, setErrorMsg] = useState('');

  // Invoice Preview / Print Modal State
  const [previewChallan, setPreviewChallan] = useState<SalesChallan | null>(null);

  const fetchChallans = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/challans', {
        params: {
          page,
          limit: 10,
          search,
          status: statusFilter,
        },
      });
      if (res.data.success) {
        setChallans(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load challans:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        api.get('/customers?limit=100'),
        api.get('/products?limit=100'),
      ]);
      if (custRes.data.success) setCustomerOptions(custRes.data.data);
      if (prodRes.data.success) setProductOptions(prodRes.data.data);
    } catch (err) {
      console.error('Failed to load dropdown options:', err);
    }
  };

  useEffect(() => {
    fetchChallans(1);
    fetchDropdownData();
  }, [search, statusFilter]);

  const openCreateModal = () => {
    setErrorMsg('');
    setSelectedCustomerId(customerOptions.length > 0 ? customerOptions[0].id : '');
    setChallanStatus('DRAFT');
    setItems([{ productId: productOptions.length > 0 ? productOptions[0].id : '', quantity: 1 }]);
    setShowCreateModal(true);
  };

  const addItemRow = () => {
    const firstProd = productOptions.length > 0 ? productOptions[0].id : '';
    setItems([...items, { productId: firstProd, quantity: 1 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemRow = (index: number, field: 'productId' | 'quantity', value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await api.post('/challans', {
        customerId: selectedCustomerId,
        status: challanStatus,
        items,
      });

      if (res.data.success) {
        setShowCreateModal(false);
        fetchChallans(pagination.page);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create sales challan');
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: 'CONFIRMED' | 'CANCELLED') => {
    if (!confirm(`Are you sure you want to mark this challan as ${newStatus}?`)) return;
    try {
      const res = await api.put(`/challans/${id}/status`, { status: newStatus });
      if (res.data.success) {
        fetchChallans(pagination.page);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Status update failed');
    }
  };

  const calculateFormTotal = () => {
    return items.reduce((acc, item) => {
      const prod = productOptions.find((p) => p.id === item.productId);
      const price = prod ? prod.unitPrice : 0;
      return acc + price * (item.quantity || 0);
    }, 0);
  };

  const printInvoice = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
            Sales Challan & Invoice Management
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Create wholesale dispatch challans, verify automatic stock deduction & export commercial invoices
          </p>
        </div>

        {hasRole(['ADMIN', 'SALES']) && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} /> Create Sales Challan
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '40px' }}
            placeholder="Search by challan # or customer business name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: '160px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Challans Table */}
      <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden' }}>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Challan Number</th>
                <th>Customer Name</th>
                <th>Total Qty</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    Loading sales challans...
                  </td>
                </tr>
              ) : challans.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No sales challans recorded. Create a new challan to begin dispatch.
                  </td>
                </tr>
              ) : (
                challans.map((ch) => (
                  <tr key={ch.id}>
                    <td style={{ fontWeight: 800, color: '#818cf8' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={16} />
                        {ch.challanNumber}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#f8fafc' }}>{ch.customer?.businessName}</div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{ch.customer?.name}</div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#e2e8f0' }}>{ch.totalQuantity} Units</td>
                    <td style={{ fontWeight: 800, color: '#38bdf8' }}>
                      ₹{ch.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          ch.status === 'CONFIRMED'
                            ? 'badge-confirmed'
                            : ch.status === 'DRAFT'
                            ? 'badge-draft'
                            : 'badge-cancelled'
                        }`}
                      >
                        {ch.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {new Date(ch.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setPreviewChallan(ch)}
                          title="View Commercial Invoice & Print PDF"
                        >
                          <Eye size={14} /> PDF Invoice
                        </button>
                        {ch.status === 'DRAFT' && hasRole(['ADMIN', 'SALES', 'WAREHOUSE']) && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleStatusUpdate(ch.id, 'CONFIRMED')}
                            title="Confirm Challan (Reduces Stock)"
                          >
                            <CheckCircle size={14} /> Confirm
                          </button>
                        )}
                        {ch.status === 'CONFIRMED' && hasRole(['ADMIN', 'ACCOUNTS']) && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleStatusUpdate(ch.id, 'CANCELLED')}
                            title="Cancel Challan & Restock"
                          >
                            <XCircle size={14} /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} Total Challans)
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchChallans(pagination.page - 1)}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchChallans(pagination.page + 1)}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Create Challan Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', marginBottom: '16px' }}>
              Create Sales Dispatch Challan
            </h3>

            {errorMsg && (
              <div
                style={{
                  padding: '12px 16px',
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.4)',
                  borderRadius: '10px',
                  color: '#fb7185',
                  fontSize: '0.88rem',
                  marginBottom: '16px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={18} /> {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Select Customer *</label>
                  <select
                    className="form-select"
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    required
                  >
                    {customerOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.businessName} ({c.name} - {c.customerType})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Initial Challan Status</label>
                  <select
                    className="form-select"
                    value={challanStatus}
                    onChange={(e) => setChallanStatus(e.target.value as 'DRAFT' | 'CONFIRMED')}
                  >
                    <option value="DRAFT">Save as Draft (No stock change)</option>
                    <option value="CONFIRMED">Save as Confirmed (Reduces Stock Now)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Line Items Section */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc' }}>
                    Challan Line Items (Products & Quantities)
                  </h4>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addItemRow}>
                    <Plus size={14} /> Add Line Item
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {items.map((item, idx) => {
                    const selectedProd = productOptions.find((p) => p.id === item.productId);
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '3fr 1fr 1.2fr 40px',
                          gap: '10px',
                          alignItems: 'center',
                          background: 'rgba(15, 23, 42, 0.6)',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        <div>
                          <select
                            className="form-select"
                            value={item.productId}
                            onChange={(e) => updateItemRow(idx, 'productId', e.target.value)}
                            required
                          >
                            {productOptions.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (SKU: {p.sku} | Stock: {p.currentStock}) - ₹{p.unitPrice}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <input
                            type="number"
                            min="1"
                            className="form-input"
                            value={item.quantity}
                            onChange={(e) => updateItemRow(idx, 'quantity', parseInt(e.target.value) || 1)}
                            required
                          />
                        </div>

                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#38bdf8', textAlign: 'right' }}>
                          ₹{((selectedProd ? selectedProd.unitPrice : 0) * (item.quantity || 0)).toLocaleString('en-IN')}
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          disabled={items.length <= 1}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: items.length <= 1 ? '#475569' : '#f43f5e',
                            cursor: items.length <= 1 ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Calculation Display */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '12px',
                  marginBottom: '20px',
                }}
              >
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0' }}>
                  Grand Total Amount (Snapshot Calculation):
                </span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#818cf8' }}>
                  ₹{calculateFormTotal().toLocaleString('en-IN')}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Generate Sales Challan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice PDF Preview / Printable Modal */}
      {previewChallan && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px', background: '#ffffff', color: '#0f172a' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                Commercial Invoice & Sales Challan PDF Preview
              </h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-primary btn-sm" onClick={printInvoice}>
                  <Printer size={14} /> Print / Save as PDF
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setPreviewChallan(null)}>
                  Close
                </button>
              </div>
            </div>

            {/* Printable Invoice Container */}
            <div className="print-area" style={{ padding: '24px', border: '1px solid #cbd5e1', borderRadius: '12px', background: '#fff' }}>
              {/* Invoice Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #475569', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b' }}>
                    ACME WHOLESALE DISTRIBUTORS
                  </h1>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Plot 100, Industrial Logistics Hub, Sector 62, Noida, UP
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>GSTIN: 07AAACA1234A1Z5 | Ph: +91 11 4000 8000</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#4f46e5' }}>SALES CHALLAN</h2>
                  <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>#{previewChallan.challanNumber}</p>
                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Date: {new Date(previewChallan.createdAt).toLocaleDateString()}</p>
                  <span style={{ display: 'inline-block', marginTop: '4px', padding: '2px 8px', borderRadius: '4px', background: '#e0e7ff', color: '#3730a3', fontSize: '0.75rem', fontWeight: 700 }}>
                    STATUS: {previewChallan.status}
                  </span>
                </div>
              </div>

              {/* Billed To Customer */}
              <div style={{ marginBottom: '24px', background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Billed & Dispatched To:
                </h4>
                <p style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{previewChallan.customer?.businessName}</p>
                <p style={{ fontSize: '0.85rem', color: '#334155' }}>Attn: {previewChallan.customer?.name}</p>
                <p style={{ fontSize: '0.85rem', color: '#334155' }}>{previewChallan.customer?.address}</p>
                <p style={{ fontSize: '0.85rem', color: '#334155' }}>GSTIN: {previewChallan.customer?.gstNumber || 'N/A'} | Contact: {previewChallan.customer?.mobile}</p>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                <thead>
                  <tr style={{ background: '#e2e8f0', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Item Description (Snapshot)</th>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>SKU</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Unit Price</th>
                    <th style={{ padding: '10px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Qty</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {previewChallan.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px', fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>{item.productNameSnapshot}</td>
                      <td style={{ padding: '10px', fontSize: '0.82rem', color: '#64748b' }}>{item.skuSnapshot}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontSize: '0.88rem', color: '#0f172a' }}>₹{item.unitPriceSnapshot.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '10px', textAlign: 'center', fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>{item.quantity}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>₹{item.totalPrice.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total Box */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
                <div style={{ width: '280px', background: '#f1f5f9', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>
                    <span>Total Quantity:</span>
                    <span style={{ fontWeight: 700 }}>{previewChallan.totalQuantity} Units</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', borderTop: '1px solid #cbd5e1', paddingTop: '8px' }}>
                    <span>Grand Total:</span>
                    <span style={{ color: '#4f46e5' }}>₹{previewChallan.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Footer Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', paddingTop: '20px', borderTop: '1px dashed #cbd5e1', fontSize: '0.8rem', color: '#64748b' }}>
                <div>
                  <p>Prepared By: <strong>{previewChallan.createdBy}</strong></p>
                  <p>System Generated Sales Challan</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ height: '40px' }}></div>
                  <p style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px' }}>Authorized Signatory / Store Receiver</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
