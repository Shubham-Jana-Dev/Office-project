import React from 'react';
import { X, CheckCircle2, AlertTriangle, Truck, ArrowRight, ArrowLeft, HelpCircle } from 'lucide-react';

export const StageConfirmModal = ({ isOpen, onClose, onConfirm, modalData }) => {
  if (!isOpen || !modalData) return null;

  const { type, batch, currentStage, targetStage, advancePaid, dueAmount } = modalData;

  const isAdvance = type === 'advance';
  const isBackward = type === 'backward';
  const isDelivery = type === 'delivery';

  // Styling properties depending on modal type
  const getModalConfig = () => {
    if (isAdvance) {
      return {
        themeColor: '#10B981',
        bgColor: '#ECFDF5',
        borderColor: '#A7F3D0',
        badgeBg: '#D1FAE5',
        badgeText: '#065F46',
        btnClass: 'btn-success',
        btnBg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        title: 'Stage Advance Confirmation',
        icon: <CheckCircle2 size={24} style={{ color: '#10B981' }} />,
        actionText: 'Yes, Advance Stage',
      };
    }
    if (isBackward) {
      return {
        themeColor: '#EF4444',
        bgColor: '#FEF2F2',
        borderColor: '#FCA5A5',
        badgeBg: '#FEE2E2',
        badgeText: '#991B1B',
        btnClass: 'btn-danger',
        btnBg: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
        title: 'Move Backward Confirmation',
        icon: <AlertTriangle size={24} style={{ color: '#EF4444' }} />,
        actionText: 'Yes, Move Backward',
      };
    }
    return {
      themeColor: '#10B981',
      bgColor: '#ECFDF5',
      borderColor: '#A7F3D0',
      badgeBg: '#D1FAE5',
      badgeText: '#065F46',
      btnClass: 'btn-success',
      btnBg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      title: 'Order Delivery Confirmation',
      icon: <Truck size={24} style={{ color: '#10B981' }} />,
      actionText: 'Yes, Mark Delivered',
    };
  };

  const config = getModalConfig();

  return (
    <div className="modal-overlay" style={{ zIndex: 6000 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '480px',
          borderTop: `6px solid ${config.themeColor}`,
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: config.bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {config.icon}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {config.title}
              </h3>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: config.badgeText,
                  backgroundColor: config.badgeBg,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  display: 'inline-block',
                  marginTop: '4px',
                }}
              >
                Batch: {batch?.batchNo || batch?.id} • {batch?.garmentType}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-close"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '20px' }}>
          {/* Batch & Customer Quick Summary Card */}
          <div
            style={{
              background: 'var(--bg-card, #f9fafb)',
              border: '1px solid var(--border-color, #e5e7eb)',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '16px',
              fontSize: '0.88rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Customer Name:</span>
              <strong style={{ color: 'var(--text-main)' }}>{batch?.clientName || 'N/A'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Quantity:</span>
              <strong style={{ color: 'var(--text-main)' }}>{batch?.quantity} Pcs</strong>
            </div>
            {batch?.assignedTo && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Assigned Tailor:</span>
                <strong style={{ color: 'var(--text-main)' }}>{batch.assignedTo}</strong>
              </div>
            )}
          </div>

          {/* Explicit Confirmation Question Box */}
          {isAdvance && (
            <div
              style={{
                backgroundColor: config.bgColor,
                border: `1px solid ${config.borderColor}`,
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#047857', fontWeight: 700, fontSize: '0.92rem', marginBottom: '8px' }}>
                <HelpCircle size={18} />
                <span>Confirmation Requested</span>
              </div>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.88rem', color: '#064E3B', fontWeight: 600 }}>
                Are you sure you want to advance this product to stage <strong>"{targetStage}"</strong>?
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#047857',
                }}
              >
                <span style={{ padding: '4px 10px', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #A7F3D0' }}>
                  {currentStage}
                </span>
                <ArrowRight size={18} />
                <span style={{ padding: '4px 10px', background: '#10B981', color: '#FFFFFF', borderRadius: '6px' }}>
                  {targetStage}
                </span>
              </div>
            </div>
          )}

          {isBackward && (
            <div
              style={{
                backgroundColor: config.bgColor,
                border: `1px solid ${config.borderColor}`,
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#B91C1C', fontWeight: 700, fontSize: '0.92rem', marginBottom: '8px' }}>
                <AlertTriangle size={18} />
                <span>Confirmation Requested</span>
              </div>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.88rem', color: '#7F1D1D', fontWeight: 600 }}>
                Are you sure you want to move this product backward to stage <strong>"{targetStage}"</strong>?
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#B91C1C',
                }}
              >
                <span style={{ padding: '4px 10px', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #FCA5A5' }}>
                  {currentStage}
                </span>
                <ArrowLeft size={18} />
                <span style={{ padding: '4px 10px', background: '#EF4444', color: '#FFFFFF', borderRadius: '6px' }}>
                  {targetStage}
                </span>
              </div>
              <p style={{ margin: '10px 0 0 0', fontSize: '0.78rem', color: '#991B1B' }}>
                This action will uncheck current stage progress and revert the batch back to {targetStage}.
              </p>
            </div>
          )}

          {isDelivery && (
            <div
              style={{
                backgroundColor: config.bgColor,
                border: `1px solid ${config.borderColor}`,
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#047857', fontWeight: 700, fontSize: '0.92rem', marginBottom: '8px' }}>
                <HelpCircle size={18} />
                <span>Confirmation Requested</span>
              </div>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.88rem', color: '#064E3B', fontWeight: 600 }}>
                Are you sure you want to mark this product order as <strong>Delivered</strong>?
              </p>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '0.85rem',
                  padding: '10px 12px',
                  background: '#FFFFFF',
                  borderRadius: '8px',
                  border: '1px solid #A7F3D0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Advance Deposit Paid:</span>
                  <strong style={{ color: '#059669' }}>₹{advancePaid || 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Balance Amount Due:</span>
                  <strong style={{ color: dueAmount > 0 ? '#EA580C' : '#059669' }}>₹{dueAmount || 0}</strong>
                </div>
              </div>
              {dueAmount > 0 && (
                <div
                  style={{
                    marginTop: '10px',
                    padding: '8px 10px',
                    background: '#FEF3C7',
                    borderLeft: '3px solid #F59E0B',
                    fontSize: '0.78rem',
                    color: '#92400E',
                    borderRadius: '4px',
                  }}
                >
                  <strong>Notice:</strong> Please confirm payment collection of ₹{dueAmount} from client upon handover.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid var(--border-color)' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ borderRadius: '8px', padding: '8px 16px' }}
          >
            No, Cancel
          </button>
          <button
            type="button"
            className={`btn ${config.btnClass}`}
            onClick={onConfirm}
            style={{
              background: config.btnBg,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 18px',
              fontWeight: 700,
              boxShadow: `0 4px 12px ${config.themeColor}40`,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isDelivery && <Truck size={16} />}
            {config.actionText}
          </button>
        </div>
      </div>
    </div>
  );
};
;
