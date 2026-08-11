import { Hexagon, Package, Users, ShoppingCart, UserCheck, TrendingUp, CheckCircle, Zap, Shield, Play, Calculator, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onLoginTrigger: () => void;
}

export default function LandingPage({ onLoginTrigger }: LandingPageProps) {
  const outerModules = [
    {
      id: 'customers',
      title: 'Customers',
      desc: 'Manage leads, customers and follow-ups',
      icon: <Users size={20} style={{ color: '#3b5944' }} />,
      style: { top: '5%', left: '50%', transform: 'translateX(-50%)' }
    },
    {
      id: 'sales',
      title: 'Sales Challans',
      desc: 'Create challans, manage orders and confirm sales',
      icon: <ShoppingCart size={20} style={{ color: '#3b5944' }} />,
      style: { top: '35%', right: '0%' }
    },
    {
      id: 'leads',
      title: 'Leads & Follow-ups',
      desc: 'Capture leads and convert them into loyal customers',
      icon: <UserCheck size={20} style={{ color: '#3b5944' }} />,
      style: { bottom: '5%', right: '5%' }
    },
    {
      id: 'grow',
      title: 'Grow Your Business',
      desc: 'Make smarter decisions with real-time data',
      icon: <TrendingUp size={20} style={{ color: '#ffffff' }} />,
      style: { bottom: '5%', left: '50%', transform: 'translateX(-50%)' },
      isGold: true
    },
    {
      id: 'reports',
      title: 'Reports',
      desc: 'Real-time insights and actionable reports',
      icon: <TrendingUp size={20} style={{ color: '#3b5944' }} />,
      style: { bottom: '5%', left: '5%' }
    },
    {
      id: 'inventory',
      title: 'Inventory',
      desc: 'Track stock, manage inventory and get low stock alerts',
      icon: <Package size={20} style={{ color: '#3b5944' }} />,
      style: { top: '35%', left: '0%' }
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#fbfaf6', 
      color: '#13251a',
      fontFamily: 'system-ui, sans-serif',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Background Sage Wave curves */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '45vw',
        height: '90vh',
        background: 'radial-gradient(circle at 100% 0%, #e2ece6 0%, transparent 75%)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <div className="landing-bg-grid" />
      <div className="landing-bg-blob landing-bg-blob-1" />
      <div className="landing-bg-blob landing-bg-blob-2" />
      <div className="landing-bg-blob landing-bg-blob-3" />
      <div className="landing-bg-line landing-bg-line-1" />
      <div className="landing-bg-line landing-bg-line-2" />
      {[
        { id: 'p1', top: '12%', left: '25%', size: '10px', color: 'rgba(204, 160, 76, 0.55)', delay: '0s' },
        { id: 'p2', top: '30%', left: '8%', size: '12px', color: 'rgba(59, 89, 68, 0.4)', delay: '1.2s' },
        { id: 'p3', top: '18%', left: '65%', size: '8px', color: 'rgba(59, 89, 68, 0.3)', delay: '0.6s' },
        { id: 'p4', top: '55%', left: '19%', size: '11px', color: 'rgba(204, 160, 76, 0.4)', delay: '1.8s' },
        { id: 'p5', top: '42%', left: '72%', size: '9px', color: 'rgba(204, 160, 76, 0.35)', delay: '2.4s' }
      ].map((p) => (
        <div
          key={p.id}
          className="landing-bg-particle"
          style={{
            position: 'absolute',
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.color,
            opacity: 0.95,
            pointerEvents: 'none',
            zIndex: 1,
            animationDelay: p.delay
          }}
        />
      ))}

      {/* Header */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '24px 8%',
        zIndex: 10,
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Hexagon size={28} fill="#cca04c" style={{ color: '#cca04c' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#13251a', letterSpacing: '-0.3px' }}>Mini ERP + CRM</span>
        </div>



        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={onLoginTrigger}
            style={{ 
              background: 'transparent', 
              border: '1px solid #c9c7bf', 
              color: '#13251a', 
              padding: '10px 22px', 
              borderRadius: '8px', 
              fontSize: '0.9rem', 
              fontWeight: 600, 
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f2f0e8')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Login
          </button>
          <button 
            onClick={onLoginTrigger}
            style={{ 
              background: '#cca04c', 
              border: 'none', 
              color: '#ffffff', 
              padding: '10px 24px', 
              borderRadius: '8px', 
              fontSize: '0.9rem', 
              fontWeight: 600, 
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(204, 160, 76, 0.25)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#b88f3e')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#cca04c')}
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ 
        display: 'grid', 
        gridTemplateColumns: '1.1fr 1fr', 
        gap: '40px', 
        padding: '40px 8% 60px 8%',
        alignItems: 'center',
        zIndex: 10,
        position: 'relative'
      }} className="landing-hero-grid">
        {/* Left Column Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div>
            <span style={{ 
              background: '#e8f2ec', 
              color: '#3b5944', 
              padding: '6px 14px', 
              borderRadius: '20px', 
              fontSize: '0.75rem', 
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              All-in-One Business Management
            </span>
          </div>

          <h1 style={{ 
            fontSize: '3.6rem', 
            fontWeight: 800, 
            color: '#13251a', 
            lineHeight: 1.1,
            letterSpacing: '-1.5px',
            margin: 0
          }}>
            One Platform.<br />Every Operation.
          </h1>

          <p style={{ 
            fontSize: '1.05rem', 
            color: '#607365', 
            lineHeight: 1.6, 
            maxWidth: '520px',
            margin: 0
          }}>
            Mini ERP + CRM helps wholesale and distribution businesses manage customers, inventory, sales challans and operations — all in one simple platform.
          </p>

          <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
            <button 
              onClick={onLoginTrigger}
              style={{ 
                background: '#3b5944', 
                border: 'none', 
                color: '#ffffff', 
                padding: '14px 28px', 
                borderRadius: '8px', 
                fontSize: '0.95rem', 
                fontWeight: 600, 
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(59, 89, 68, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#2b4232')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#3b5944')}
            >
              Get Started Free <ArrowRight size={16} />
            </button>
            <button 
              onClick={onLoginTrigger}
              style={{ 
                background: '#ffffff', 
                border: '1px solid #c9c7bf', 
                color: '#13251a', 
                padding: '14px 28px', 
                borderRadius: '8px', 
                fontSize: '0.95rem', 
                fontWeight: 600, 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#fbf9f4')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
            >
              Explore Platform <Play size={12} fill="#3b5944" style={{ color: '#3b5944', marginLeft: '2px' }} />
            </button>
          </div>

          {/* Quick value props */}
          <div style={{ display: 'flex', gap: '24px', marginTop: '8px', fontSize: '0.82rem', fontWeight: 600, color: '#4a6552' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={14} style={{ color: '#3b5944' }} /> Role-Based Access
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} style={{ color: '#3b5944' }} /> Real-Time Updates
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={14} style={{ color: '#3b5944' }} /> Secure & Reliable
            </span>
          </div>
        </div>

        {/* Right Column Graphic */}
        <div style={{ 
          position: 'relative', 
          height: '420px', 
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }} className="landing-graphic-container">
          {/* Radial Spokes Layer (SVG background) */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
            <line x1="50%" y1="50%" x2="50%" y2="15%" stroke="#d8d5cc" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="50%" y1="50%" x2="80%" y2="40%" stroke="#d8d5cc" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="50%" y1="50%" x2="80%" y2="85%" stroke="#d8d5cc" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="50%" y1="50%" x2="50%" y2="85%" stroke="#d8d5cc" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="50%" y1="50%" x2="20%" y2="85%" stroke="#d8d5cc" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="50%" y1="50%" x2="20%" y2="40%" stroke="#d8d5cc" strokeWidth="1.5" strokeDasharray="3 3" />
            
            {/* Soft concentric circles */}
            <circle cx="50%" cy="50%" r="90" fill="none" stroke="#e9e7df" strokeWidth="1" />
            <circle cx="50%" cy="50%" r="140" fill="none" stroke="#e9e7df" strokeWidth="0.8" strokeDasharray="4 4" />
          </svg>
          <div className="landing-graphic-ring" />

          {/* Central Hub Hexagon */}
          <div style={{ 
            zIndex: 5, 
            width: '74px', 
            height: '84px', 
            background: '#3b5944', 
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(59, 89, 68, 0.3)',
            animation: 'pulse-glow 3s infinite ease-in-out'
          }}>
            <Package size={32} style={{ color: '#ffffff' }} />
          </div>

          {/* Outer Module Cards */}
          {outerModules.map((m) => (
            <div 
              key={m.id}
              onClick={onLoginTrigger}
              style={{
                position: 'absolute',
                zIndex: 10,
                background: m.isGold ? '#cca04c' : '#ffffff',
                border: m.isGold ? 'none' : '1px solid #e9e7df',
                color: m.isGold ? '#ffffff' : '#13251a',
                padding: '10px 14px',
                borderRadius: '10px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.02)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '180px',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                ...m.style
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = `${m.style.transform || ''} scale(1.04)`;
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = m.style.transform || 'none';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.02)';
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: m.isGold ? 'rgba(255,255,255,0.15)' : '#e8f2ec',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {m.icon}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{m.title}</span>
                <span style={{ fontSize: '0.62rem', color: m.isGold ? 'rgba(255,255,255,0.85)' : '#607365', marginTop: '2px' }}>{m.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Grid Sections (Below Hero) */}
      <section style={{ 
        background: '#ffffff', 
        borderTop: '1px solid #e9e7df', 
        padding: '50px 8%',
        zIndex: 10,
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '1fr 1.3fr 1.1fr',
        gap: '40px'
      }} className="landing-bottom-grid">
        
        {/* Built for Every Team */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ borderBottom: '2px solid #3b5944', paddingBottom: '8px', width: 'fit-content' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#13251a' }}>Built for Every Team</h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { role: 'Admin', desc: 'Control the entire business and users with ease.', icon: <Shield size={16} style={{ color: '#3b5944' }} /> },
              { role: 'Sales', desc: 'Manage customers, create challans and close more sales.', icon: <Users size={16} style={{ color: '#3b5944' }} /> },
              { role: 'Warehouse', desc: 'Track stock, manage inventory and stay ahead of alerts.', icon: <Package size={16} style={{ color: '#3b5944' }} /> },
              { role: 'Accounts', desc: 'Keep sales and transactions organized.', icon: <Calculator size={16} style={{ color: '#cca04c' }} /> }
            ].map((r, i) => (
              <div 
                key={i} 
                onClick={onLoginTrigger}
                style={{ 
                  border: '1px solid #e9e7df', 
                  borderRadius: '10px', 
                  padding: '14px', 
                  background: '#fbfaf6',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    {r.icon}
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{r.role}</span>
                </div>
                <span style={{ fontSize: '0.65rem', color: '#607365', lineHeight: 1.35 }}>{r.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* From Customer to Confirmed Sale */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ borderBottom: '2px solid #cca04c', paddingBottom: '8px', width: 'fit-content' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#13251a' }}>From Customer to Confirmed Sale</h3>
          </div>

          {/* Step Workflow */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            border: '1px solid #e9e7df', 
            borderRadius: '12px', 
            padding: '20px 16px',
            background: '#fbfaf6'
          }}>
            {[
              { step: 'Select Customer', icon: <Users size={16} style={{ color: '#3b5944' }} /> },
              { step: 'Add Products', icon: <Package size={16} style={{ color: '#3b5944' }} /> },
              { step: 'Create Challan', icon: <ShoppingCart size={16} style={{ color: '#cca04c' }} /> },
              { step: 'Confirm Sale', icon: <CheckCircle size={16} style={{ color: '#3b5944' }} /> },
              { step: 'Stock Updated', icon: <TrendingUp size={16} style={{ color: '#3f6212' }} /> }
            ].map((step, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '100%' }}>
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '50%', 
                    background: '#ffffff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    border: '1px solid #e9e7df'
                  }}>
                    {step.icon}
                  </div>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, textAlign: 'center', display: 'block', maxWidth: '60px' }}>{step.step}</span>
                </div>
                {idx < 4 && (
                  <span style={{ color: '#a7bdae', fontWeight: 700, fontSize: '0.8rem', position: 'absolute', right: '-8px', top: '10px' }}>&rarr;</span>
                )}
              </div>
            ))}
          </div>

          {/* Banner bottom */}
          <div style={{ 
            background: '#e8f2ec', 
            borderRadius: '10px', 
            padding: '12px 16px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            border: '1px solid #cce2d5'
          }}>
            <CheckCircle size={20} style={{ color: '#3b5944', flexShrink: 0 }} />
            <span style={{ fontSize: '0.72rem', color: '#2b4232', fontWeight: 600, lineHeight: 1.35 }}>
              Confirmed challans automatically reduce stock. Our system prevents negative stock.
            </span>
          </div>
        </div>

        {/* Core Modules */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ borderBottom: '2px solid #cca04c', paddingBottom: '8px', width: 'fit-content' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#13251a' }}>Core Modules</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { title: 'Customer CRM', desc: 'Manage customers, follow-ups, notes and customer status.', icon: <Users size={16} style={{ color: '#3b5944' }} /> },
              { title: 'Products & Inventory', desc: 'Manage products, stock, warehouses and stock movement history.', icon: <Package size={16} style={{ color: '#3b5944' }} /> },
              { title: 'Sales Challans', desc: 'Create, edit and confirm challans with automatic stock deduction.', icon: <ShoppingCart size={16} style={{ color: '#cca04c' }} /> },
              { title: 'Business Insights', desc: 'Dashboard and reports for revenue, sales, customers and stock alerts.', icon: <TrendingUp size={16} style={{ color: '#3f6212' }} /> }
            ].map((m, idx) => (
              <div 
                key={idx} 
                onClick={onLoginTrigger}
                style={{ 
                  display: 'flex', 
                  alignItems: 'start', 
                  gap: '10px', 
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#fbfaf6'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ 
                  width: '28px', 
                  height: '28px', 
                  borderRadius: '50%', 
                  background: '#fbfaf6', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '1px solid #e9e7df',
                  flexShrink: 0
                }}>
                  {m.icon}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#13251a' }}>{m.title}</span>
                  <span style={{ fontSize: '0.62rem', color: '#607365', marginTop: '2px' }}>{m.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Value Props Bar */}
      <footer style={{ 
        background: '#f1f0e8', 
        borderTop: '1px solid #e4e2d8', 
        padding: '24px 8%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '24px'
      }}>
        {[
          { title: 'No Negative Stock', desc: 'System prevents stock from going below zero.', icon: <CheckCircle size={20} style={{ color: '#3b5944' }} /> },
          { title: 'Automatic Stock Updates', desc: 'Stock is updated automatically when challans are confirmed.', icon: <Zap size={20} style={{ color: '#3b5944' }} /> },
          { title: 'Role-Based Access', desc: 'Admin, Sales, Warehouse and Accounts with different access.', icon: <Users size={20} style={{ color: '#3b5944' }} /> },
          { title: 'Validated Operations', desc: 'Input validation, proper error handling and security.', icon: <CheckCircle size={20} style={{ color: '#cca04c' }} /> }
        ].map((prop, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'start', gap: '10px', flex: '1 1 180px' }}>
            <div style={{ marginTop: '2px' }}>{prop.icon}</div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#13251a' }}>{prop.title}</span>
              <span style={{ fontSize: '0.6rem', color: '#607365', marginTop: '2px' }}>{prop.desc}</span>
            </div>
          </div>
        ))}
      </footer>

      {/* Embedded CSS for keyframes */}
      <style>{`
        @keyframes pulse-glow {
          0% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(59, 89, 68, 0)); }
          50% { transform: scale(1.04); filter: drop-shadow(0 0 12px rgba(59, 89, 68, 0.4)); }
          100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(59, 89, 68, 0)); }
        }
        @keyframes float-slow {
          0% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-18px) scale(1.02); }
          100% { transform: translateY(0px) scale(1); }
        }
        @keyframes drift-right {
          0% { transform: translateX(0px) rotate(0deg); opacity: 0.95; }
          50% { transform: translateX(12px) rotate(2deg); opacity: 0.8; }
          100% { transform: translateX(0px) rotate(0deg); opacity: 0.95; }
        }
        .landing-bg-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(24px);
          opacity: 0.55;
          pointer-events: none;
          z-index: 1;
        }
        .landing-bg-blob-1 {
          width: 260px;
          height: 260px;
          background: rgba(85, 133, 96, 0.24);
          top: 8%;
          left: 8%;
          animation: float-slow 10s ease-in-out infinite;
        }
        .landing-bg-blob-2 {
          width: 200px;
          height: 200px;
          background: rgba(204, 160, 76, 0.26);
          bottom: 18%;
          right: 12%;
          animation: drift-right 12s ease-in-out infinite;
        }
        .landing-bg-blob-3 {
          width: 320px;
          height: 320px;
          background: rgba(46, 93, 68, 0.18);
          top: 30%;
          right: 20%;
          animation: float-slow 14s ease-in-out infinite;
        }
        .landing-bg-line {
          position: absolute;
          height: 2px;
          background: linear-gradient(90deg, rgba(204,160,76,0.3) 0%, rgba(255,255,255,0) 100%);
          filter: blur(1px);
          pointer-events: none;
          z-index: 1;
        }
        .landing-bg-line-1 {
          width: 240px;
          top: 45%;
          left: 12%;
          animation: drift-right 16s ease-in-out infinite;
        }
        .landing-bg-line-2 {
          width: 180px;
          top: 60%;
          right: 10%;
          animation: drift-right 18s ease-in-out infinite reverse;
        }
        .landing-bg-grid {
          position: absolute;
          inset: 0;
          background-color: transparent;
          background-image:
            linear-gradient(rgba(59, 89, 68, 0.16) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 89, 68, 0.16) 1px, transparent 1px);
          background-size: 48px 48px;
          background-position: 0 0, 0 0;
          opacity: 0.8;
          pointer-events: none;
          z-index: 1;
        }
        .landing-bg-grid::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(204, 160, 76, 0.22) 1px, transparent 1px),
            linear-gradient(90deg, rgba(204, 160, 76, 0.22) 1px, transparent 1px);
          background-size: 160px 160px;
          opacity: 0.55;
          pointer-events: none;
        }
        .landing-bg-particle {
          animation: particle-fade 9s ease-in-out infinite;
        }
        .landing-graphic-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 270px;
          height: 270px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          border: 1px solid rgba(204, 160, 76, 0.18);
          box-shadow: 0 0 0 12px rgba(204, 160, 76, 0.06);
          filter: blur(0.8px);
          z-index: 2;
          animation: ring-rotate 24s linear infinite;
          pointer-events: none;
        }
        @keyframes particle-fade {
          0% { transform: translateY(0px) scale(1); opacity: 0.9; }
          50% { transform: translateY(-12px) scale(1.1); opacity: 0.45; }
          100% { transform: translateY(0px) scale(1); opacity: 0.9; }
        }
        @keyframes ring-rotate {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @media (max-width: 1024px) {
          .landing-hero-grid {
            grid-template-columns: 1fr !important;
            text-align: center;
            padding: 40px 6% !important;
          }
          .landing-hero-grid > div {
            align-items: center;
          }
          .landing-nav {
            display: none !important;
          }
          .landing-graphic-container {
            margin-top: 40px;
            transform: scale(0.9);
          }
          .landing-bottom-grid {
            grid-template-columns: 1fr !important;
            gap: 30px !important;
          }
          .landing-bg-blob-1,
          .landing-bg-blob-2,
          .landing-bg-blob-3 {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
