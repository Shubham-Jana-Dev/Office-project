import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShoppingCart,
  Truck,
  TrendingUp,
  BookOpen,
  GitBranch,
  Ruler,
  CalendarCheck,
  Users,
  ChevronRight,
  ShieldCheck,
  LogOut,
  X,
} from 'lucide-react';

export const Sidebar = () => {
  const { activeTab, setActiveTab, cart, orderBookings, currentUser, logout, isMobileNavOpen, setIsMobileNavOpen } = useApp();

  const navItems = [
    {
      id: 'pos',
      label: 'POS & Sales Counter',
      subtitle: 'Counter Billing & Barcodes',
      icon: ShoppingCart,
      badge: cart.length > 0 ? `${cart.length}` : null,
      badgeColor: 'badge-primary',
    },
    {
      id: 'profit',
      label: 'Profit & Analytics',
      subtitle: 'Gross/Net Margin Reports',
      icon: TrendingUp,
    },
    {
      id: 'ledger',
      label: 'Account Ledger',
      subtitle: 'Double Entry & Balances',
      icon: BookOpen,
    },
    {
      id: 'stages',
      label: 'Product Stages',
      subtitle: 'Cutting, Stitching & QC',
      icon: GitBranch,
    },
    {
      id: 'measurement',
      label: 'Item Measurement',
      subtitle: 'Garment Sizing Specs',
      icon: Ruler,
    },
    {
      id: 'booking',
      label: 'Booking History',
      subtitle: 'Historical Orders & Registry',
      icon: CalendarCheck,
      badge: `${orderBookings.filter((b) => b.status === 'In Production').length} Active`,
      badgeColor: 'badge-warning',
    },
    {
      id: 'employee',
      label: 'Employee & Payroll',
      subtitle: 'Attendance, Advance & Piece-Rate',
      icon: Users,
    },
    {
      id: 'super_admin',
      label: 'Super Admin',
      subtitle: 'Products, Raw Materials & Pay Rules',
      icon: ShieldCheck,
      badge: 'Restricted',
      badgeColor: 'badge-warning',
    },
  ];

  const accessibleNavItems = navItems.filter((item) => {
    if (!currentUser) return false;
    if (item.id === 'super_admin') {
      return (
        currentUser.roleKey === 'super_admin' ||
        currentUser.roleKey === 'admin' ||
        (currentUser.permissions && currentUser.permissions.includes('super_admin'))
      );
    }
    if (!currentUser.permissions) return true;
    return currentUser.permissions.includes(item.id);
  });

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (setIsMobileNavOpen) {
      setIsMobileNavOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileNavOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`app-sidebar ${isMobileNavOpen ? 'is-mobile-open' : ''}`}>
        <div style={{ padding: '20px 16px 10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
              Operations & Management
            </p>
            {/* {currentUser && (
              <span className="badge badge-primary" style={{ fontSize: '0.6rem', marginTop: '4px', display: 'inline-block' }}>
                {accessibleNavItems.length} Modules
              </span>
            )
            } */}
          </div>

          {/* Mobile Close Button */}
          <button
            type="button"
            className="mobile-sidebar-close"
            onClick={() => setIsMobileNavOpen(false)}
            aria-label="Close navigation menu"
            title="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: '0 8px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          {accessibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'var(--primary-light)' : 'transparent',
                  border: isActive ? '1px solid var(--primary-border)' : '1px solid transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--bg-surface-elevated)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    background: isActive ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                    boxShadow: isActive ? '0 2px 8px rgba(99, 102, 241, 0.4)' : 'none',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} />
                </div>

                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: isActive ? 700 : 600, color: isActive ? 'var(--primary)' : 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {item.subtitle}
                  </div>
                </div>

                {item.badge && (
                  <span className={`badge ${item.badgeColor || 'badge-primary'}`} style={{ fontSize: '0.65rem' }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer System & Active User Status with Quick Logout Button */}
        <div
          style={{
            padding: '12px 14px',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-surface-elevated)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div style={{ fontSize: '1.4rem' }}>{currentUser?.avatar || '👤'}</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {currentUser?.name || 'Authorized Staff'}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {currentUser?.role || 'Staff Member'}
            </div>
          </div>
          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to log out of ${currentUser?.name}?`)) {
                logout();
              }
            }}
            title="Sign out of account"
            style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#FB7185',
              borderRadius: 'var(--radius-sm)',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>
    </>
  );
};
