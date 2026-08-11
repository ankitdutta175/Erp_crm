import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { CustomerDetail } from './pages/CustomerDetail';
import { Products } from './pages/Products';
import { Challans } from './pages/Challans';

const MainLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#94a3b8', background: '#0f172a' }}>
        Loading Mini ERP + CRM Operations Portal...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    setCurrentTab('customerDetail');
  };

  const getTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Executive Operations Dashboard';
      case 'customers':
        return 'Customer Relationship Management (CRM)';
      case 'customerDetail':
        return 'Customer Profile & Interaction Timeline';
      case 'products':
        return 'Product Catalog & Inventory Control';
      case 'challans':
        return 'Sales Challans & Commercial Invoicing';
      default:
        return 'Mini ERP + CRM';
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        currentTab={currentTab === 'customerDetail' ? 'customers' : currentTab}
        setCurrentTab={(tab) => {
          setSelectedCustomerId(null);
          setCurrentTab(tab);
        }}
      />
      <div style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Navbar title={getTitle()} />
        <main style={{ padding: '32px', flex: 1 }}>
          {currentTab === 'dashboard' && <Dashboard onNavigate={(tab) => setCurrentTab(tab)} />}
          {currentTab === 'customers' && <Customers onSelectCustomer={handleSelectCustomer} />}
          {currentTab === 'customerDetail' && selectedCustomerId && (
            <CustomerDetail customerId={selectedCustomerId} onBack={() => setCurrentTab('customers')} />
          )}
          {currentTab === 'products' && <Products />}
          {currentTab === 'challans' && <Challans />}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
};

export default App;
