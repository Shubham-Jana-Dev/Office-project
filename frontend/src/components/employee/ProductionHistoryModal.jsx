import React, { useState } from 'react';
import {
  CheckCircle2,
  Wallet,
  X,
  TrendingUp,
  Clock,
  DollarSign,
  Package,
  AlertCircle,
  BarChart3,
  ArrowDownCircle,
  Sparkles,
  CreditCard,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { formatCurrency } from '../../utils/formatters';

export const ProductionHistoryModal = ({ isOpen, onClose, employee, jobs, currency, onSettle }) => {
  const [isSettling, setIsSettling] = useState(false);
  const [activeSection, setActiveSection] = useState('all'); // 'all' | 'pending' | 'paid'

  if (!employee) return null;

  /* ---------- Derived data ---------- */
  const allJobs = jobs || [];
  const completedJobs = allJobs.filter((j) => j.status === 'PAID' || j.status === 'READY_FOR_PAYMENT');
  const pendingJobs = allJobs.filter((j) => j.status === 'READY_FOR_PAYMENT');
  const paidJobs = allJobs.filter((j) => j.status === 'PAID');
  const inProgressJobs = allJobs.filter((j) => j.status === 'IN_PROGRESS');

  const totalEarned = completedJobs.reduce((s, j) => s + Number(j.agreedAmount || 0), 0);
  const totalPaid = paidJobs.reduce((s, j) => s + Number(j.agreedAmount || 0), 0);
  const pendingBalance = pendingJobs.reduce((s, j) => s + Number(j.agreedAmount || 0), 0);
  const totalPieces = completedJobs.reduce((s, j) => s + Number(j.quantity || 0), 0);

  const displayJobs =
    activeSection === 'pending'
      ? pendingJobs
      : activeSection === 'paid'
      ? paidJobs
      : allJobs;

  /* ---------- Settle handler ---------- */
  const handleSettle = async () => {
    if (!pendingBalance || isSettling) return;
    setIsSettling(true);
    try {
      await onSettle(employee.id);
    } finally {
      setIsSettling(false);
    }
  };

  /* ---------- Status helpers ---------- */
  const statusConfig = {
    PAID: { label: 'Paid', color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' },
    READY_FOR_PAYMENT: { label: 'Ready for Payment', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
    IN_PROGRESS: { label: 'In Progress', color: '#6366F1', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)' },
  };
  const getStatusCfg = (status) =>
    statusConfig[status] || { label: status, color: 'var(--text-muted)', bg: 'var(--bg-surface)', border: 'var(--border)' };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="900px">
      {/* ── Custom header ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(16,185,129,0.1) 100%)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
              flexShrink: 0,
            }}
          >
            {employee.avatar || '👤'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>{employee.name}</h2>
            <div
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                marginTop: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ color: 'var(--primary)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{employee.empId}</span>
              <span>•</span>
              <span>{employee.role}</span>
              {employee.payType && (
                <>
                  <span>•</span>
                  <span style={{ textTransform: 'capitalize' }}>{employee.payType.replace('_', ' ')}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={16} color="#6366F1" />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Production &amp; Earnings History
          </span>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))',
          gap: '10px',
          marginBottom: '20px',
        }}
      >
        {/* Completed Tasks */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Package size={14} color="#6366F1" />
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Completed Tasks
            </span>
          </div>
          <div
            style={{
              fontSize: '1.6rem',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-main)',
              lineHeight: 1,
            }}
          >
            {completedJobs.length}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{totalPieces} total pieces</div>
        </div>

        {/* Total Piece-Rate Earned */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(52,211,153,0.05) 100%)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <DollarSign size={14} color="#10B981" />
            <span
              style={{
                fontSize: '0.7rem',
                color: '#34D399',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Total Earned
            </span>
          </div>
          <div
            style={{
              fontSize: '1.35rem',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              color: '#10B981',
              lineHeight: 1,
            }}
          >
            {formatCurrency(totalEarned, currency)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Piece-rate &amp; work pay</div>
        </div>

        {/* Payouts Received */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CreditCard size={14} color="#60A5FA" />
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Payouts Received
            </span>
          </div>
          <div
            style={{
              fontSize: '1.35rem',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              color: '#60A5FA',
              lineHeight: 1,
            }}
          >
            {formatCurrency(totalPaid, currency)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{paidJobs.length} settled tasks</div>
        </div>

        {/* Pending Balance */}
        <div
          style={{
            background: pendingBalance
              ? 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(251,191,36,0.06) 100%)'
              : 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(52,211,153,0.04) 100%)',
            border: `1px solid ${pendingBalance ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.2)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Wallet size={14} color={pendingBalance ? '#F59E0B' : '#10B981'} />
            <span
              style={{
                fontSize: '0.7rem',
                color: pendingBalance ? '#FBBF24' : '#34D399',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Balance Payable
            </span>
          </div>
          <div
            style={{
              fontSize: '1.35rem',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              color: pendingBalance ? '#F59E0B' : '#10B981',
              lineHeight: 1,
            }}
          >
            {formatCurrency(pendingBalance, currency)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            {pendingBalance ? `${pendingJobs.length} tasks pending` : 'All settled ✓'}
          </div>
        </div>
      </div>

      {/* ── Pending Balance Alert Banner ── */}
      {pendingBalance > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(251,191,36,0.06) 100%)',
            border: '1px solid rgba(245,158,11,0.35)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(245,158,11,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertCircle size={18} color="#F59E0B" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#FBBF24' }}>
                Pending balance of {formatCurrency(pendingBalance, currency)} awaiting admin settlement
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                {pendingJobs.length} completed production task{pendingJobs.length !== 1 ? 's' : ''} ready for payout — click Settle to post a payout entry &amp; clear the balance
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-success"
            id="settle-balance-banner-btn"
            disabled={isSettling}
            onClick={handleSettle}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              padding: '10px 20px',
              background: isSettling
                ? 'rgba(16,185,129,0.4)'
                : 'linear-gradient(135deg, #10B981, #059669)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              boxShadow: isSettling ? 'none' : '0 4px 14px rgba(16,185,129,0.35)',
              cursor: isSettling ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (!isSettling) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.45)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = isSettling ? 'none' : '0 4px 14px rgba(16,185,129,0.35)';
            }}
          >
            {isSettling ? (
              <>
                <span
                  style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'ph-spin 0.6s linear infinite',
                  }}
                />
                Settling…
              </>
            ) : (
              <>
                <Wallet size={15} />
                Settle Balance ({formatCurrency(pendingBalance, currency)})
              </>
            )}
          </button>
        </div>
      )}

      {/* ── All Settled Banner ── */}
      {pendingBalance === 0 && completedJobs.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(52,211,153,0.05) 100%)',
            border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <CheckCircle2 size={18} color="#10B981" />
          <div>
            <span style={{ fontWeight: 700, color: '#34D399', fontSize: '0.88rem' }}>
              All production balances fully settled
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
              No pending payouts for this employee.
            </span>
          </div>
        </div>
      )}

      {/* ── Section Tabs ── */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: `All Jobs (${allJobs.length})`, Icon: BarChart3 },
          { key: 'pending', label: `Pending (${pendingJobs.length})`, Icon: Clock },
          { key: 'paid', label: `Paid (${paidJobs.length})`, Icon: CheckCircle2 },
        ].map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            id={`prod-tab-${key}`}
            className={`btn btn-sm ${activeSection === key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSection(key)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem' }}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Production Jobs Table ── */}
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          marginBottom: '16px',
        }}
      >
        {displayJobs.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--text-dim)',
              background: 'var(--bg-surface)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Package size={32} color="var(--text-dim)" strokeWidth={1.5} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                {activeSection === 'pending'
                  ? 'No pending production tasks'
                  : activeSection === 'paid'
                  ? 'No settled payouts yet'
                  : 'No production history found'}
              </div>
              <div style={{ fontSize: '0.78rem' }}>
                {activeSection === 'all'
                  ? 'Assign production tasks to this employee from the Booking & Stages module.'
                  : activeSection === 'pending'
                  ? 'All production work has been settled or is still in progress.'
                  : 'No payouts have been made to this employee yet.'}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ minWidth: '170px' }}>Project / Task</th>
                  <th style={{ minWidth: '80px', textAlign: 'center' }}>Qty</th>
                  <th style={{ minWidth: '130px' }}>Piece-Rate Amt</th>
                  <th style={{ minWidth: '145px' }}>Status</th>
                  <th style={{ minWidth: '130px' }}>Date</th>
                  <th style={{ minWidth: '120px' }}>Payment Method</th>
                </tr>
              </thead>
              <tbody>
                {displayJobs.map((job) => {
                  const cfg = getStatusCfg(job.status);
                  const rawDate = job.paidAt || job.readyAt || job.createdAt;
                  const formattedDate = rawDate
                    ? new Date(rawDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—';
                  return (
                    <tr key={job.id} style={{ transition: 'background 0.15s' }}>
                      {/* Project Name */}
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{job.projectName}</div>
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-dim)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {job.id}
                        </div>
                      </td>

                      {/* Quantity */}
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            background: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            padding: '3px 10px',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                          }}
                        >
                          {job.quantity}
                        </span>
                      </td>

                      {/* Piece-Rate Amount */}
                      <td>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800,
                            fontSize: '0.95rem',
                            color:
                              job.status === 'PAID'
                                ? '#10B981'
                                : job.status === 'READY_FOR_PAYMENT'
                                ? '#F59E0B'
                                : 'var(--text-main)',
                          }}
                        >
                          {formatCurrency(job.agreedAmount, currency)}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: cfg.bg,
                            border: `1px solid ${cfg.border}`,
                            color: cfg.color,
                            borderRadius: '8px',
                            padding: '3px 10px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                          }}
                        >
                          {job.status === 'PAID' && <CheckCircle2 size={10} />}
                          {job.status === 'READY_FOR_PAYMENT' && <Clock size={10} />}
                          {job.status === 'IN_PROGRESS' && <ArrowDownCircle size={10} />}
                          {cfg.label}
                        </span>
                      </td>

                      {/* Date */}
                      <td>
                        <span
                          style={{
                            fontSize: '0.8rem',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {formattedDate}
                        </span>
                      </td>

                      {/* Payment Method */}
                      <td>
                        {job.paymentMethod ? (
                          <span
                            style={{
                              background: 'rgba(99,102,241,0.1)',
                              border: '1px solid rgba(99,102,241,0.2)',
                              color: '#818CF8',
                              borderRadius: '6px',
                              padding: '2px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                            }}
                          >
                            {job.paymentMethod}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Table footer with subtotals */}
              {displayJobs.length > 1 && (
                <tfoot>
                  <tr
                    style={{
                      background: 'var(--bg-surface)',
                      borderTop: '2px solid var(--border)',
                    }}
                  >
                    <td
                      colSpan={2}
                      style={{
                        padding: '10px 12px',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      Subtotal ({displayJobs.length} tasks)
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 900,
                          fontSize: '1rem',
                          color:
                            activeSection === 'paid'
                              ? '#10B981'
                              : activeSection === 'pending'
                              ? '#F59E0B'
                              : 'var(--text-main)',
                        }}
                      >
                        {formatCurrency(
                          displayJobs.reduce((s, j) => s + Number(j.agreedAmount || 0), 0),
                          currency
                        )}
                      </span>
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* ── In-progress Jobs Note ── */}
      {inProgressJobs.length > 0 && (
        <div
          style={{
            background: 'rgba(99,102,241,0.06)',
            border: '1px solid rgba(99,102,241,0.18)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Sparkles size={14} color="#818CF8" />
          <span>
            <strong style={{ color: '#818CF8' }}>
              {inProgressJobs.length} task{inProgressJobs.length !== 1 ? 's' : ''}
            </strong>{' '}
            still in progress — these will appear once completed &amp; marked ready for payment.
          </span>
        </div>
      )}

      {/* ── Footer Actions ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          paddingTop: '4px',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          className="btn btn-secondary"
          id="prod-history-close-btn"
          onClick={onClose}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <X size={15} />
          Close
        </button>

        <button
          type="button"
          className="btn btn-success"
          id="settle-balance-footer-btn"
          disabled={!pendingBalance || isSettling}
          onClick={handleSettle}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 700,
            opacity: !pendingBalance ? 0.5 : 1,
            cursor: !pendingBalance || isSettling ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {pendingBalance ? (
            <>
              <Wallet size={15} />
              Settle Balance ({formatCurrency(pendingBalance, currency)})
            </>
          ) : (
            <>
              <CheckCircle2 size={15} />
              Balance Fully Settled
            </>
          )}
        </button>
      </div>

      {/* Spinner keyframe */}
      <style>{`
        @keyframes ph-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Modal>
  );
};