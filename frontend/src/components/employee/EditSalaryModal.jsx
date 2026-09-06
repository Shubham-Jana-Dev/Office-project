import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import {
  DollarSign,
  Scissors,
  TrendingUp,
  Clock,
  Award,
  Wallet,
  Gift,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const EditSalaryModal = ({ isOpen, onClose, employee, payrollMonth }) => {
  const { updateEmployee, updateEmployeeSalary, currency, attendance } = useApp();

  // Controlled states for all salary components
  const [baseSalary, setBaseSalary] = useState('');
  const [piecesCompleted, setPiecesCompleted] = useState('');
  const [pieceRateUnit, setPieceRateUnit] = useState('28.50');
  const [salesAchieved, setSalesAchieved] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [otHours, setOtHours] = useState('0');
  const [otRate, setOtRate] = useState('8.00');
  const [performanceScore, setPerformanceScore] = useState('4.8');
  const [performanceBonus, setPerformanceBonus] = useState('50.00');
  const [customBonus, setCustomBonus] = useState('0.00');
  const [customBonusNote, setCustomBonusNote] = useState('');
  const [advanceDeduction, setAdvanceDeduction] = useState('0.00');
  const [leaveDeduction, setLeaveDeduction] = useState('0.00');
  const [taxDeduction, setTaxDeduction] = useState('0.00');
  const [customDeduction, setCustomDeduction] = useState('0.00');
  const [customDeductionNote, setCustomDeductionNote] = useState('');
  const [role, setRole] = useState('Master Tailor');

  // Synchronize initial values when employee opens
  useEffect(() => {
    if (employee) {
      setBaseSalary(String(employee.baseSalary ?? 500));
      setRole(['Cutter', 'Master Tailor', 'Stitching', 'Washing', 'Finishing'].includes(employee.role) ? employee.role : 'Master Tailor');
      setPiecesCompleted(String(employee.piecesCompletedThisMonth ?? 15));
      setPieceRateUnit(String(employee.pieceRateUnit ?? 28.50));
      setSalesAchieved(String(employee.salesAchievedThisMonth ?? 8400));
      setCommissionRate(String(employee.salesCommissionRate ?? 2.5));

      // Overtime hours from attendance
      const empAtt = (attendance || []).filter(
        (a) => a.empId === employee.empId || a.empName === employee.name
      );
      const computedOt = empAtt.reduce((sum, a) => sum + (a.otHours || 0), 0);
      setOtHours(String(employee.manualOtHours !== undefined ? employee.manualOtHours : computedOt));
      setOtRate(String(employee.overtimeRatePerHour ?? 8.0));

      setPerformanceScore(String(employee.performanceScore ?? 4.8));
      const autoBonus = (employee.performanceScore ?? 4.8) >= 4.8 ? 50.0 : 25.0;
      setPerformanceBonus(String(employee.performanceBonus !== undefined ? employee.performanceBonus : autoBonus));

      setCustomBonus(String(employee.customBonus ?? 0));
      setCustomBonusNote(employee.customBonusNote || '');

      const defaultLoanDed = Math.min(
        employee.advanceLoanDeductionPerMonth ?? 50,
        employee.advanceLoanRemaining ?? 0
      );
      setAdvanceDeduction(String(defaultLoanDed));

      const absentCount = empAtt.filter((a) => a.status === 'Absent').length;
      const autoLeave = absentCount * ((employee.baseSalary || 500) / 30);
      setLeaveDeduction(String(autoLeave.toFixed(2)));

      setCustomDeduction(String(employee.customDeduction ?? 0));
      setCustomDeductionNote(employee.customDeductionNote || '');
    }
  }, [employee, attendance]);

  if (!employee) return null;

  // Real-time calculations
  const numBase = Number(baseSalary) || 0;
  const numPieces = Number(piecesCompleted) || 0;
  const numPieceRate = Number(pieceRateUnit) || 0;
  const numSales = Number(salesAchieved) || 0;
  const numCommRate = Number(commissionRate) || 0;
  const numOtHours = Number(otHours) || 0;
  const numOtRate = Number(otRate) || 0;
  const numPerfBonus = Number(performanceBonus) || 0;
  const numCustomBonus = Number(customBonus) || 0;

  // Extra work earnings depending on role
  let extraWorkEarnings = 0;
  if (employee.payType === 'piece_rate') {
    extraWorkEarnings = numPieces * numPieceRate;
  } else if (employee.payType === 'commission_fixed') {
    extraWorkEarnings = (numSales * numCommRate) / 100;
  }

  const otEarnings = numOtHours * numOtRate;
  const totalBonuses = numPerfBonus + numCustomBonus;
  const grossEarnings = numBase + extraWorkEarnings + otEarnings + totalBonuses;

  const numAdvanceDed = Math.min(Number(advanceDeduction) || 0, employee.advanceLoanRemaining || 0);
  const numLeaveDed = Number(leaveDeduction) || 0;
  const numCustomDed = Number(customDeduction) || 0;
  const autoTax = grossEarnings * 0.05;
  const numTaxDed = Number(taxDeduction) || autoTax;

  const totalDeductions = numAdvanceDed + numLeaveDed + numTaxDed + numCustomDed;
  const netPay = Math.max(0, grossEarnings - totalDeductions);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateEmployeeSalary(employee.id, {
      baseSalary: numBase,
      piecesCompletedThisMonth: numPieces,
      pieceRateUnit: numPieceRate,
      salesAchievedThisMonth: numSales,
      salesCommissionRate: numCommRate,
      manualOtHours: numOtHours,
      overtimeRatePerHour: numOtRate,
      performanceScore: Number(performanceScore) || 4.8,
      performanceBonus: numPerfBonus,
      customBonus: numCustomBonus,
      customBonusNote,
      advanceLoanDeductionPerMonth: numAdvanceDed,
      leaveDeduction: numLeaveDed,
      customDeduction: numCustomDed,
      customDeductionNote,
    });
    if (role !== employee.role) {
      updateEmployee(employee.id, { role });
    }
    onClose();
  };

  // Helper description for role
  const getRolePayDescription = () => {
    if (employee.payType === 'piece_rate') {
      return {
        tag: 'Piece-Rate Craftsman',
        icon: Scissors,
        color: '#34D399',
        summary: 'Base Retainer + Extra pay per garment stitched or cut',
      };
    }
    if (employee.payType === 'commission_fixed') {
      return {
        tag: 'Sales Commission',
        icon: TrendingUp,
        color: '#60A5FA',
        summary: 'Base Salary + % Commission on showroom revenue',
      };
    }
    return {
      tag: 'Fixed Monthly Staff',
      icon: DollarSign,
      color: '#A78BFA',
      summary: 'Guaranteed Monthly Salary + Overtime & Performance bonus',
    };
  };

  const roleInfo = getRolePayDescription();
  const RoleIcon = roleInfo.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Owner Salary Control • ${employee.name}`}
      maxWidth="720px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Employee Header Banner */}
        <div
          style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                fontSize: '2rem',
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'var(--bg-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border)',
              }}
            >
              {employee.avatar || '👤'}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                {employee.name}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {employee.role} • <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{employee.empId}</span> • {payrollMonth || 'Current Month'}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: 'rgba(99, 102, 241, 0.1)',
              border: `1px solid ${roleInfo.color}50`,
              color: roleInfo.color,
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            <RoleIcon size={14} />
            <span>{roleInfo.tag}</span>
          </div>
        </div>

        <div className="card" style={{ padding: '14px', margin: 0, background: 'var(--bg-surface)' }}>
          <label className="form-label" style={{ marginBottom: '8px', fontWeight: 700 }}>
            Employee Role
          </label>
          <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="Cutter">Cutter</option>
            <option value="Master Tailor">Master Tailor</option>
            <option value="Stitching">Stitching</option>
            <option value="Washing">Washing</option>
            <option value="Finishing">Finishing</option>
          </select>
        </div>

        {/* Section 1: Guaranteed Base Pay */}
        <div className="card" style={{ padding: '14px', margin: 0, background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="form-label" style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={16} color="var(--primary)" />
              1. Base Guaranteed Salary (₹)
            </label>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Guaranteed monthly retainer
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
            <input
              type="number"
              step="50"
              min="0"
              className="form-input font-mono"
              style={{ fontSize: '1.05rem', fontWeight: 700 }}
              required
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
            />
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', background: 'var(--bg-surface-elevated)', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>
              Fixed baseline payable before piece-work or overtime.
            </div>
          </div>
        </div>

        {/* Section 2: Extra Performance Work (Role-Dependent) */}
        <div className="card" style={{ padding: '14px', margin: 0, background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <label className="form-label" style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RoleIcon size={16} color="#34D399" />
              2. Extra Work Earnings ({roleInfo.tag})
            </label>
            <div style={{ color: '#34D399', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              +{formatCurrency(extraWorkEarnings, currency)}
            </div>
          </div>

          {employee.payType === 'piece_rate' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Garments / Pieces Completed</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  className="form-input font-mono"
                  value={piecesCompleted}
                  onChange={(e) => setPiecesCompleted(e.target.value)}
                  placeholder="e.g. 18 pcs"
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                  Suits, coats, trousers stitched/cut
                </span>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Avg Rate Per Piece (₹)</label>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  className="form-input font-mono"
                  value={pieceRateUnit}
                  onChange={(e) => setPieceRateUnit(e.target.value)}
                  placeholder="e.g. 28.50"
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                  Calc: {numPieces} pcs × {formatCurrency(numPieceRate, currency)} = {formatCurrency(extraWorkEarnings, currency)}
                </span>
              </div>
            </div>
          )}

          {employee.payType === 'commission_fixed' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Showroom Sales Achieved (₹)</label>
                <input
                  type="number"
                  step="100"
                  min="0"
                  className="form-input font-mono"
                  value={salesAchieved}
                  onChange={(e) => setSalesAchieved(e.target.value)}
                  placeholder="e.g. 8420.00"
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Sales Commission (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="form-input font-mono"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  placeholder="e.g. 2.5%"
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                  Calc: {formatCurrency(numSales, currency)} @ {numCommRate}% = {formatCurrency(extraWorkEarnings, currency)}
                </span>
              </div>
            </div>
          )}

          {employee.payType === 'fixed' && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'var(--bg-surface-elevated)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
              Standard fixed salaried role. Extra income is earned via Overtime hours & Performance Bonuses below.
            </div>
          )}
        </div>

        {/* Section 3: Overtime & Bonuses */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {/* Overtime Box */}
          <div className="card" style={{ padding: '14px', margin: 0, background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} color="#F59E0B" />
                3. Overtime Pay
              </label>
              <div style={{ color: '#F59E0B', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                +{formatCurrency(otEarnings, currency)}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>OT Hours</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  className="form-input font-mono"
                  value={otHours}
                  onChange={(e) => setOtHours(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Rate (₹/hr)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  className="form-input font-mono"
                  value={otRate}
                  onChange={(e) => setOtRate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Quality & Performance Bonus Box */}
          <div className="card" style={{ padding: '14px', margin: 0, background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={16} color="#FBBF24" />
                4. Quality Bonus (₹)
              </label>
              <div style={{ color: '#FBBF24', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                +{formatCurrency(numPerfBonus, currency)}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Rating (★)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  className="form-input font-mono"
                  value={performanceScore}
                  onChange={(e) => {
                    const score = e.target.value;
                    setPerformanceScore(score);
                    if (Number(score) >= 4.8) setPerformanceBonus('50.00');
                    else setPerformanceBonus('25.00');
                  }}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Bonus Amount (₹)</label>
                <input
                  type="number"
                  step="10"
                  min="0"
                  className="form-input font-mono"
                  value={performanceBonus}
                  onChange={(e) => setPerformanceBonus(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Owner Special / Festive Bonus */}
        <div className="card" style={{ padding: '14px', margin: 0, background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="form-label" style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Gift size={16} color="#EC4899" />
              5. Owner Special Bonus / Festive Reward (₹)
            </label>
            <div style={{ color: '#EC4899', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              +{formatCurrency(numCustomBonus, currency)}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '10px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Bonus Amount (₹)</label>
              <input
                type="number"
                step="50"
                min="0"
                className="form-input font-mono"
                placeholder="0.00"
                value={customBonus}
                onChange={(e) => setCustomBonus(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Bonus Reason / Note (Printed on Slip)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Diwali Festive Bonus, Target Milestone Reward"
                value={customBonusNote}
                onChange={(e) => setCustomBonusNote(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 5: Deductions */}
        <div className="card" style={{ padding: '14px', margin: 0, background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="form-label" style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wallet size={16} color="#F43F5E" />
              6. Deductions & Recoveries
            </label>
            <div style={{ color: '#F43F5E', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              -{formatCurrency(totalDeductions, currency)}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>
                Advance Loan Recovery (₹)
              </label>
              <input
                type="number"
                step="10"
                min="0"
                className="form-input font-mono"
                value={advanceDeduction}
                onChange={(e) => setAdvanceDeduction(e.target.value)}
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px', display: 'block' }}>
                Remaining Loan: {formatCurrency(employee.advanceLoanRemaining || 0, currency)}
              </span>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>
                Unpaid Leaves / Late (₹)
              </label>
              <input
                type="number"
                step="10"
                min="0"
                className="form-input font-mono"
                value={leaveDeduction}
                onChange={(e) => setLeaveDeduction(e.target.value)}
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px', display: 'block' }}>
                Unpaid days deduction
              </span>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>
                Tax / Standard (5%) (₹)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                className="form-input font-mono"
                value={taxDeduction || autoTax.toFixed(2)}
                onChange={(e) => setTaxDeduction(e.target.value)}
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px', display: 'block' }}>
                Statutory / standard deduction
              </span>
            </div>
          </div>
        </div>

        {/* Live Calculation Summary Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(99, 102, 241, 0.12))',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Gross Earnings</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                {formatCurrency(grossEarnings, currency)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Deductions</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F43F5E', fontFamily: 'var(--font-mono)' }}>
                -{formatCurrency(totalDeductions, currency)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>NET PAYABLE SALARY</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981', fontFamily: 'var(--font-mono)' }}>
                {formatCurrency(netPay, currency)}
              </div>
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            💡 <strong>Formula:</strong> Base ({formatCurrency(numBase, currency)}) + Extra Work ({formatCurrency(extraWorkEarnings, currency)}) + OT ({formatCurrency(otEarnings, currency)}) + Bonuses ({formatCurrency(totalBonuses, currency)}) - Deductions ({formatCurrency(totalDeductions, currency)}) = <strong>{formatCurrency(netPay, currency)}</strong>
          </div>
        </div>

        {/* Modal Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
            <CheckCircle2 size={16} /> Save & Update Employee Pay
          </button>
        </div>
      </form>
    </Modal>
  );
};
