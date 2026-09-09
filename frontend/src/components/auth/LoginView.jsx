import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SHOP_DETAILS } from '../../config/constants';
import {
  Scissors,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  Crown,
  ShoppingBag,
  Ruler,
  BarChart3,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const LoginView = () => {
  const { login, quickLoginAs, theme, toggleTheme, users } = useApp();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await login(username, password);
      if (res.success) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (roleKey) => {
    quickLoginAs(roleKey);
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.8 },
    });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-main)',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Floating Theme Switcher */}
      <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-color)',
          }}
        >
          {theme === 'dark' ? <Sun size={15} color="#F59E0B" /> : <Moon size={15} color="#6366F1" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div
        className="card login-card"
        style={{
          background: 'var(--bg-card)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          animation: 'scaleUp 0.3s ease',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Scissors size={28} color="#FFFFFF" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>
            {SHOP_DETAILS.name.split(' ')[0].toUpperCase()} <span style={{ color: 'var(--primary)' }}>{SHOP_DETAILS.name.split(' ').slice(1).join(' ').toUpperCase()}</span>
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Garment ERP, Bespoke Tailoring & POS Hub
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} /> Username
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. admin, cashier, tailor, manager"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} /> Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: '42px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={isLoading}
            style={{ width: '100%', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In to Workspace'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '24px 0 18px 0',
            gap: '12px',
          }}
        >
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            1-Click Demo Login
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        {/* 1-Click Role Logins */}
        <div className="mobile-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleQuickLogin('super_admin')}
            style={{ justifyContent: 'flex-start', padding: '8px 10px', fontSize: '0.75rem', gridColumn: 'span 2', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.4)' }}
          >
            <span>⚡</span>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontWeight: 800, color: 'var(--primary)' }}>Super Admin</div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Products, Raw Materials & Manufacturing Incentives Controls</span>
            </div>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleQuickLogin('admin')}
            style={{ justifyContent: 'flex-start', padding: '8px 10px', fontSize: '0.75rem' }}
          >
            <span>👑</span>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontWeight: 700 }}>Store Owner</div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Full ERP Access</span>
            </div>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleQuickLogin('cashier')}
            style={{ justifyContent: 'flex-start', padding: '8px 10px', fontSize: '0.75rem' }}
          >
            <span>🛍️</span>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontWeight: 700 }}>Sales Cashier</div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>POS & Billing</span>
            </div>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleQuickLogin('tailor')}
            style={{ justifyContent: 'flex-start', padding: '8px 10px', fontSize: '0.75rem' }}
          >
            <span>✂️</span>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontWeight: 700 }}>Master Tailor</div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Sizing & Kanban</span>
            </div>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleQuickLogin('manager')}
            style={{ justifyContent: 'flex-start', padding: '8px 10px', fontSize: '0.75rem' }}
          >
            <span>📊</span>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontWeight: 700 }}>Accounts Mgr</div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>PO, Ledger & Staff</span>
            </div>
          </button>
        </div>

        {/* Credentials Footer Note */}
        <div
          style={{
            marginTop: '20px',
            padding: '10px',
            background: 'var(--bg-surface-elevated)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}
        >
          🔑 Default Passwords for all accounts: <code style={{ color: 'var(--primary)', fontWeight: 'bold' }}>password123</code>
        </div>
      </div>
    </div>
  );
};
