import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Clock,
  DollarSign,
  Wallet,
  Plus,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Award,
  Scissors,
  TrendingUp,
  Percent,
  Edit3,
  HelpCircle,
  Sparkles,
  Gift,
  LogIn,
  LogOut,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportSalarySlipPDF } from '../../utils/pdfGenerator';
import { StatCard } from '../common/StatCard';
import { NewEmployeeModal } from './NewEmployeeModal';
import { AdvanceLoanModal } from './AdvanceLoanModal';
import { AttendanceModal } from './AttendanceModal';
import { EditSalaryModal } from './EditSalaryModal';
import { CompensationGuideModal } from './CompensationGuideModal';
import { ProductionHistoryModal } from './ProductionHistoryModal';

export const EmployeeView = () => {
  const {
    employees,
    attendance,
    assignedJobs,
    currency,
    updateEmployeeSalary,
    updateAttendanceRecord,
    checkInAttendance,
    checkOutAttendance,
    completeAssignedJob,
    workPayments,
    productionJobs,
    settleWorkPayment,
    settleEmployeeProductionBalance,
  } = useApp();

  const [subTab, setSubTab] = useState('payroll'); // 'payroll', 'profiles', 'attendance'

  // Modals
  const [isNewEmpOpen, setIsNewEmpOpen] = useState(false);
  const [selectedEmpForLoan, setSelectedEmpForLoan] = useState(null);
  const [selectedEmpForSalaryEdit, setSelectedEmpForSalaryEdit] = useState(null);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [selectedEmpForHistory, setSelectedEmpForHistory] = useState(null);

  // Selected Month for Payroll
  const [payrollMonth, setPayrollMonth] = useState('September 2026');

  // Compute stats
  const totalEmployees = employees.length;
  const totalAdvanceOutstanding = employees.reduce((sum, e) => sum + (e.advanceLoanRemaining || 0), 0);
  const totalOvertimeHours = attendance.reduce((sum, a) => sum + (a.otHours || 0), 0);

  // Helper to compute dynamic salary breakdown based on employee's work, performance & owner overrides
  const calculateEmployeeSalary = (emp) => {
    const basePay = emp.baseSalary !== undefined ? Number(emp.baseSalary) : 500;

    // 1. Piece-Rate or Commission Earnings
    let pieceEarnings = 0;
    let commissionEarnings = 0;
    const piecesDone = emp.piecesCompletedThisMonth !== undefined ? Number(emp.piecesCompletedThisMonth) : 15;
    const pieceRate = emp.pieceRateUnit !== undefined ? Number(emp.pieceRateUnit) : 28.50;

    if (emp.payType === 'piece_rate') {
      pieceEarnings = piecesDone * pieceRate;
    } else if (emp.payType === 'commission_fixed') {
      const salesVolume = emp.salesAchievedThisMonth !== undefined ? Number(emp.salesAchievedThisMonth) : 8400;
      const commRate = emp.salesCommissionRate !== undefined ? Number(emp.salesCommissionRate) : 2.5;
      commissionEarnings = (salesVolume * commRate) / 100;
    }

    // 2. Overtime Earnings
    const empAtt = (attendance || []).filter((a) => a.empId === emp.empId || a.empName === emp.name);
    const computedOtHours = empAtt.reduce((sum, a) => sum + (a.otHours || 0), 0);
    const empOtHours = emp.manualOtHours !== undefined ? Number(emp.manualOtHours) : computedOtHours;
    const otRate = emp.overtimeRatePerHour !== undefined ? Number(emp.overtimeRatePerHour) : 8.0;
    const otEarnings = empOtHours * otRate;

    // 3. Performance & Owner Custom Bonuses
    const defaultBonus = (emp.performanceScore ?? 4.8) >= 4.8 ? 50.0 : 25.0;
    const performanceBonus = emp.performanceBonus !== undefined ? Number(emp.performanceBonus) : defaultBonus;
    const customBonus = Number(emp.customBonus || 0);
    const totalBonus = performanceBonus + customBonus;

    const grossEarnings = basePay + pieceEarnings + commissionEarnings + otEarnings + totalBonus;

    // 4. Advance Loan Monthly Deduction
    const advanceDeduction = Math.min(
      emp.advanceLoanDeductionPerMonth !== undefined ? Number(emp.advanceLoanDeductionPerMonth) : 50,
      emp.advanceLoanRemaining || 0
    );

    // 5. Unpaid Leave, Tax & Custom Deductions
    const absentDays = empAtt.filter((a) => a.status === 'Absent').length;
    const autoLeaveDeductions = absentDays * (basePay / 30);
    const leaveDeductions = emp.leaveDeduction !== undefined ? Number(emp.leaveDeduction) : autoLeaveDeductions;

    const autoTax = grossEarnings * 0.05; // 5% standard
    const taxDeduction = emp.taxDeduction !== undefined ? Number(emp.taxDeduction) : autoTax;
    const customDeduction = Number(emp.customDeduction || 0);

    const totalDeductions = advanceDeduction + leaveDeductions + taxDeduction + customDeduction;
    const netPay = Math.max(0, grossEarnings - totalDeductions);

    return {
      month: payrollMonth,
      basePay,
      pieceEarnings: pieceEarnings + commissionEarnings,
      piecesDone,
      pieceRate,
      otHours: empOtHours,
      otEarnings,
      performanceBonus,
      customBonus,
      customBonusNote: emp.customBonusNote || '',
      bonus: totalBonus,
      grossEarnings,
      advanceDeduction,
      leaveDeductions,
      taxDeduction,
      customDeduction,
      customDeductionNote: emp.customDeductionNote || '',
      totalDeductions,
      netPay,
      presentDays: Math.max(0, 26 - absentDays),
      totalDays: 26,
    };
  };

  // Compute month totals for owner summary
  const payrollTotals = employees.reduce(
    (acc, emp) => {
      const s = calculateEmployeeSalary(emp);
      acc.totalBase += s.basePay;
      acc.totalExtraWork += s.pieceEarnings;
      acc.totalOvertime += s.otEarnings;
      acc.totalBonuses += s.bonus;
      acc.totalDeductions += s.totalDeductions;
      acc.totalNetPayout += s.netPay;
      return acc;
    },
    { totalBase: 0, totalExtraWork: 0, totalOvertime: 0, totalBonuses: 0, totalDeductions: 0, totalNetPayout: 0 }
  );

  const handleDownloadPayslip = (emp) => {
    const salaryData = calculateEmployeeSalary(emp);
    exportSalarySlipPDF(emp, salaryData);
  };

  return (
    <div className="view-container">
      {/* Top Header */}
      <div className="responsive-header-row">
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Employee, Attendance & Piece-Rate Payroll</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Attendance logs, advance loans ledger & performance-based piece-rate salary calculations
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setIsGuideOpen(true)}>
            <HelpCircle size={15} color="var(--primary)" /> Guide
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setIsAttendanceOpen(true)}>
            <Clock size={15} /> Attendance Punch
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setIsNewEmpOpen(true)}>
            <Plus size={15} /> Add Employee
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid">
        <StatCard
          label="Active Staff & Master Tailors"
          value={`${totalEmployees} Members`}
          icon={Users}
          color="#6366F1"
        />
        <StatCard
          label="Advance Loans Outstanding"
          value={formatCurrency(totalAdvanceOutstanding, currency)}
          icon={Wallet}
          color="#F43F5E"
          trend="Deducted monthly from salary"
          trendPositive={false}
        />
        <StatCard
          label="Monthly Overtime Logged"
          value={`${totalOvertimeHours.toFixed(1)} Hours`}
          icon={Clock}
          color="#F59E0B"
        />
        <StatCard
          label="Avg Performance Rating"
          value="4.85 / 5.0"
          icon={Award}
          color="#10B981"
        />
      </div>

      {/* Sub-Tabs Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          className={`btn ${subTab === 'payroll' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setSubTab('payroll')}
        >
          <DollarSign size={14} /> Performance & Piece-Rate Salary Engine
        </button>
        <button
          className={`btn ${subTab === 'payments' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setSubTab('payments')}
        >
          <Wallet size={14} /> Ready Employee Payments ({workPayments.length})
        </button>
        <button
          className={`btn ${subTab === 'profiles' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setSubTab('profiles')}
        >
          <Users size={14} /> Employee Profiles & Advance Loan Ledger ({employees.length})
        </button>
        <button
          className={`btn ${subTab === 'attendance' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setSubTab('attendance')}
        >
          <Clock size={14} /> Daily Attendance Logs ({attendance.length})
        </button>
        <button
          className={`btn ${subTab === 'jobs' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setSubTab('jobs')}
        >
          <Scissors size={14} /> Assigned Work ({assignedJobs.length})
        </button>
      </div>

      {/* ----------------------------------------------------
          SUB-TAB 1: Performance-based Salary Engine & Payslip
      ---------------------------------------------------- */}
      {subTab === 'payroll' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Owner Total Payroll Summary Banner */}
          <div
            className="stats-grid"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              gap: '14px',
              marginBottom: '0px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Total Base Salaries</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                {formatCurrency(payrollTotals.totalBase, currency)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Extra Work (Pieces / Comm.)</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34D399', fontFamily: 'var(--font-mono)' }}>
                +{formatCurrency(payrollTotals.totalExtraWork, currency)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Total Overtime (OT)</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F59E0B', fontFamily: 'var(--font-mono)' }}>
                +{formatCurrency(payrollTotals.totalOvertime, currency)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Total Bonuses & Rewards</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FBBF24', fontFamily: 'var(--font-mono)' }}>
                +{formatCurrency(payrollTotals.totalBonuses, currency)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Total Deductions Recovered</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F43F5E', fontFamily: 'var(--font-mono)' }}>
                -{formatCurrency(payrollTotals.totalDeductions, currency)}
              </div>
            </div>
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700, marginBottom: '2px' }}>TOTAL NET PAYOUT</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#10B981', fontFamily: 'var(--font-mono)' }}>
                {formatCurrency(payrollTotals.totalNetPayout, currency)}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DollarSign size={18} color="#10B981" />
                  Monthly Performance-Based Salary Calculation & Payslips
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  ✨ <strong>Instant Inline Editing:</strong> Modify any number directly inside the row cells below. Changes save instantly and recalculate net pay!
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Payroll Month:</span>
                <select
                  className="form-select"
                  style={{ width: '150px', padding: '4px 8px', fontSize: '0.8rem' }}
                  value={payrollMonth}
                  onChange={(e) => setPayrollMonth(e.target.value)}
                >
                  <option value="September 2026">September 2026</option>
                  <option value="August 2026">August 2026</option>
                  <option value="July 2026">July 2026</option>
                </select>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="table-responsive desktop-only-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee & Role</th>
                    <th style={{ minWidth: '130px' }}>Base Pay (₹)</th>
                    <th style={{ minWidth: '170px' }}>Piece / Sales Work</th>
                    <th style={{ minWidth: '150px' }}>Overtime Pay</th>
                    <th style={{ minWidth: '140px' }}>Bonuses (₹)</th>
                    <th style={{ minWidth: '140px' }}>Deductions (₹)</th>
                    <th style={{ minWidth: '120px' }}>Net Payable</th>
                    <th style={{ textAlign: 'center', minWidth: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => {
                    const salary = calculateEmployeeSalary(emp);
                    return (
                      <tr key={emp.id}>
                        {/* 1. Employee Info */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.5rem' }}>{emp.avatar || '👤'}</span>
                            <div>
                              <div style={{ fontWeight: 700 }}>{emp.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>{emp.role}</span>
                                <span>•</span>
                                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{emp.empId}</span>
                                <span>•</span>
                                <span
                                  className="badge"
                                  style={{
                                    fontSize: '0.65rem',
                                    padding: '2px 6px',
                                    background:
                                      emp.payType === 'piece_rate'
                                        ? 'rgba(52, 211, 153, 0.15)'
                                        : emp.payType === 'commission_fixed'
                                        ? 'rgba(96, 165, 250, 0.15)'
                                        : 'rgba(167, 139, 250, 0.15)',
                                    color:
                                      emp.payType === 'piece_rate'
                                        ? '#34D399'
                                        : emp.payType === 'commission_fixed'
                                        ? '#60A5FA'
                                        : '#A78BFA',
                                  }}
                                >
                                  {emp.payType === 'piece_rate'
                                    ? '🧵 Piece-Rate'
                                    : emp.payType === 'commission_fixed'
                                    ? '💼 Commission'
                                    : '🏢 Fixed'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Base Pay (Inline Editable) */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>₹</span>
                            <input
                              type="number"
                              step="50"
                              min="0"
                              className="form-input font-mono"
                              style={{
                                width: '95px',
                                padding: '4px 8px',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                background: 'var(--bg-surface-elevated)',
                              }}
                              value={emp.baseSalary !== undefined ? emp.baseSalary : 500}
                              onChange={(e) => updateEmployeeSalary(emp.id, { baseSalary: Number(e.target.value) || 0 })}
                              title="Directly edit Base Guaranteed Salary"
                            />
                          </div>
                        </td>

                        {/* 3. Piece / Sales Work (Inline Editable) */}
                        <td>
                          {emp.payType === 'piece_rate' && (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                                <input
                                  type="number"
                                  step="1"
                                  min="0"
                                  className="form-input font-mono"
                                  style={{ width: '50px', padding: '3px 6px', fontSize: '0.8rem', fontWeight: 700 }}
                                  value={salary.piecesDone}
                                  onChange={(e) => updateEmployeeSalary(emp.id, { piecesCompletedThisMonth: Number(e.target.value) || 0 })}
                                  title="Edit pieces completed this month"
                                />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>pcs @ ₹</span>
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  className="form-input font-mono"
                                  style={{ width: '56px', padding: '3px 6px', fontSize: '0.8rem', fontWeight: 700 }}
                                  value={salary.pieceRate}
                                  onChange={(e) => updateEmployeeSalary(emp.id, { pieceRateUnit: Number(e.target.value) || 0 })}
                                  title="Edit piece rate per garment"
                                />
                              </div>
                              <div style={{ color: '#34D399', fontWeight: 800, fontSize: '0.85rem' }} className="font-mono">
                                +{formatCurrency(salary.pieceEarnings, currency)}
                              </div>
                            </div>
                          )}

                          {emp.payType === 'commission_fixed' && (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sales ₹</span>
                                <input
                                  type="number"
                                  step="100"
                                  min="0"
                                  className="form-input font-mono"
                                  style={{ width: '70px', padding: '3px 6px', fontSize: '0.8rem', fontWeight: 700 }}
                                  value={emp.salesAchievedThisMonth !== undefined ? emp.salesAchievedThisMonth : 8400}
                                  onChange={(e) => updateEmployeeSalary(emp.id, { salesAchievedThisMonth: Number(e.target.value) || 0 })}
                                  title="Edit monthly sales revenue achieved"
                                />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@</span>
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  className="form-input font-mono"
                                  style={{ width: '44px', padding: '3px 6px', fontSize: '0.8rem', fontWeight: 700 }}
                                  value={emp.salesCommissionRate !== undefined ? emp.salesCommissionRate : 2.5}
                                  onChange={(e) => updateEmployeeSalary(emp.id, { salesCommissionRate: Number(e.target.value) || 0 })}
                                  title="Edit sales commission %"
                                />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>%</span>
                              </div>
                              <div style={{ color: '#60A5FA', fontWeight: 800, fontSize: '0.85rem' }} className="font-mono">
                                +{formatCurrency(salary.pieceEarnings, currency)}
                              </div>
                            </div>
                          )}

                          {emp.payType === 'fixed' && (
                            <div>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Standard Shift</span>
                              <div style={{ color: '#A78BFA', fontWeight: 700, fontSize: '0.75rem' }}>Fixed Retainer</div>
                            </div>
                          )}
                        </td>

                        {/* 4. Overtime Pay (Inline Editable) */}
                        <td>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                className="form-input font-mono"
                                style={{ width: '50px', padding: '3px 6px', fontSize: '0.8rem', fontWeight: 700 }}
                                value={salary.otHours}
                                onChange={(e) => updateEmployeeSalary(emp.id, { manualOtHours: Number(e.target.value) || 0 })}
                                title="Directly edit overtime hours"
                              />
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>hrs @ ₹</span>
                              <input
                                type="number"
                                step="1"
                                min="0"
                                className="form-input font-mono"
                                style={{ width: '48px', padding: '3px 6px', fontSize: '0.8rem', fontWeight: 700 }}
                                value={emp.overtimeRatePerHour !== undefined ? emp.overtimeRatePerHour : 8.0}
                                onChange={(e) => updateEmployeeSalary(emp.id, { overtimeRatePerHour: Number(e.target.value) || 0 })}
                                title="Edit hourly overtime rate"
                              />
                            </div>
                            <div style={{ color: '#F59E0B', fontWeight: 800, fontSize: '0.85rem' }} className="font-mono">
                              +{formatCurrency(salary.otEarnings, currency)}
                            </div>
                          </div>
                        </td>

                        {/* 5. Bonuses & Rewards (Inline Editable) */}
                        <td>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                              <span style={{ fontSize: '0.75rem', color: '#FBBF24', fontWeight: 700 }}>+₹</span>
                              <input
                                type="number"
                                step="10"
                                min="0"
                                className="form-input font-mono"
                                style={{ width: '70px', padding: '3px 6px', fontSize: '0.8rem', fontWeight: 700 }}
                                value={salary.bonus}
                                onChange={(e) => updateEmployeeSalary(emp.id, { customBonus: Number(e.target.value) || 0, performanceBonus: 0 })}
                                title="Directly edit bonus amount"
                              />
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                              {salary.customBonus > 0 ? (
                                <span style={{ color: '#EC4899', fontWeight: 600 }}>Custom Reward</span>
                              ) : (
                                `Rating: ${emp.performanceScore || 4.8}★`
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 6. Advance / Deductions (Inline Editable) */}
                        <td>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                              <span style={{ fontSize: '0.75rem', color: '#F43F5E', fontWeight: 700 }}>-₹</span>
                              <input
                                type="number"
                                step="10"
                                min="0"
                                className="form-input font-mono"
                                style={{ width: '70px', padding: '3px 6px', fontSize: '0.8rem', fontWeight: 700 }}
                                value={salary.totalDeductions}
                                onChange={(e) =>
                                  updateEmployeeSalary(emp.id, {
                                    advanceLoanDeductionPerMonth: Number(e.target.value) || 0,
                                    leaveDeduction: 0,
                                    taxDeduction: 0,
                                  })
                                }
                                title="Directly edit total deductions for month"
                              />
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                              {emp.advanceLoanRemaining > 0 ? `Loan Bal: ${formatCurrency(emp.advanceLoanRemaining, currency)}` : 'Leaves / Tax'}
                            </div>
                          </div>
                        </td>

                        {/* 7. Net Payable Salary (Real-time Live calculated) */}
                        <td>
                          <strong style={{ fontSize: '1.15rem', color: '#10B981', fontFamily: 'var(--font-mono)', fontWeight: 900 }}>
                            {formatCurrency(salary.netPay, currency)}
                          </strong>
                        </td>

                        {/* 8. Actions */}
                        <td>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setSelectedEmpForSalaryEdit(emp)}
                              title="Full Details & Reason Notes Modal"
                              style={{ padding: '4px 8px' }}
                            >
                              <Edit3 size={13} color="var(--primary)" />
                            </button>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleDownloadPayslip(emp)}
                              title="Generate official monthly payslip PDF"
                              style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Download size={13} /> PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards Format */}
            <div className="mobile-only-cards" style={{ marginTop: '12px' }}>
              {employees.map((emp) => {
                const salary = calculateEmployeeSalary(emp);
                return (
                  <div key={emp.id} className="mobile-data-card">
                    {/* Top Row: Avatar & EmpId (Left) + Pay Type & Performance (Right) */}
                    <div className="mobile-card-top">
                      <div className="mobile-card-badge-group">
                        <div className="mobile-card-icon-box" style={{ fontSize: '1.3rem' }}>
                          {emp.avatar || '👤'}
                        </div>
                        <span className="badge badge-primary font-mono">{emp.empId}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          className="badge"
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            background:
                              emp.payType === 'piece_rate'
                                ? 'rgba(52, 211, 153, 0.15)'
                                : emp.payType === 'commission_fixed'
                                ? 'rgba(96, 165, 250, 0.15)'
                                : 'rgba(167, 139, 250, 0.15)',
                            color:
                              emp.payType === 'piece_rate'
                                ? '#34D399'
                                : emp.payType === 'commission_fixed'
                                ? '#60A5FA'
                                : '#A78BFA',
                          }}
                        >
                          {emp.payType === 'piece_rate'
                            ? '🧵 Piece-Rate'
                            : emp.payType === 'commission_fixed'
                            ? '💼 Comm'
                            : '🏢 Fixed'}
                        </span>
                        <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                          ★ {emp.performanceScore || 4.8}
                        </span>
                      </div>
                    </div>

                    {/* Title & Subtitle */}
                    <div>
                      <h3 className="mobile-card-title">{emp.name}</h3>
                      <div className="mobile-card-subtitle">
                        {emp.role} • {payrollMonth}
                      </div>
                    </div>

                    {/* Details: Base, Incentive, OT, Deductions */}
                    <div className="mobile-card-details">
                      <div className="mobile-card-details-row">
                        <span>Base Guaranteed:</span>
                        <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                          {formatCurrency(emp.baseSalary !== undefined ? emp.baseSalary : 500, currency)}
                        </span>
                      </div>

                      {emp.payType === 'piece_rate' && (
                        <div className="mobile-card-details-row">
                          <span>Piece Work ({salary.piecesDone} pcs @ ₹{salary.pieceRate}):</span>
                          <span className="font-mono" style={{ fontWeight: 700, color: '#34D399' }}>
                            +{formatCurrency(salary.pieceEarnings, currency)}
                          </span>
                        </div>
                      )}

                      {emp.payType === 'commission_fixed' && (
                        <div className="mobile-card-details-row">
                          <span>Sales Commission:</span>
                          <span className="font-mono" style={{ fontWeight: 700, color: '#60A5FA' }}>
                            +{formatCurrency(salary.pieceEarnings, currency)}
                          </span>
                        </div>
                      )}

                      <div className="mobile-card-details-row">
                        <span>Overtime ({salary.otHours} hrs):</span>
                        <span className="font-mono" style={{ fontWeight: 700, color: '#F59E0B' }}>
                          +{formatCurrency(salary.otEarnings, currency)}
                        </span>
                      </div>

                      {salary.bonus > 0 && (
                        <div className="mobile-card-details-row">
                          <span>Bonuses / Incentives:</span>
                          <span className="font-mono" style={{ fontWeight: 700, color: '#FBBF24' }}>
                            +{formatCurrency(salary.bonus, currency)}
                          </span>
                        </div>
                      )}

                      {salary.totalDeductions > 0 && (
                        <div className="mobile-card-details-row">
                          <span>Deductions / Advances:</span>
                          <span className="font-mono" style={{ fontWeight: 700, color: '#F43F5E' }}>
                            -{formatCurrency(salary.totalDeductions, currency)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ justifyContent: 'center' }}
                        onClick={() => setSelectedEmpForSalaryEdit(emp)}
                      >
                        <Edit3 size={13} color="var(--primary)" /> Edit Salary
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ justifyContent: 'center' }}
                        onClick={() => handleDownloadPayslip(emp)}
                      >
                        <Download size={13} /> Payslip PDF
                      </button>
                    </div>

                    {/* Dashed Separator */}
                    <div className="mobile-card-divider" />

                    {/* Footer Row */}
                    <div className="mobile-card-footer">
                      <span className="mobile-card-footer-label">Net Salary Payable:</span>
                      <span className="mobile-card-footer-value" style={{ color: '#10B981' }}>
                        {formatCurrency(salary.netPay, currency)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          SUB-TAB 2: Employee Profiles & Advance Loan Ledger
      ---------------------------------------------------- */}
      {subTab === 'profiles' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {employees.map((emp) => {
            const hasAdvance = (emp.advanceLoanRemaining || 0) > 0;
            return (
              <div key={emp.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '2rem', background: 'var(--bg-surface-elevated)', width: '45px', height: '45px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {emp.avatar || '👤'}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{emp.name}</h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {emp.role} • {emp.department}
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-primary">{emp.empId}</span>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Base Guaranteed Salary:</span>
                    <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(emp.baseSalary, currency)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Compensation Model:</span>
                    <span style={{ textTransform: 'capitalize', color: 'var(--primary)', fontWeight: 600 }}>
                      {emp.payType.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Quality Performance:</span>
                    <span style={{ color: '#10B981', fontWeight: 700 }}>{emp.performanceScore || 4.8} / 5.0 ★</span>
                  </div>
                </div>


                {/* Advance Loan Status Box */}
                <div
                  style={{
                    background: hasAdvance ? 'rgba(244, 63, 94, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                    border: `1px solid ${hasAdvance ? 'rgba(244, 63, 94, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '10px',
                    fontSize: '0.8rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, color: hasAdvance ? '#FB7185' : '#34D399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Wallet size={14} />
                      {hasAdvance ? 'Advance Loan Taken' : 'No Active Advance Loan'}
                    </span>
                    <span className="font-mono" style={{ fontWeight: 800, color: hasAdvance ? '#FB7185' : '#34D399' }}>
                      {formatCurrency(emp.advanceLoanRemaining || 0, currency)}
                    </span>
                  </div>

                  {hasAdvance && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Deduction: {formatCurrency(emp.advanceLoanDeductionPerMonth || 50, currency)} / month from salary
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => setSelectedEmpForHistory(emp)}
                  >
                    <TrendingUp size={13} /> Production & Earnings History
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => setSelectedEmpForSalaryEdit(emp)}
                  >
                    <Edit3 size={13} /> Edit Pay
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => setSelectedEmpForLoan(emp)}
                  >
                    <Wallet size={13} color="#F43F5E" /> Advance Loan
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => handleDownloadPayslip(emp)}
                  >
                    <FileText size={13} /> Payslip
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ----------------------------------------------------
          SUB-TAB 3: Daily Attendance Logs with Inline Status (P/A/H/L) & Times
      ---------------------------------------------------- */}
      {subTab === 'attendance' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#F59E0B" />
                Daily Attendance Logs & Clock-In/Out
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                ✨ <strong>Quick 1-Click Controls:</strong> Click <strong>P</strong> (Present), <strong>A</strong> (Absent), <strong>H</strong> (Half Day), or <strong>L</strong> (Leave) to toggle status directly. Use Check In and Check Out to record the current time automatically.
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setIsAttendanceOpen(true)}>
              <Plus size={14} /> New Clock Punch
            </button>
          </div>

          {/* Desktop Table View */}
          <div className="table-responsive desktop-only-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee Name</th>
                  <th style={{ minWidth: '220px' }}>Status Quick Selector (P / A / H / L)</th>
                  <th style={{ minWidth: '150px' }}>Clock-In</th>
                  <th style={{ minWidth: '150px' }}>Clock-Out</th>
                  <th style={{ minWidth: '110px' }}>Overtime (OT)</th>
                  <th style={{ minWidth: '180px' }}>Shift Notes</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((att) => (
                  <tr key={att.id}>
                    {/* Date */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className="font-mono" style={{ fontSize: '0.85rem' }}>{formatDate(att.date)}</span>
                    </td>

                    {/* Employee */}
                    <td>
                      <div style={{ fontWeight: 700 }}>{att.empName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{att.empId}</div>
                    </td>

                    {/* Quick P / A / H / L Segmented Toggle Buttons */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            background: 'var(--bg-surface-elevated)',
                            borderRadius: '8px',
                            padding: '3px',
                            border: '1px solid var(--border)',
                            gap: '3px',
                          }}
                        >
                          {/* P - Present */}
                          <button
                            type="button"
                            onClick={() => updateAttendanceRecord(att.id, { status: 'Present' })}
                            title="P: Mark Present (Full Day)"
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: 'none',
                              fontWeight: 800,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s',
                              background: att.status === 'Present' ? '#10B981' : 'transparent',
                              color: att.status === 'Present' ? '#FFFFFF' : 'var(--text-muted)',
                              boxShadow: att.status === 'Present' ? '0 2px 8px rgba(16, 185, 129, 0.4)' : 'none',
                            }}
                          >
                            P
                          </button>

                          {/* A - Absent */}
                          <button
                            type="button"
                            onClick={() => updateAttendanceRecord(att.id, { status: 'Absent' })}
                            title="A: Mark Absent (Unpaid Day / Deduction)"
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: 'none',
                              fontWeight: 800,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s',
                              background: att.status === 'Absent' ? '#F43F5E' : 'transparent',
                              color: att.status === 'Absent' ? '#FFFFFF' : 'var(--text-muted)',
                              boxShadow: att.status === 'Absent' ? '0 2px 8px rgba(244, 63, 94, 0.4)' : 'none',
                            }}
                          >
                            A
                          </button>

                          {/* H - Half Day */}
                          <button
                            type="button"
                            onClick={() => updateAttendanceRecord(att.id, { status: 'Half Day' })}
                            title="H: Mark Half Day"
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: 'none',
                              fontWeight: 800,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s',
                              background: att.status === 'Half Day' ? '#F59E0B' : 'transparent',
                              color: att.status === 'Half Day' ? '#FFFFFF' : 'var(--text-muted)',
                              boxShadow: att.status === 'Half Day' ? '0 2px 8px rgba(245, 158, 11, 0.4)' : 'none',
                            }}
                          >
                            H
                          </button>

                          {/* L - Leave */}
                          <button
                            type="button"
                            onClick={() => updateAttendanceRecord(att.id, { status: 'Leave' })}
                            title="L: Mark Approved Leave"
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: 'none',
                              fontWeight: 800,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s',
                              background: att.status === 'Leave' ? '#8B5CF6' : 'transparent',
                              color: att.status === 'Leave' ? '#FFFFFF' : 'var(--text-muted)',
                              boxShadow: att.status === 'Leave' ? '0 2px 8px rgba(139, 92, 246, 0.4)' : 'none',
                            }}
                          >
                            L
                          </button>
                        </div>

                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color:
                              att.status === 'Present'
                                ? '#34D399'
                                : att.status === 'Absent'
                                ? '#FB7185'
                                : att.status === 'Half Day'
                                ? '#FBBF24'
                                : '#A78BFA',
                          }}
                        >
                          {att.status}
                        </span>
                      </div>
                    </td>

                    {/* Clock-In Time */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-start' }}>
                        <span className="font-mono" style={{ fontSize: '0.8rem', color: att.inTime ? 'var(--text-main)' : 'var(--text-dim)' }}>
                          {att.inTime || 'Not checked in'}
                        </span>
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={() => checkInAttendance(att.id)}
                          disabled={Boolean(att.inTime)}
                          title="Record the current check-in time"
                        >
                          <LogIn size={13} /> Check In
                        </button>
                      </div>
                    </td>

                    {/* Clock-Out Time */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-start' }}>
                        <span className="font-mono" style={{ fontSize: '0.8rem', color: att.outTime ? 'var(--text-main)' : 'var(--text-dim)' }}>
                          {att.outTime || 'Not checked out'}
                        </span>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => checkOutAttendance(att.id)}
                          disabled={!att.inTime || Boolean(att.outTime)}
                          title="Record the current check-out time"
                        >
                          <LogOut size={13} /> Check Out
                        </button>
                      </div>
                    </td>

                    {/* Overtime Hours (Direct Editable) */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '0.8rem', color: att.otHours > 0 ? '#F59E0B' : 'var(--text-dim)', fontWeight: 700 }}>+</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          className="form-input font-mono"
                          style={{
                            width: '56px',
                            padding: '4px 6px',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: att.otHours > 0 ? '#F59E0B' : 'var(--text-main)',
                          }}
                          value={att.otHours !== undefined ? att.otHours : 0}
                          onChange={(e) => updateAttendanceRecord(att.id, { otHours: Number(e.target.value) || 0 })}
                          title="Edit Overtime Hours directly"
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>hrs</span>
                      </div>
                    </td>

                    {/* Shift Notes (Direct Editable) */}
                    <td>
                      <input
                        type="text"
                        className="form-input"
                        style={{ width: '100%', minWidth: '150px', padding: '4px 8px', fontSize: '0.8rem' }}
                        placeholder="Shift notes..."
                        value={att.notes || ''}
                        onChange={(e) => updateAttendanceRecord(att.id, { notes: e.target.value })}
                        title="Edit Shift Notes directly"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Responsive Cards Format */}
          <div className="mobile-only-cards" style={{ marginTop: '12px' }}>
            {attendance.map((att) => (
              <div key={att.id} className="mobile-data-card">
                {/* Top Row: Icon + Date Badge (Left) and Status (Right) */}
                <div className="mobile-card-top">
                  <div className="mobile-card-badge-group">
                    <div className="mobile-card-icon-box">
                      <Clock size={18} color="#F59E0B" />
                    </div>
                    <span className="badge badge-primary font-mono">{formatDate(att.date)}</span>
                  </div>
                  <span
                    className="badge"
                    style={{
                      background:
                        att.status === 'Present'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : att.status === 'Absent'
                          ? 'rgba(244, 63, 94, 0.15)'
                          : att.status === 'Half Day'
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'rgba(139, 92, 246, 0.15)',
                      color:
                        att.status === 'Present'
                          ? '#34D399'
                          : att.status === 'Absent'
                          ? '#FB7185'
                          : att.status === 'Half Day'
                          ? '#FBBF24'
                          : '#A78BFA',
                      fontWeight: 700,
                    }}
                  >
                    {att.status}
                  </span>
                </div>

                {/* Title & Subtitle */}
                <div>
                  <h3 className="mobile-card-title">{att.empName}</h3>
                  <div className="mobile-card-subtitle">
                    Employee ID: {att.empId}
                  </div>
                </div>

                {/* Quick P / A / H / L Selector for Mobile */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface-elevated)', padding: '6px 10px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Quick Status:</span>
                  <div style={{ display: 'inline-flex', gap: '4px' }}>
                    {['Present', 'Absent', 'Half Day', 'Leave'].map((st) => {
                      const letter = st === 'Present' ? 'P' : st === 'Absent' ? 'A' : st === 'Half Day' ? 'H' : 'L';
                      const isSel = att.status === st;
                      const bg = st === 'Present' ? '#10B981' : st === 'Absent' ? '#F43F5E' : st === 'Half Day' ? '#F59E0B' : '#8B5CF6';
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => updateAttendanceRecord(att.id, { status: st })}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            border: 'none',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isSel ? bg : 'transparent',
                            color: isSel ? '#FFFFFF' : 'var(--text-muted)',
                            boxShadow: isSel ? `0 2px 6px ${bg}66` : 'none',
                          }}
                        >
                          {letter}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Details: Clock In, Clock Out, Notes */}
                <div className="mobile-card-details">
                  <div className="mobile-card-details-row">
                    <span>Clock-In:</span>
                    <span className="font-mono" style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {att.inTime || 'Not checked in'}
                    </span>
                  </div>
                  <div className="mobile-card-details-row">
                    <span>Clock-Out:</span>
                    <span className="font-mono" style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {att.outTime || 'Not checked out'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button type="button" className="btn btn-success btn-sm" onClick={() => checkInAttendance(att.id)} disabled={Boolean(att.inTime)}>
                      <LogIn size={13} /> Check In
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => checkOutAttendance(att.id)} disabled={!att.inTime || Boolean(att.outTime)}>
                      <LogOut size={13} /> Check Out
                    </button>
                  </div>
                  {att.notes && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic', marginTop: '2px' }}>
                      Note: {att.notes}
                    </div>
                  )}
                </div>

                {/* Dashed Separator */}
                <div className="mobile-card-divider" />

                {/* Footer Row */}
                <div className="mobile-card-footer">
                  <span className="mobile-card-footer-label">Overtime Logged:</span>
                  <span
                    className="mobile-card-footer-value"
                    style={{ color: att.otHours > 0 ? '#F59E0B' : 'var(--text-muted)' }}
                  >
                    {att.otHours || 0} hrs
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'jobs' && (
        <div className="card table-responsive">
          <div className="card-header">
            <div>
              <h3 className="card-title"><Scissors size={18} color="#6366F1" /> Assigned Booking Work</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Complete production tasks here. Payroll eligibility is released only after delivery and payment settlement.
              </p>
            </div>
          </div>
          {assignedJobs.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', padding: '20px' }}>No assigned booking work found.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Employee</th>
                  <th>Garment</th>
                  <th>Work Status</th>
                  <th>Incentive</th>
                  <th>Payroll Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {assignedJobs.map((job) => (
                  <tr key={job.id}>
                    <td><strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{job.bookingId}</strong></td>
                    <td>{job.masterName}</td>
                    <td>{job.garmentType}</td>
                    <td><span className={`badge ${job.workStatus === 'COMPLETED' ? 'badge-success' : 'badge-primary'}`}>{job.workStatus}</span></td>
                    <td>{formatCurrency(job.incentiveRate, currency)}</td>
                    <td><span className={`badge ${job.payoutStatus === 'READY_FOR_PAYROLL' ? 'badge-success' : 'badge-warning'}`}>{job.payoutStatus}</span></td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        disabled={job.workStatus === 'COMPLETED'}
                        onClick={() => completeAssignedJob(job.id)}
                      >
                        <CheckCircle2 size={13} /> {job.workStatus === 'COMPLETED' ? 'Completed' : 'Mark Complete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {subTab === 'payments' && (
        <div className="card table-responsive">
          <div className="card-header">
            <div>
              <h3 className="card-title"><Wallet size={18} color="#10B981" /> Ready for Delivery Employee Dues</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Only production work attached to delivery-ready products appears here.</p>
            </div>
          </div>
          {workPayments.length === 0 ? <p style={{ color: 'var(--text-dim)', padding: '20px' }}>No unsettled production payments.</p> : (
            <table className="data-table">
              <thead><tr><th>Employee</th><th>Project</th><th>Quantity</th><th>Due</th><th>Ready Since</th><th>Action</th></tr></thead>
              <tbody>{workPayments.map((job) => <tr key={job.id}>
                <td><strong>{job.employeeName}</strong></td><td>{job.projectName}</td><td>{job.quantity}</td>
                <td style={{ color: '#F59E0B', fontWeight: 800 }}>{formatCurrency(job.agreedAmount, currency)}</td><td>{job.readyAt || '-'}</td>
                <td><button className="btn btn-success btn-sm" onClick={() => settleWorkPayment(job.id)}><CheckCircle2 size={13} /> Settle Payment</button></td>
              </tr>)}</tbody>
            </table>
          )}
        </div>
      )}

      {/* Modals */}
      <NewEmployeeModal isOpen={isNewEmpOpen} onClose={() => setIsNewEmpOpen(false)} />
      <AdvanceLoanModal
        isOpen={Boolean(selectedEmpForLoan)}
        onClose={() => setSelectedEmpForLoan(null)}
        employee={selectedEmpForLoan}
      />
      <EditSalaryModal
        isOpen={Boolean(selectedEmpForSalaryEdit)}
        onClose={() => setSelectedEmpForSalaryEdit(null)}
        employee={selectedEmpForSalaryEdit}
        payrollMonth={payrollMonth}
      />
      <CompensationGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
      <AttendanceModal isOpen={isAttendanceOpen} onClose={() => setIsAttendanceOpen(false)} />
      <ProductionHistoryModal
        isOpen={Boolean(selectedEmpForHistory)}
        onClose={() => setSelectedEmpForHistory(null)}
        employee={selectedEmpForHistory}
        jobs={(productionJobs || []).filter((job) => job.employeeId === selectedEmpForHistory?.id)}
        currency={currency}
        onSettle={async (employeeId) => {
          await settleEmployeeProductionBalance(employeeId);
          setSelectedEmpForHistory(null);
        }}
      />
    </div>
  );
};
