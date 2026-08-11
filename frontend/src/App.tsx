import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  LogOut, 
  Bell,
  ChevronDown,
  Hexagon
} from 'lucide-react';
import { getUser, setUser, setAuthToken } from './api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Challans from './pages/Challans';
import LandingPage from './pages/LandingPage';

type TabType = 'dashboard' | 'customers' | 'products' | 'challans';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const user = getUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setCurrentUser(null);
  };

  if (!currentUser) {
    return (
      <>
        <LandingPage onLoginTrigger={() => setShowLoginModal(true)} />
        {showLoginModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(19, 37, 26, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <Login 
              onLoginSuccess={handleLoginSuccess}
              onClose={() => setShowLoginModal(false)}
            />
          </div>
        )}
      </>
    );
  }

  // Define sidebar menu options
  const MENU_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'customers', label: 'Customers CRM', icon: <Users size={20} /> },
    { id: 'products', label: 'Products & Inventory', icon: <Package size={20} /> },
    { id: 'challans', label: 'Sales Challans', icon: <ShoppingCart size={20} /> },
  ] as const;

  // Header Title Resolver
  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Operations Dashboard';
      case 'customers': return 'Customer CRM Catalog';
      case 'products': return 'Inventory & Stock Management';
      case 'challans': return 'Sales Challan Register';
      default: return 'Mini ERP + CRM';
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo" style={{ background: 'transparent', boxShadow: 'none' }}>
            <Hexagon size={24} fill="#cca04c" style={{ color: '#cca04c' }} />
          </div>
          <span className="brand-name" style={{ fontSize: '0.98rem', letterSpacing: '0.2px', color: '#ffffff' }}>Mini ERP + CRM</span>
        </div>

        <ul className="sidebar-menu">
          {MENU_ITEMS.map((item) => (
            <li key={item.id}>
              <a 
                className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {currentUser.name ? currentUser.name[0].toUpperCase() : 'A'}
            </div>
            <div className="user-info">
              <span className="user-name">{currentUser.name || 'Admin'}</span>
              <span className="user-role" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                {currentUser.username}
              </span>
            </div>
          </div>
          <a className="sidebar-item" onClick={handleLogout} style={{ color: '#fda4af', padding: '10px 12px' }}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </a>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="main-wrapper">
        <header className="top-nav">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 className="page-title" style={{ marginBottom: '4px' }}>{getPageTitle()}</h1>
            {activeTab === 'dashboard' && (
              <div className="welcome-text" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Welcome back, <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{currentUser.username}</span>
                <span className="badge badge-role" style={{ textTransform: 'capitalize' }}>{currentUser.role.toLowerCase()}</span>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Notification Bell */}
            <div 
              style={{ 
                position: 'relative', 
                cursor: 'pointer', 
                color: 'var(--text-muted)', 
                padding: '6px', 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid #f1f5f9',
                boxShadow: '0 2px 8px -1px rgba(0, 0, 0, 0.04)'
              }}
            >
              <Bell size={18} />
              <span 
                style={{ 
                  position: 'absolute', 
                  top: '5px', 
                  right: '5px', 
                  width: '6px', 
                  height: '6px', 
                  borderRadius: '50%', 
                  background: '#ef4444',
                  border: '1px solid #ffffff'
                }}
              />
            </div>

            {/* Profile Dropdown Badge */}
            <div 
              className="header-profile-badge"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                cursor: 'pointer', 
                padding: '6px 12px 6px 6px',
                borderRadius: '30px',
                border: '1px solid #f1f5f9',
                background: '#ffffff',
                boxShadow: '0 2px 8px -1px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div 
                style={{ 
                  width: '30px', 
                  height: '30px', 
                  borderRadius: '50%', 
                  background: '#012522', 
                  color: '#ffffff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: 700,
                  fontSize: '0.8rem'
                }}
              >
                {currentUser.name ? currentUser.name[0].toUpperCase() : 'A'}
              </div>
              <div className="header-user-info" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>{currentUser.username}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'capitalize', fontWeight: 500 }}>{currentUser.role.toLowerCase()}</span>
              </div>
              <ChevronDown className="header-chevron" size={14} style={{ color: 'var(--text-muted)', marginLeft: '2px' }} />
            </div>
          </div>
        </header>

        <main className="content-body">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'customers' && <Customers currentUser={currentUser} />}
          {activeTab === 'products' && <Products currentUser={currentUser} />}
          {activeTab === 'challans' && <Challans currentUser={currentUser} />}
        </main>
      </div>
    </div>
  );
}
