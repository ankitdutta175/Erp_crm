import React from 'react';
import { ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  title: string;
}

export const Navbar: React.FC<NavbarProps> = ({ title }) => {
  const { user, login } = useAuth();

  const handleQuickSwitchRole = (roleEmail: string, pass: string) => {
    login(roleEmail, pass).catch((err) => alert('Login failed: ' + err.message));
  };

  return (
    <header
      style={{
        height: '70px',
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-glass)',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>{title}</h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Quick Role Switcher for Evaluators / Evaluator Demo Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(30, 41, 59, 0.6)', padding: '6px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <UserCheck size={16} color="#818cf8" />
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Switch Role:</span>
          <button
            onClick={() => handleQuickSwitchRole('admin@company.com', 'Admin@123')}
            style={{
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: user?.role === 'ADMIN' ? 700 : 500,
              background: user?.role === 'ADMIN' ? '#4f46e5' : 'transparent',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Admin
          </button>
          <button
            onClick={() => handleQuickSwitchRole('sales@company.com', 'Sales@123')}
            style={{
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: user?.role === 'SALES' ? 700 : 500,
              background: user?.role === 'SALES' ? '#4f46e5' : 'transparent',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Sales
          </button>
          <button
            onClick={() => handleQuickSwitchRole('warehouse@company.com', 'Warehouse@123')}
            style={{
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: user?.role === 'WAREHOUSE' ? 700 : 500,
              background: user?.role === 'WAREHOUSE' ? '#4f46e5' : 'transparent',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Warehouse
          </button>
          <button
            onClick={() => handleQuickSwitchRole('accounts@company.com', 'Accounts@123')}
            style={{
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: user?.role === 'ACCOUNTS' ? 700 : 500,
              background: user?.role === 'ACCOUNTS' ? '#4f46e5' : 'transparent',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Accounts
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} color="#10b981" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0' }}>
            {user?.name}
          </span>
        </div>
      </div>
    </header>
  );
};
