import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Wallet, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const AdvanceLoanModal = ({ isOpen, onClose, employee }) => {
  const { grantEmployeeAdvanceLoan, repayEmployeeAdvanceLoan, currency } = useApp();

  const [activeTab, setActiveTab] = useState('grant'); // 'grant' or 'repay'
  const [loanAmount, setLoanAmount] = useState('200.00');
  const [repayAmount, setRepayAmount] = useState('100.00');

  if (!employee) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === 'grant') {
      grantEmployeeAdvanceLoan(employee.id, loanAmount);
    } else {
      repayEmployeeAdvanceLoan(employee.id, repayAmount);
    }
    onClose();
  };

  const hasActiveLoan = employee.advanceLoanRemaining > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Advance Salary / Loan • ${employee.name}`}
      maxWidth="500px"
    >
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          className={`btn ${activeTab === 'grant' ? 'btn-primary' : 'btn-outline'}`}
          style={{ flex: 1 }}
          onClick={() => setActiveTab('grant')}
        >
          <ArrowUpFromLine size={16} /> Grant Loan
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'repay' ? 'btn-primary' : 'btn-outline'}`}
          style={{ flex: 1 }}
          onClick={() => setActiveTab('repay')}
        >
          <ArrowDownToLine size={16} /> Repay Loan
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Current Advance Status */}
        <div style={{ background: 'var(--bg-surface-elevated)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Employee ID:</span>
            <strong style={{ color: 'var(--text-main)' }}>{employee.empId}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Unpaid Advance:</span>
            <strong style={{ color: hasActiveLoan ? '#FB7185' : '#34D399', fontFamily: 'var(--font-mono)' }}>
              {hasActiveLoan ? formatCurrency(employee.advanceLoanRemaining || 0, currency) : 'No Active Advance Loan'}
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Monthly Base Salary:</span>
            <span style={{ color: '#34D399', fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(employee.baseSalary || 0, currency)}
            </span>
          </div>
        </div>

        {activeTab === 'grant' && (
          <div>
            <label className="form-label">New Advance Loan Amount (₹)</label>
            <input
              type="number"
              step="100"
              min="100"
              className="form-input font-mono"
              style={{ fontSize: '1.1rem', fontWeight: 'bold' }}
              required
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
            />
          </div>
        )}

        {activeTab === 'repay' && (
          <div>
            <label className="form-label">Repayment Amount (₹)</label>
            <input
              type="number"
              step="1"
              min="1"
              max={employee.advanceLoanRemaining || 0}
              className="form-input font-mono"
              style={{ fontSize: '1.1rem', fontWeight: 'bold' }}
              required
              value={repayAmount}
              onChange={(e) => setRepayAmount(e.target.value)}
              disabled={!hasActiveLoan}
            />
            {!hasActiveLoan && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                There is no active advance loan to repay.
              </span>
            )}
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-lg" style={{ marginTop: '8px' }} disabled={activeTab === 'repay' && !hasActiveLoan}>
          <Wallet size={18} /> {activeTab === 'grant' ? 'Disburse Advance Loan' : 'Record Loan Repayment'}
        </button>
      </form>
    </Modal>
  );
};
