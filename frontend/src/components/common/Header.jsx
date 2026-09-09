import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SHOP_DETAILS } from '../../config/constants';
import {
  Scissors,
  ScanBarcode,
  RotateCcw,
  Clock,
  TrendingUp,
  Package,
  Layers,
  Sun,
  Moon,
  Menu,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const Header = ({ onOpenScanner }) => {
  const { salesOrders, productStages, products, currency, theme, toggleTheme, resetAllData, isMobileNavOpen, setIsMobileNavOpen } = useApp();
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalSalesToday = salesOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const activeBatchesCount = productStages.filter((b) => b.currentStage !== 'Showroom / Ready Stock').length;
  return (
    <header className="app-header">
      {/* Mobile Hamburger Menu Toggle */}
      <button
        type="button"
        className="mobile-nav-toggle btn-icon"
        onClick={() => setIsMobileNavOpen((prev) => !prev)}
        aria-label="Toggle Navigation Menu"
        title="Open Navigation Menu"
      >
        <Menu size={22} />
      </button>

      {/* Brand & Store Name */}
      <div className="header-brand">
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
            flexShrink: 0,
          }}
        >
          <Scissors size={20} color="#FFFFFF" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
              {SHOP_DETAILS.name.split(' ')[0].toUpperCase()} <span style={{ color: '#6366F1' }}>{SHOP_DETAILS.name.split(' ').slice(1).join(' ').toUpperCase()}</span>
            </h2>
            <span className="badge badge-primary" style={{ fontSize: '0.62rem' }}>GARMENT ERP</span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            Apparel Manufacturing & POS Hub
          </p>
        </div>
      </div>

      {/* Real-time KPI Glance (Auto hides on smaller viewports) */}
      <div className="header-kpi-glance">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-surface-elevated)',
            padding: '5px 12px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-color)',
            whiteSpace: 'nowrap',
          }}
        >
          <TrendingUp size={15} color="#10B981" />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sales:</span>
          <strong style={{ fontSize: '0.85rem', color: '#10B981' }}>{formatCurrency(totalSalesToday, currency)}</strong>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-surface-elevated)',
            padding: '5px 12px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-color)',
            whiteSpace: 'nowrap',
          }}
        >
          <Layers size={15} color="#F59E0B" />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Production:</span>
          <strong style={{ fontSize: '0.85rem', color: '#F59E0B' }}>{activeBatchesCount} Batches</strong>
        </div>

      </div>

      {/* Actions & Utilities */}
      <div className="header-actions">
        {/* Live Clock (Hides on compact screen) */}
        <div className="header-clock" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          padding: '4px 8px',
          whiteSpace: 'nowrap',
        }}>
          <Clock size={13} color="var(--primary)" />
          <span>{time}</span>
        </div>

        {/* Barcode Scanner Button */}
        <button
          className="btn btn-secondary btn-sm header-action-btn"
          onClick={onOpenScanner}
          title="Simulate Hardware Barcode Scanner"
          style={{ border: '1px solid var(--primary-border)', padding: '5px 9px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
        >
          <ScanBarcode size={15} color="#818CF8" />
          <span className="header-btn-label">Scan SKU</span>
        </button>

        {/* Single-Click Light / Dark Theme Switcher Button */}
        <button
          className="btn btn-secondary btn-sm header-action-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Minimalist Light' : 'Midnight Dark'} Mode`}
          style={{
            border: '1px solid var(--border-color)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: theme === 'light' ? '#FFFFFF' : 'var(--bg-surface-elevated)',
            color: 'var(--text-main)',
            boxShadow: 'var(--shadow-sm)',
            padding: '5px 9px',
            fontSize: '0.75rem',
          }}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={14} color="#F59E0B" />
              <span className="header-btn-label">Light</span>
            </>
          ) : (
            <>
              <Moon size={14} color="#6366F1" />
              <span className="header-btn-label">Dark</span>
            </>
          )}
        </button>

        {/* Reset Demo Data (Hidden on compact screens) */}
        <button
          className="btn btn-secondary btn-sm header-reset-btn"
          onClick={resetAllData}
          title="Reset to Demo State"
          style={{ color: 'var(--text-muted)', padding: '5px 8px' }}
        >
          <RotateCcw size={13} />
        </button>
      </div>
    </header>
  );
};
