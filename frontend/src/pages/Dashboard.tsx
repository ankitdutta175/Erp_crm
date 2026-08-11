import React, { useEffect, useState } from 'react';
import { IndianRupee, Users, Package, AlertTriangle, FileText, ArrowUpRight, Plus, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats } from '../types';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#94a3b8' }}>
        Loading dashboard analytics...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner & Refresh */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
            Business Operations Overview
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Live metrics across Customer CRM, Inventory Stock & Sales Challans
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchStats}>
            <RefreshCw size={14} /> Refresh Data
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate('challans')}>
            <Plus size={14} /> Create Sales Challan
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
        {/* Total Revenue */}
        <div className="glass-panel glass-panel-hover" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Confirmed Revenue
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IndianRupee size={20} color="#10b981" />
            </div>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginTop: '12px' }}>
            ₹{stats?.sales.totalRevenue.toLocaleString('en-IN') || '0'}
          </h2>
          <p style={{ fontSize: '0.78rem', color: '#34d399', marginTop: '4px', fontWeight: 600 }}>
            From {stats?.sales.confirmedCount} Confirmed Sales Challans
          </p>
        </div>

        {/* Total Customers */}
        <div className="glass-panel glass-panel-hover" style={{ padding: '20px', cursor: 'pointer' }} onClick={() => onNavigate('customers')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              CRM Customers
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} color="#6366f1" />
            </div>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginTop: '12px' }}>
            {stats?.customers.total || 0}
          </h2>
          <p style={{ fontSize: '0.78rem', color: '#818cf8', marginTop: '4px', fontWeight: 600 }}>
            {stats?.customers.byStatus['ACTIVE'] || 0} Active / {stats?.customers.byStatus['LEAD'] || 0} Leads
          </p>
        </div>

        {/* Total Products */}
        <div className="glass-panel glass-panel-hover" style={{ padding: '20px', cursor: 'pointer' }} onClick={() => onNavigate('products')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Inventory Items
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={20} color="#06b6d4" />
            </div>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginTop: '12px' }}>
            {stats?.products.total || 0} SKUs
          </h2>
          <p style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: '4px', fontWeight: 600 }}>
            Across Wholesale Warehouses
          </p>
        </div>

        {/* Low Stock Warning Card */}
        <div className="glass-panel glass-panel-hover" style={{ padding: '20px', cursor: 'pointer' }} onClick={() => onNavigate('products')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Stock Reorder Alerts
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} color="#f43f5e" />
            </div>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: stats?.products.lowStockCount ? '#fb7185' : '#f8fafc', marginTop: '12px' }}>
            {stats?.products.lowStockCount || 0} Alerts
          </h2>
          <p style={{ fontSize: '0.78rem', color: stats?.products.lowStockCount ? '#fb7185' : '#94a3b8', marginTop: '4px', fontWeight: 600 }}>
            {stats?.products.lowStockCount ? 'Items below minimum stock' : 'Inventory levels optimal'}
          </p>
        </div>
      </div>

      {/* Main Grid: Low Stock Alert Items & Recent Challans */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' }}>
        {/* Low Stock Alerts Box */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="#f43f5e" />
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>Low Stock Inventory</h4>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('products')}>
              Manage Stock
            </button>
          </div>

          {stats?.products.lowStockItems.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', padding: '20px 0', textAlign: 'center' }}>
              All product stock levels are healthy!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats?.products.lowStockItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'rgba(244, 63, 94, 0.08)',
                    border: '1px solid rgba(244, 63, 94, 0.2)',
                  }}
                >
                  <div>
                    <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>{item.name}</p>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      SKU: {item.sku} | Loc: {item.location}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-alert">
                      {item.currentStock} / min {item.minStockAlert}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sales Challans */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#818cf8" />
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>Recent Sales Challans</h4>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('challans')}>
              View All <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Challan #</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentChallans.map((ch) => (
                  <tr key={ch.id}>
                    <td style={{ fontWeight: 700, color: '#818cf8' }}>{ch.challanNumber}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{ch.customer?.businessName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{ch.customer?.name}</div>
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
                    <td style={{ fontWeight: 700, color: '#f8fafc' }}>
                      ₹{ch.totalAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
