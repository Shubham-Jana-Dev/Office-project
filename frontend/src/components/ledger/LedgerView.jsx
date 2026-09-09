import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BookOpen,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Search,
  Wallet,
  Building2,
  Users,
  FileText,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { VoucherModal } from './VoucherModal';
import { ReceiptModal } from '../pos/ReceiptModal';
import { StatCard } from '../common/StatCard';

export const LedgerView = () => {
  const { ledgerEntries, currency } = useApp();
  const [filterType, setFilterType] = useState('All'); // 'All', 'Customer', 'Supplier', 'Expense'
  const [searchQuery, setSearchQuery] = useState('');
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState(null);

  // Filtered Ledger Entries
  const filteredEntries = ledgerEntries.filter((entry) => {
    const matchesFilter = filterType === 'All' || entry.partyType === filterType;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      entry.partyName.toLowerCase().includes(q) ||
      entry.description.toLowerCase().includes(q) ||
      entry.refNo?.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const totalDebits = ledgerEntries
    .filter((e) => e.type === 'Debit')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const totalCredits = ledgerEntries
    .filter((e) => e.type === 'Credit')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const netBalance = totalCredits - totalDebits;

  return (
    <div className="view-container">
      {/* Top Header */}
      <div className="responsive-header-row">
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>General Account Ledger</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Double-entry bookkeeping journal, customer receivables, supplier payables & operational expense vouchers
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsVoucherOpen(true)}>
          <Plus size={16} /> Post Ledger Voucher Entry
        </button>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid">
        <StatCard
          label="Total Debits (Dr)"
          value={formatCurrency(totalDebits, currency)}
          icon={ArrowDownLeft}
          color="#F43F5E"
          trend="Expenses & Outflows"
          trendPositive={false}
        />
        <StatCard
          label="Total Credits (Cr)"
          value={formatCurrency(totalCredits, currency)}
          icon={ArrowUpRight}
          color="#10B981"
          trend="Revenue & Inflows"
          trendPositive={true}
        />
        <StatCard
          label="Net Account Journal Balance"
          value={formatCurrency(netBalance, currency)}
          icon={Wallet}
          color="#6366F1"
          trend="Reconciled Ledger"
          trendPositive={netBalance >= 0}
        />
        <StatCard
          label="Total Posted Vouchers"
          value={`${ledgerEntries.length} Records`}
          icon={BookOpen}
          color="#38BDF8"
        />
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['All', 'Customer', 'Supplier', 'Expense'].map((type) => (
            <button
              key={type}
              className={`btn ${filterType === type ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setFilterType(type)}
            >
              {type === 'All' ? 'All Accounts' : `${type}s`}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '100%', maxWidth: '320px', minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '34px', fontSize: '0.85rem' }}
            placeholder="Search party or reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Desktop Ledger Table */}
      <div className="card table-responsive desktop-only-table">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Voucher Ref</th>
              <th>Party / Account Head</th>
              <th>Account Classification</th>
              <th>Narration / Details</th>
              <th>Debit (Dr)</th>
              <th>Credit (Cr)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                  No ledger entries found matching current filter.
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDate(entry.date)}</td>
                  <td>
                    <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{entry.refNo || entry.id}</strong>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{entry.partyName}</div>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        entry.partyType === 'Customer'
                          ? 'badge-primary'
                          : entry.partyType === 'Supplier'
                          ? 'badge-warning'
                          : 'badge-danger'
                      }`}
                    >
                      {entry.partyType}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{entry.description}</div>
                  </td>
                  <td>
                    {entry.type === 'Debit' ? (
                      <span style={{ color: '#FB7185', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {formatCurrency(entry.amount, currency)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    {entry.type === 'Credit' ? (
                      <span style={{ color: '#34D399', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {formatCurrency(entry.amount, currency)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setSelectedOrderForReceipt({
                          invoiceNo: entry.refNo || entry.id,
                          date: formatDate(entry.date),
                          customerName: entry.partyName,
                          customerPhone: 'N/A',
                          items: [{ name: entry.description, quantity: 1, price: entry.amount }],
                          total: entry.amount,
                          advance: entry.type === 'Credit' ? entry.amount : 0,
                          paymentMethod: 'N/A'
                        });
                      }}
                      title="Show Bill"
                    >
                      <FileText size={13} /> Show Bill
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Responsive Cards Format (Matching Reference Image) */}
      <div className="mobile-only-cards">
        {filteredEntries.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
            No ledger entries found matching current filter.
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div key={entry.id} className="mobile-data-card">
              {/* Top Row: Icon + Voucher Badge (Left) and Types (Right) */}
              <div className="mobile-card-top">
                <div className="mobile-card-badge-group">
                  <div className="mobile-card-icon-box">
                    <BookOpen size={18} color="var(--primary)" />
                  </div>
                  <span className="badge badge-primary font-mono">{entry.refNo || entry.id}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    className={`badge ${
                      entry.type === 'Credit' ? 'badge-success' : 'badge-danger'
                    }`}
                  >
                    {entry.type === 'Credit' ? 'Credit (Cr)' : 'Debit (Dr)'}
                  </span>
                  <span
                    className={`badge ${
                      entry.partyType === 'Customer'
                        ? 'badge-primary'
                        : entry.partyType === 'Supplier'
                        ? 'badge-warning'
                        : 'badge-danger'
                    }`}
                  >
                    {entry.partyType}
                  </span>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div>
                <h3 className="mobile-card-title">{entry.partyName}</h3>
                <div className="mobile-card-subtitle">
                  Date: {formatDate(entry.date)}
                </div>
              </div>

              {/* Details */}
              <div className="mobile-card-details">
                <div>
                  Narration: <strong style={{ color: 'var(--text-main)' }}>{entry.description}</strong>
                </div>
                <div>
                  Classification: {entry.partyType} Account Head
                </div>
              </div>

              {/* Dashed Separator */}
              <div className="mobile-card-divider" />

              {/* Footer Row */}
              <div className="mobile-card-footer">
                <span className="mobile-card-footer-label">
                  {entry.type === 'Credit' ? 'Inflow (Credit):' : 'Outflow (Debit):'}
                </span>
                <strong
                  className="mobile-card-footer-value"
                  style={{ color: entry.type === 'Credit' ? '#34D399' : '#FB7185' }}
                >
                  {entry.type === 'Credit' ? '+' : '-'}{formatCurrency(entry.amount, currency)}
                </strong>
              </div>
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setSelectedOrderForReceipt({
                      invoiceNo: entry.refNo || entry.id,
                      date: formatDate(entry.date),
                      customerName: entry.partyName,
                      customerPhone: 'N/A',
                      items: [{ name: entry.description, quantity: 1, price: entry.amount }],
                      total: entry.amount,
                      advance: entry.type === 'Credit' ? entry.amount : 0,
                      paymentMethod: 'N/A'
                    });
                  }}
                >
                  <FileText size={13} /> Show Bill
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Voucher Modal */}
      <VoucherModal isOpen={isVoucherOpen} onClose={() => setIsVoucherOpen(false)} />

      <ReceiptModal
        isOpen={Boolean(selectedOrderForReceipt)}
        onClose={() => setSelectedOrderForReceipt(null)}
        order={selectedOrderForReceipt}
        currency={currency}
      />
    </div>
  );
};
