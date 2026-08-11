import React, { useState } from 'react';
import { LogIn, ShieldAlert, X } from 'lucide-react';
import { api, setAuthToken, setUser } from '../api';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
  onClose?: () => void;
}

const PRESETS = [
  { role: 'ADMIN', name: 'Admin', user: 'admin@example.com', pass: 'admin123' },
  { role: 'SALES', name: 'Sales', user: 'sales@example.com', pass: 'sales123' },
  { role: 'WAREHOUSE', name: 'Warehouse', user: 'warehouse@example.com', pass: 'warehouse123' },
  { role: 'ACCOUNTS', name: 'Accounts', user: 'accounts@example.com', pass: 'accounts123' },
];

export default function Login({ onLoginSuccess, onClose }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    setUsername(preset.user);
    setPassword(preset.pass);
    setSelectedPreset(preset.role);
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { username, password });
      setAuthToken(response.token);
      setUser(response.user);
      onLoginSuccess(response.user);
    } catch (err: any) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '40px', position: 'relative' }}>
        {onClose && (
          <button 
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X size={18} />
          </button>
        )}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            width: '56px', 
            height: '56px', 
            borderRadius: '16px', 
            background: 'var(--primary-grad)', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <LogIn size={28} color="white" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Operations Portal</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
            Mini ERP + CRM Control Center
          </p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setSelectedPreset(null);
              }}
              placeholder="Enter username"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setSelectedPreset(null);
              }}
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', height: '48px', marginBottom: '32px' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            marginBottom: '16px' 
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)', fontWeight: 600, textTransform: 'uppercase' }}>
              Quick Role Presets
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
          </div>

          <div className="role-grid">
            {PRESETS.map((preset) => (
              <div
                key={preset.role}
                className={`role-select-btn ${selectedPreset === preset.role ? 'selected' : ''}`}
                onClick={() => handlePresetSelect(preset)}
              >
                <div className="role-select-title">{preset.name}</div>
                <div className="role-select-cred">{preset.user}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
