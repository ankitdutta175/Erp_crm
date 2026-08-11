import React, { useEffect, useState } from 'react';
import { Search, Plus, Package, AlertTriangle, ArrowUpRight, ArrowDownRight, History, Edit3, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { api } from '../services/api';
import { Product, StockLog, Pagination } from '../types';
import { useAuth } from '../context/AuthContext';

export const Products: React.FC = () => {
  const { hasRole } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: '',
    unitPrice: 0,
    currentStock: 0,
    minStockAlert: 10,
    location: '',
    imageUrl: '',
  });

  // Stock Adjust Modal
  const [showStockModal, setShowStockModal] = useState(false);
  const [targetProduct, setTargetProduct] = useState<Product | null>(null);
  const [stockForm, setStockForm] = useState({
    quantity: 1,
    movementType: 'IN' as 'IN' | 'OUT',
    reason: '',
  });

  // Logs Modal
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [productLogs, setProductLogs] = useState<StockLog[]>([]);

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/products', {
        params: {
          page,
          limit: 10,
          search,
          category: categoryFilter,
          lowStock: lowStockFilter,
        },
      });
      if (res.data.success) {
        setProducts(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, [search, categoryFilter, lowStockFilter]);

  const openAddModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      sku: '',
      category: 'Electronics & Cables',
      unitPrice: 100,
      currentStock: 10,
      minStockAlert: 5,
      location: 'Warehouse A - Bay 01',
      imageUrl: '',
    });
    setShowProductModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitPrice: p.unitPrice,
      currentStock: p.currentStock,
      minStockAlert: p.minStockAlert,
      location: p.location,
      imageUrl: p.imageUrl || '',
    });
    setShowProductModal(true);
  };

  const openStockModal = (p: Product) => {
    setTargetProduct(p);
    setStockForm({
      quantity: 10,
      movementType: 'IN',
      reason: 'Inward stock replenishment',
    });
    setShowStockModal(true);
  };

  const openLogsModal = async (p: Product) => {
    setTargetProduct(p);
    setShowLogsModal(true);
    try {
      const res = await api.get(`/products/${p.id}/logs`);
      if (res.data.success) {
        setProductLogs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load stock logs:', err);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, productForm);
      } else {
        await api.post('/products', productForm);
      }
      setShowProductModal(false);
      fetchProducts(pagination.page);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProduct) return;
    try {
      await api.post(`/products/${targetProduct.id}/stock`, stockForm);
      setShowStockModal(false);
      fetchProducts(pagination.page);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to adjust stock');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
            Product & Inventory Management
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Monitor real-time stock levels, minimum reorder thresholds & warehouse movement logs
          </p>
        </div>

        {hasRole(['ADMIN', 'WAREHOUSE']) && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} /> Register New SKU Product
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
            placeholder="Search by product name, SKU code, category, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          className={`btn ${lowStockFilter ? 'btn-danger' : 'btn-secondary'}`}
          onClick={() => setLowStockFilter(!lowStockFilter)}
          style={{ gap: '6px' }}
        >
          <AlertTriangle size={16} />
          {lowStockFilter ? 'Showing Low Stock Alerts' : 'Filter Low Stock'}
        </button>
      </div>

      {/* Products Table */}
      <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden' }}>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Product & SKU</th>
                <th>Category</th>
                <th>Unit Price</th>
                <th>Current Stock</th>
                <th>Warehouse Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No product items found.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLowStock = p.currentStock <= p.minStockAlert;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Package size={16} color={isLowStock ? '#f43f5e' : '#818cf8'} />
                          {p.name}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>
                          SKU Code: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px', color: '#cbd5e1' }}>{p.sku}</code>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-role" style={{ fontSize: '0.7rem' }}>
                          {p.category}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: '#38bdf8' }}>
                        ₹{p.unitPrice.toLocaleString('en-IN')}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '1rem', color: isLowStock ? '#f43f5e' : '#f8fafc' }}>
                            {p.currentStock}
                          </span>
                          {isLowStock && (
                            <span className="badge badge-alert" title={`Below alert limit of ${p.minStockAlert}`}>
                              LOW ALERT ({p.minStockAlert})
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>{p.location}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {hasRole(['ADMIN', 'WAREHOUSE']) && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => openStockModal(p)}
                              title="Adjust Stock (Inward / Outward)"
                            >
                              <Layers size={14} /> Stock +/-
                            </button>
                          )}
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openLogsModal(p)}
                            title="View Stock Movement History"
                          >
                            <History size={14} /> Audit Log
                          </button>
                          {hasRole(['ADMIN', 'WAREHOUSE']) && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => openEditModal(p)}
                              title="Edit Product Details"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} Total Products)
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchProducts(pagination.page - 1)}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchProducts(pagination.page + 1)}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', marginBottom: '20px' }}>
              {editingProduct ? 'Edit Product Specification' : 'Register New Inventory Product'}
            </h3>
            <form onSubmit={handleProductSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU / Item Code *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit Price (INR ₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={productForm.unitPrice}
                    onChange={(e) => setProductForm({ ...productForm, unitPrice: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Initial Stock *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={productForm.currentStock}
                    onChange={(e) => setProductForm({ ...productForm, currentStock: parseInt(e.target.value) || 0 })}
                    required={!editingProduct}
                    disabled={!!editingProduct} // Edits should happen via Stock +/- log adjust for audit compliance!
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Minimum Stock Alert Qty *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={productForm.minStockAlert}
                    onChange={(e) => setProductForm({ ...productForm, minStockAlert: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Warehouse Location (Bay/Shelf) *</label>
                <input
                  type="text"
                  className="form-input"
                  value={productForm.location}
                  onChange={(e) => setProductForm({ ...productForm, location: e.target.value })}
                  placeholder="e.g. Warehouse A - Bay 04"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Product Image URL (Optional)</label>
                <input
                  type="url"
                  className="form-input"
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowProductModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showStockModal && targetProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
              Adjust Stock Level for {targetProduct.name}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '20px' }}>
              Current Available Stock: <strong style={{ color: '#38bdf8' }}>{targetProduct.currentStock}</strong>
            </p>

            <form onSubmit={handleStockSubmit}>
              <div className="form-group">
                <label className="form-label">Movement Type</label>
                <select
                  className="form-select"
                  value={stockForm.movementType}
                  onChange={(e) => setStockForm({ ...stockForm, movementType: e.target.value as 'IN' | 'OUT' })}
                >
                  <option value="IN">IN (Stock Deposit / Inward Supply)</option>
                  <option value="OUT">OUT (Stock Dispatch / Wastage / Damage)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={stockForm.quantity}
                  onChange={(e) => setStockForm({ ...stockForm, quantity: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reason / Reference Note *</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={stockForm.reason}
                  onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
                  placeholder="e.g., Procurement batch #891 received from supplier..."
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowStockModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Stock Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Logs Drawer Modal */}
      {showLogsModal && targetProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                  Stock Movement Audit Logs
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                  Product: {targetProduct.name} ({targetProduct.sku})
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowLogsModal(false)}>
                Close
              </button>
            </div>

            <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Qty</th>
                    <th>Reason</th>
                    <th>User</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {productLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                        No stock logs recorded.
                      </td>
                    </tr>
                  ) : (
                    productLogs.map((log) => (
                      <tr key={log.id}>
                        <td>
                          <span
                            className={`badge ${log.movementType === 'IN' ? 'badge-active' : 'badge-cancelled'}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            {log.movementType === 'IN' ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                            {log.movementType}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: log.movementType === 'IN' ? '#34d399' : '#fb7185' }}>
                          {log.movementType === 'IN' ? `+${log.quantityChanged}` : `-${log.quantityChanged}`}
                        </td>
                        <td style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{log.reason}</td>
                        <td style={{ fontSize: '0.82rem', color: '#94a3b8' }}>{log.createdBy}</td>
                        <td style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
