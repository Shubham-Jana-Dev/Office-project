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
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  BarChart2,
  List,
  RefreshCw,
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
    markPresent,
    markAbsent,
    checkInAttendance,
    checkOutAttendance,
    reStampInAttendance,
    reStampOutAttendance,
    logDailyAttendance,
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

  // Attendance Module State & Filtering
  const [timeHorizon, setTimeHorizon] = useState('daily'); // 'daily', 'monthly', 'yearly'
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedEmpFilter, setSelectedEmpFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [attendanceViewMode, setAttendanceViewMode] = useState('detailed'); // 'detailed', 'rollup'

  // Daily Navigation Handlers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Build attendance logs for display (ensuring daily view includes active employees)
  const getAttendanceForDisplay = () => {
    let records = [];

    if (timeHorizon === 'daily') {
      records = employees.map((emp) => {
        const existing = (attendance || []).find(
          (a) => a.date === selectedDate && (a.empId === emp.empId || a.empId === emp.id || a.empName === emp.name)
        );
        if (existing) {
          return existing;
        }
        return {
          id: null,
          empId: emp.empId || emp.id,
          empName: emp.name,
          date: selectedDate,
          status: 'Not Marked',
          inTime: '',
          outTime: '',
          otHours: 0,
          notes: '',
          empObj: emp,
        };
      });
    } else if (timeHorizon === 'monthly') {
      records = (attendance || []).filter((a) => a.date && a.date.startsWith(selectedMonth));
    } else if (timeHorizon === 'yearly') {
      records = (attendance || []).filter((a) => a.date && a.date.startsWith(selectedYear));
    }

    if (selectedEmpFilter !== 'ALL') {
      records = records.filter(
        (r) => r.empId === selectedEmpFilter || r.empName === selectedEmpFilter
      );
    }

    if (selectedStatusFilter !== 'ALL') {
      records = records.filter((r) => r.status === selectedStatusFilter);
    }

    return records;
  };

  const displayedAttendance = getAttendanceForDisplay();

  // Dynamic KPI Banner Summaries
  const attTotalLogs = displayedAttendance.length;
  const attPresentCount = displayedAttendance.filter((r) => r.status === 'Present').length;
  const attAbsentCount = displayedAttendance.filter((r) => r.status === 'Absent').length;
  const attRate = attTotalLogs > 0 ? Math.round((attPresentCount / attTotalLogs) * 100) : 0;
  const attTotalOt = displayedAttendance.reduce((sum, r) => sum + (Number(r.otHours) || 0), 0);

  // Rollup Aggregation per Employee for Monthly / Yearly mode
  const employeeRollup = employees.map((emp) => {
    const empLogs = (attendance || []).filter((a) => {
      const matchEmp = a.empId === emp.empId || a.empId === emp.id || a.empName === emp.name;
      if (!matchEmp) return false;
      if (timeHorizon === 'monthly') return a.date && a.date.startsWith(selectedMonth);
      if (timeHorizon === 'yearly') return a.date && a.date.startsWith(selectedYear);
      return true;
    });

    const presentDays = empLogs.filter((a) => a.status === 'Present').length;
    const halfDays = empLogs.filter((a) => a.status === 'Half Day').length;
    const absentDays = empLogs.filter((a) => a.status === 'Absent').length;
    const effectivePresent = presentDays + halfDays * 0.5;
    const totalShifts = empLogs.length;
    const rate = totalShifts > 0 ? Math.round((effectivePresent / totalShifts) * 100) : 100;
    const otHours = empLogs.reduce((sum, a) => sum + (Number(a.otHours) || 0), 0);

    return {
      empId: emp.empId || emp.id,
      empName: emp.name,
      role: emp.role,
      totalShifts,
      presentDays,
      halfDays,
      absentDays,
      rate,
      otHours,
    };
  });

  // Export CSV with UTF-8 BOM (\uFEFF)
  const handleExportCSV = () => {
    let csvContent = '\uFEFF';
    let filename = '';

    if (attendanceViewMode === 'rollup' && timeHorizon !== 'daily') {
      filename = `attendance_summary_${timeHorizon}_${timeHorizon === 'monthly' ? selectedMonth : selectedYear}.csv`;
      csvContent += 'Employee ID,Employee Name,Role,Total Shifts,Present Days,Half Days,Absent Days,Attendance Rate (%),Total OT Hours\n';
      employeeRollup.forEach((row) => {
        csvContent += `"${row.empId}","${row.empName}","${row.role}",${row.totalShifts},${row.presentDays},${row.halfDays},${row.absentDays},${row.rate}%,${row.otHours}\n`;
      });
    } else {
      filename = `attendance_detailed_${timeHorizon}_${selectedDate}.csv`;
      csvContent += 'Date,Employee ID,Employee Name,Status,Clock-In,Clock-Out,Overtime (OT Hours),Shift Notes\n';
      displayedAttendance.forEach((row) => {
        csvContent += `"${row.date}","${row.empId}","${row.empName}","${row.status}","${row.inTime || ''}","${row.outTime || ''}",${row.otHours || 0},"${(row.notes || '').replace(/"/g, '""')}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
          SUB-TAB 3: Attendance Management & History Dashboard
      ---------------------------------------------------- */}
      {subTab === 'attendance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header Controls & Period Filtering Bar */}
          <div
            className="card"
            style={{
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {/* Top Bar: Title & Primary Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={20} color="#F59E0B" />
                  Attendance Management & Shift History
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Track punches, mark quick P/A statuses, manage OT, and export UTF-8 BOM CSV reports.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {timeHorizon !== 'daily' && (
                  <div style={{ display: 'inline-flex', background: 'var(--bg-surface-elevated)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border)' }}>
                    <button
                      className={`btn ${attendanceViewMode === 'detailed' ? 'btn-primary' : 'btn-secondary'} btn-xs`}
                      onClick={() => setAttendanceViewMode('detailed')}
                    >
                      <List size={12} /> Detailed Logs
                    </button>
                    <button
                      className={`btn ${attendanceViewMode === 'rollup' ? 'btn-primary' : 'btn-secondary'} btn-xs`}
                      onClick={() => setAttendanceViewMode('rollup')}
                    >
                      <BarChart2 size={12} /> Employee Rollup
                    </button>
                  </div>
                )}

                <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
                  <Download size={14} /> Export CSV
                </button>

                <button className="btn btn-primary btn-sm" onClick={() => setIsAttendanceOpen(true)}>
                  <Plus size={14} /> Manual Clock Punch
                </button>
              </div>
            </div>

            {/* Filter Toolbar Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border)',
              }}
            >
              {/* Time Horizon Segmented Control */}
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Time Horizon</label>
                <div style={{ display: 'flex', background: 'var(--bg-surface-elevated)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border)' }}>
                  <button
                    style={{ flex: 1, padding: '6px', fontSize: '0.8rem', fontWeight: 700, borderRadius: '6px', border: 'none', cursor: 'pointer', background: timeHorizon === 'daily' ? 'var(--primary)' : 'transparent', color: timeHorizon === 'daily' ? '#fff' : 'var(--text-muted)' }}
                    onClick={() => setTimeHorizon('daily')}
                  >
                    📅 Daily
                  </button>
                  <button
                    style={{ flex: 1, padding: '6px', fontSize: '0.8rem', fontWeight: 700, borderRadius: '6px', border: 'none', cursor: 'pointer', background: timeHorizon === 'monthly' ? 'var(--primary)' : 'transparent', color: timeHorizon === 'monthly' ? '#fff' : 'var(--text-muted)' }}
                    onClick={() => setTimeHorizon('monthly')}
                  >
                    🗓️ Monthly
                  </button>
                  <button
                    style={{ flex: 1, padding: '6px', fontSize: '0.8rem', fontWeight: 700, borderRadius: '6px', border: 'none', cursor: 'pointer', background: timeHorizon === 'yearly' ? 'var(--primary)' : 'transparent', color: timeHorizon === 'yearly' ? '#fff' : 'var(--text-muted)' }}
                    onClick={() => setTimeHorizon('yearly')}
                  >
                    📆 Yearly
                  </button>
                </div>
              </div>

              {/* Period Picker depending on Time Horizon */}
              {timeHorizon === 'daily' && (
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Select Date & Jump</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={handlePrevDay} title="Previous Day">
                      <ChevronLeft size={14} />
                    </button>
                    <input
                      type="date"
                      className="form-input"
                      style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                    <button className="btn btn-secondary btn-sm" onClick={handleNextDay} title="Next Day">
                      <ChevronRight size={14} />
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={handleToday} title="Jump to Today">
                      Today
                    </button>
                  </div>
                </div>
              )}

              {timeHorizon === 'monthly' && (
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Select Month</label>
                  <input
                    type="month"
                    className="form-input"
                    style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  />
                </div>
              )}

              {timeHorizon === 'yearly' && (
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Select Year</label>
                  <select
                    className="form-input"
                    style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    {['2026', '2025', '2024'].map((yr) => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Employee Filter */}
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Filter Employee</label>
                <select
                  className="form-input"
                  style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                  value={selectedEmpFilter}
                  onChange={(e) => setSelectedEmpFilter(e.target.value)}
                >
                  <option value="ALL">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.empId || emp.id}>{emp.name} ({emp.empId})</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Filter Status</label>
                <select
                  className="form-input"
                  style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Present">Present Only</option>
                  <option value="Absent">Absent Only</option>
                  <option value="Half Day">Half Day Only</option>
                  <option value="Leave">Leave Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dynamic KPI Summary Banner */}
          <div
            className="stats-grid"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              gap: '14px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Total Logs Recorded</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                {attTotalLogs} Entries
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Total Present Days</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34D399', fontFamily: 'var(--font-mono)' }}>
                {attPresentCount} Days
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Total Absent Days</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FB7185', fontFamily: 'var(--font-mono)' }}>
                {attAbsentCount} Days
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Attendance Rate</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: attRate >= 85 ? '#34D399' : '#F59E0B', fontFamily: 'var(--font-mono)' }}>
                {attRate}%
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Total Overtime (OT)</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F59E0B', fontFamily: 'var(--font-mono)' }}>
                +{attTotalOt.toFixed(1)} hrs
              </div>
            </div>
          </div>

          {/* Rollup Summary View (When in Rollup Mode) */}
          {attendanceViewMode === 'rollup' && timeHorizon !== 'daily' ? (
            <div className="card table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Employee Name</th>
                    <th>Role</th>
                    <th>Logged Shifts</th>
                    <th>Present Days</th>
                    <th>Absent Days</th>
                    <th style={{ minWidth: '180px' }}>Attendance Rate</th>
                    <th>Total OT Accum.</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeRollup.map((row) => (
                    <tr key={row.empId}>
                      <td><span className="font-mono" style={{ fontWeight: 700 }}>{row.empId}</span></td>
                      <td><strong style={{ fontSize: '0.9rem' }}>{row.empName}</strong></td>
                      <td><span className="badge badge-secondary">{row.role}</span></td>
                      <td>{row.totalShifts}</td>
                      <td><span style={{ color: '#34D399', fontWeight: 700 }}>{row.presentDays}</span></td>
                      <td><span style={{ color: '#FB7185', fontWeight: 700 }}>{row.absentDays}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '8px', background: 'var(--bg-surface-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${row.rate}%`,
                                height: '100%',
                                background: row.rate >= 85 ? '#10B981' : row.rate >= 70 ? '#F59E0B' : '#F43F5E',
                                borderRadius: '4px',
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', minWidth: '40px' }}>{row.rate}%</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, color: row.otHours > 0 ? '#F59E0B' : 'var(--text-muted)' }}>
                          +{row.otHours.toFixed(1)} hrs
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Detailed Daily Logs Table */
            <div className="card">
              <div className="table-responsive desktop-only-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Employee Name</th>
                      <th style={{ minWidth: '220px' }}>Status Quick Selector (P / A / H / L)</th>
                      <th style={{ minWidth: '160px' }}>Clock-In</th>
                      <th style={{ minWidth: '160px' }}>Clock-Out</th>
                      <th style={{ minWidth: '110px' }}>Overtime (OT)</th>
                      <th style={{ minWidth: '180px' }}>Shift Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedAttendance.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                          No attendance logs found matching the selected filters.
                        </td>
                      </tr>
                    ) : (
                      displayedAttendance.map((att, idx) => {
                        const rowEmp = att.empObj || employees.find((e) => e.empId === att.empId || e.id === att.empId || e.name === att.empName);
                        return (
                          <tr key={att.id || `virtual-${idx}`}>
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
                                    onClick={() => markPresent(att.id, att.date, rowEmp)}
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
                                    onClick={() => markAbsent(att.id, att.date, rowEmp)}
                                    title="A: Mark Absent (Unpaid Day)"
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
                                    onClick={() => {
                                      if (att.id) updateAttendanceRecord(att.id, { status: 'Half Day' });
                                      else logDailyAttendance({ empId: att.empId, empName: att.empName, date: att.date, status: 'Half Day' });
                                    }}
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
                                    onClick={() => {
                                      if (att.id) updateAttendanceRecord(att.id, { status: 'Leave' });
                                      else logDailyAttendance({ empId: att.empId, empName: att.empName, date: att.date, status: 'Leave' });
                                    }}
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
                                        : att.status === 'Leave'
                                        ? '#A78BFA'
                                        : 'var(--text-dim)',
                                  }}
                                >
                                  {att.status}
                                </span>
                              </div>
                            </td>

                            {/* Clock-In Time (Directly Editable Input + Now Button) */}
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input
                                  type="text"
                                  className="form-input font-mono"
                                  style={{ width: '105px', padding: '4px 6px', fontSize: '0.8rem' }}
                                  placeholder="09:00 AM"
                                  value={att.status === 'Absent' ? '— Absent —' : (att.inTime || '')}
                                  disabled={att.status === 'Absent'}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (att.id) updateAttendanceRecord(att.id, { inTime: val, status: att.status === 'Absent' ? 'Present' : att.status });
                                    else logDailyAttendance({ empId: att.empId, empName: att.empName, date: att.date, inTime: val, status: 'Present' });
                                  }}
                                  title="Edit Clock-In time directly"
                                />
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-xs"
                                  style={{ padding: '3px 6px', fontSize: '0.7rem' }}
                                  onClick={() => {
                                    const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                                    if (att.id) updateAttendanceRecord(att.id, { inTime: nowStr, status: att.status === 'Absent' ? 'Present' : att.status });
                                    else markPresent(null, att.date, rowEmp);
                                  }}
                                  title="Set to current time"
                                >
                                  Now
                                </button>
                              </div>
                            </td>

                            {/* Clock-Out Time (Directly Editable Input + Now Button) */}
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input
                                  type="text"
                                  className="form-input font-mono"
                                  style={{ width: '105px', padding: '4px 6px', fontSize: '0.8rem' }}
                                  placeholder="06:00 PM"
                                  value={att.status === 'Absent' ? '— Absent —' : (att.outTime || '')}
                                  disabled={att.status === 'Absent'}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (att.id) updateAttendanceRecord(att.id, { outTime: val });
                                    else logDailyAttendance({ empId: att.empId, empName: att.empName, date: att.date, outTime: val, status: 'Present' });
                                  }}
                                  title="Edit Clock-Out time directly"
                                />
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-xs"
                                  style={{ padding: '3px 6px', fontSize: '0.7rem' }}
                                  onClick={() => {
                                    const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                                    if (att.id) updateAttendanceRecord(att.id, { outTime: nowStr });
                                    else logDailyAttendance({ empId: att.empId, empName: att.empName, date: att.date, outTime: nowStr, status: 'Present' });
                                  }}
                                  title="Set to current time"
                                >
                                  Now
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
                                  onChange={(e) => {
                                    const val = Number(e.target.value) || 0;
                                    if (att.id) updateAttendanceRecord(att.id, { otHours: val });
                                    else logDailyAttendance({ empId: att.empId, empName: att.empName, date: att.date, otHours: val });
                                  }}
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
                                placeholder="Shift notes / reasons..."
                                value={att.notes || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (att.id) updateAttendanceRecord(att.id, { notes: val });
                                  else logDailyAttendance({ empId: att.empId, empName: att.empName, date: att.date, notes: val });
                                }}
                                title="Edit Shift Notes directly"
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Responsive Cards Format */}
              <div className="mobile-only-cards" style={{ marginTop: '12px' }}>
                {displayedAttendance.map((att, idx) => {
                  const rowEmp = att.empObj || employees.find((e) => e.empId === att.empId || e.id === att.empId || e.name === att.empName);
                  return (
                    <div key={att.id || `mobile-${idx}`} className="mobile-data-card">
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

                      <div>
                        <h3 className="mobile-card-title">{att.empName}</h3>
                        <div className="mobile-card-subtitle">Employee ID: {att.empId}</div>
                      </div>

                      {/* Quick P / A / H / L Buttons for Mobile */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface-elevated)', padding: '6px 10px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Quick Status:</span>
                        <div style={{ display: 'inline-flex', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => markPresent(att.id, att.date, rowEmp)}
                            style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', background: att.status === 'Present' ? '#10B981' : 'transparent', color: att.status === 'Present' ? '#FFF' : 'var(--text-muted)' }}
                          >
                            P
                          </button>
                          <button
                            type="button"
                            onClick={() => markAbsent(att.id, att.date, rowEmp)}
                            style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', background: att.status === 'Absent' ? '#F43F5E' : 'transparent', color: att.status === 'Absent' ? '#FFF' : 'var(--text-muted)' }}
                          >
                            A
                          </button>
                        </div>
                      </div>

                      <div className="mobile-card-details">
                        <div className="mobile-card-details-row">
                          <span>Clock-In:</span>
                          <span className="font-mono" style={{ fontWeight: 600 }}>{att.status === 'Absent' ? '— Absent —' : (att.inTime || 'Not checked in')}</span>
                        </div>
                        <div className="mobile-card-details-row">
                          <span>Clock-Out:</span>
                          <span className="font-mono" style={{ fontWeight: 600 }}>{att.status === 'Absent' ? '— Absent —' : (att.outTime || 'Not checked out')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {subTab === 'jobs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ── Assigned Booking Work ── */}
          <div className="card table-responsive">
            <div className="card-header">
              <div>
                <h3 className="card-title"><Scissors size={18} color="#6366F1" /> Assigned Booking Work</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Complete production tasks here. Incentive is released once the order is delivered and payment is settled.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '20px',
                    background: 'rgba(99,102,241,0.12)',
                    color: '#6366F1',
                  }}
                >
                  {assignedJobs.length} Jobs
                </span>
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
                      <td>
                        <span className={`badge ${job.workStatus === 'COMPLETED' ? 'badge-success' : 'badge-primary'}`}>
                          {job.workStatus}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#F59E0B' }}>
                          {formatCurrency(job.incentiveRate, currency)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            job.payoutStatus === 'READY_FOR_PAYROLL'
                              ? 'badge-success'
                              : job.payoutStatus === 'PAID'
                              ? 'badge-warning'
                              : 'badge-primary'
                          }`}
                        >
                          {job.payoutStatus === 'PENDING_DELIVERY'
                            ? '⏳ Pending Delivery'
                            : job.payoutStatus === 'READY_FOR_PAYROLL'
                            ? '✅ Ready for Payroll'
                            : job.payoutStatus === 'PAID'
                            ? '💰 Paid'
                            : job.payoutStatus}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          disabled={job.workStatus === 'COMPLETED'}
                          onClick={() => completeAssignedJob(job.id)}
                        >
                          <CheckCircle2 size={13} /> {job.workStatus === 'COMPLETED' ? 'Completed ✓' : 'Mark Complete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Ready for Delivery — Employee Dues ── */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Wallet size={18} color="#10B981" />
                  Ready for Delivery — Employee Dues
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Incentive payments unlocked after garments reach "Ready to Deliver" stage. Settle to clear the dues.
                </p>
              </div>
              {workPayments && workPayments.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '2px',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Pending</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 900,
                      fontSize: '1.1rem',
                      color: '#F59E0B',
                    }}
                  >
                    {formatCurrency(
                      workPayments.reduce((sum, j) => sum + (j.agreedAmount || 0), 0),
                      currency
                    )}
                  </span>
                </div>
              )}
            </div>

            {!workPayments || workPayments.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '36px 20px',
                  color: 'var(--text-muted)',
                }}
              >
                <Wallet size={40} style={{ opacity: 0.25 }} />
                <p style={{ fontWeight: 600 }}>No unsettled incentive dues right now.</p>
                <p style={{ fontSize: '0.82rem', textAlign: 'center' }}>
                  Dues appear here when a garment batch reaches the <strong>"Ready to Deliver"</strong> stage in the Production Tracker.
                </p>
              </div>
            ) : (
              (() => {
                // Group workPayments by employee for a cleaner "Settle All" UX
                const grouped = workPayments.reduce((acc, job) => {
                  const key = job.employeeId || job.employeeName;
                  if (!acc[key]) acc[key] = { employeeId: job.employeeId, employeeName: job.employeeName, jobs: [] };
                  acc[key].jobs.push(job);
                  return acc;
                }, {});
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 0 4px 0' }}>
                    {Object.values(grouped).map((group) => {
                      const groupTotal = group.jobs.reduce((sum, j) => sum + (j.agreedAmount || 0), 0);
                      return (
                        <div
                          key={group.employeeName}
                          style={{
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                          }}
                        >
                          {/* Employee group header */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '10px 16px',
                              background: 'var(--bg-surface)',
                              borderBottom: '1px solid var(--border)',
                              flexWrap: 'wrap',
                              gap: '8px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div
                                style={{
                                  width: '34px',
                                  height: '34px',
                                  borderRadius: '50%',
                                  background: 'rgba(16,185,129,0.15)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '1rem',
                                }}
                              >
                                {employees.find(
                                  (e) => e.id === group.employeeId || e.name === group.employeeName
                                )?.avatar || '👤'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{group.employeeName}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {group.jobs.length} job{group.jobs.length > 1 ? 's' : ''} pending
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Due</div>
                                <div
                                  style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontWeight: 900,
                                    fontSize: '1rem',
                                    color: '#10B981',
                                  }}
                                >
                                  {formatCurrency(groupTotal, currency)}
                                </div>
                              </div>
                              <button
                                className="btn btn-success btn-sm"
                                style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
                                onClick={async () => {
                                  if (group.employeeId) {
                                    await settleEmployeeProductionBalance(group.employeeId);
                                  } else {
                                    // Settle job by job if no employeeId
                                    for (const j of group.jobs) {
                                      await settleWorkPayment(j.id);
                                    }
                                  }
                                }}
                              >
                                <Wallet size={13} /> Settle All ({formatCurrency(groupTotal, currency)})
                              </button>
                            </div>
                          </div>

                          {/* Individual job rows */}
                          <div className="table-responsive">
                            <table className="data-table" style={{ marginBottom: 0 }}>
                              <thead>
                                <tr>
                                  <th>Project / Garment</th>
                                  <th>Qty</th>
                                  <th>Amount Due</th>
                                  <th>Ready Since</th>
                                  <th>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.jobs.map((job) => (
                                  <tr key={job.id}>
                                    <td>
                                      <span style={{ fontWeight: 600 }}>{job.projectName}</span>
                                    </td>
                                    <td>{job.quantity}</td>
                                    <td>
                                      <span style={{ color: '#F59E0B', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                                        {formatCurrency(job.agreedAmount, currency)}
                                      </span>
                                    </td>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                      {job.readyAt || '—'}
                                    </td>
                                    <td>
                                      <button
                                        className="btn btn-secondary btn-sm"
                                        style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                                        onClick={() => settleWorkPayment(job.id)}
                                      >
                                        <CheckCircle2 size={12} /> Settle
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>
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
