import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { SearchableSelect } from '../common/SearchableSelect';
import { BookOpen, DollarSign } from 'lucide-react';

export const VoucherModal = ({ isOpen, onClose }) => {
  const { addLedgerVoucher, customers, vendors } = useApp();

  const [partyType, setPartyType] = useState('Expense'); // 'Customer', 'Supplier', 'Expense'
  const [partyName, setPartyName] = useState('');
  const [type, setType] = useState('Debit'); // 'Debit' or 'Credit'
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [refNo, setRefNo] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addLedgerVoucher({
      partyType,
      partyName: partyName.trim() || 'General Store Expense',
      type,
      amount: Number(amount) || 0,
      description: description.trim() || 'Manual Account Voucher',
      refNo: refNo.trim() || `VCH-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Account Ledger Voucher (Double-Entry Bookkeeping)"
      maxWidth="550px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label className="form-label">Account / Party Type</label>
            <select
              className="form-select"
              value={partyType}
              onChange={(e) => {
                setPartyType(e.target.value);
                setPartyName('');
              }}
            >
              <option value="Expense">Operational Expense (Rent, Power, Repair)</option>
              <option value="Customer">Customer Account (Receivable/Receipt)</option>
              <option value="Supplier">Supplier / Mill Account (Payable/Payout)</option>
            </select>
          </div>

          <div>
            <label className="form-label">Transaction Type</label>
            <select
              className="form-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="Debit">Debit (Dr) - Expense / Outflow / Receivable</option>
              <option value="Credit">Credit (Cr) - Inflow / Payment Received / Liability</option>
            </select>
          </div>
        </div>

        <div>
          <label className="form-label">Party Name / Expense Head</label>
          {partyType === 'Customer' ? (
            <SearchableSelect
              value={partyName}
              onChange={setPartyName}
              options={customers.map((customer) => ({
                value: customer.name,
                label: `${customer.name} (${customer.phone})`,
              }))}
              placeholder="Search customer name or phone..."
              addNewLabel="Add new customer"
              onAddNew={() => {}}
              required
            />
          ) : partyType === 'Supplier' ? (
            <SearchableSelect
              value={partyName}
              onChange={setPartyName}
              options={vendors.map((vendor) => ({ value: vendor.name, label: vendor.name }))}
              placeholder="Search supplier or mill..."
              addNewLabel="Add new supplier"
              onAddNew={() => {}}
              required
            />
          ) : (
            <input
              type="text"
              className="form-input"
              required
              placeholder="e.g. Showroom Electricity, Tailoring Machine Servicing, Rent"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
            />
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label className="form-label">Voucher Amount</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="form-input"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Reference / Cheque / Txn No.</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. TXN-8921 or CHQ-0012"
              value={refNo}
              onChange={(e) => setRefNo(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="form-label">Description & Narrative</label>
          <textarea
            className="form-textarea"
            required
            placeholder="Detailed bookkeeping narrative for financial audit..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-lg" style={{ marginTop: '6px' }}>
          <BookOpen size={18} /> Post Voucher to Ledger
        </button>
      </form>
    </Modal>
  );
};
