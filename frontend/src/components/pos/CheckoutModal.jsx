import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { CustomerModal } from '../common/CustomerModal';
import { CustomerProfileModal } from '../customer/CustomerProfileModal';
import { SearchableSelect } from '../common/SearchableSelect';
import { NewEmployeeModal } from '../employee/NewEmployeeModal';
import {
  Banknote,
  CreditCard,
  QrCode,
  Users,
  Percent,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Scissors,
} from 'lucide-react';
import { formatCurrency, calculateTax } from '../../utils/formatters';
import confetti from 'canvas-confetti';

export const CheckoutModal = ({
  isOpen,
  onClose,
  cart,
  subtotal,
  discountTotal,
  tax,
  grandTotal,
  saleType = 'finished_product',
  onSuccessOrder,
}) => {
  const { customers, completeSale, currency, employees } = useApp();

  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash, card, upi, split
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [customCustomerPhone, setCustomCustomerPhone] = useState('');
  const [cashTendered, setCashTendered] = useState(grandTotal);
  const [selectedCashier, setSelectedCashier] = useState('David Miller (Sales Executive)');
  const [isNewCustModalOpen, setIsNewCustModalOpen] = useState(false);
  const [is360ProfileOpen, setIs360ProfileOpen] = useState(false);
  const [isNewEmployeeModalOpen, setIsNewEmployeeModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newEmployeeName, setNewEmployeeName] = useState('');

  const selectedCustObj = customers.find((c) => c.id === selectedCustomerId);

  const changeDue = Math.max(0, Number(cashTendered) - grandTotal);

  // Compute Cost Price of Cart Items to track Gross Profit
  const totalCostPrice = cart.reduce(
    (acc, item) => acc + (Number(item.costPrice) || item.price * 0.45) * item.quantity,
    0
  );
  const orderProfit = Math.max(0, grandTotal - tax - totalCostPrice);

  const handleFinalSubmit = async (e) => {
    e.preventDefault();

    let customerName = 'Walk-in Retail Customer';
    let customerPhone = 'N/A';

    if (selectedCustomerId) {
      const cust = customers.find((c) => c.id === selectedCustomerId);
      if (cust) {
        customerName = cust.name;
        customerPhone = cust.phone;
      }
    } else if (customCustomerName.trim()) {
      customerName = customCustomerName.trim();
      customerPhone = customCustomerPhone.trim() || 'N/A';
    }

    const salePayload = {
      items: cart,
      subtotal,
      discountTotal,
      tax,
      total: grandTotal,
      paymentMethod,
      customerId: selectedCustomerId || null,
      customerName,
      customerPhone,
      cashier: selectedCashier,
      profit: orderProfit,
      saleType,
    };

    const newOrder = await completeSale(salePayload);

    // Confetti effect
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.log('Confetti error:', err);
    }

    onClose();
    if (onSuccessOrder) {
      onSuccessOrder(newOrder);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="POS Checkout & Payment Tender"
      maxWidth="620px"
    >
      <form onSubmit={handleFinalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Total Summary Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)',
            border: '1px solid var(--primary-border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Amount Payable ({cart.length} items)
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
              {formatCurrency(grandTotal, currency)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="badge badge-success">Profit Margin: {formatCurrency(orderProfit, currency)}</span>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Tax Included (12% GST)
            </div>
          </div>
        </div>

        {/* Customer Selection */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
              <Users size={14} /> Customer Information
            </label>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '3px 8px' }}
              onClick={() => setIsNewCustModalOpen(true)}
            >
              <UserPlus size={13} /> + Register New Client
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: selectedCustomerId ? '1fr auto' : '1fr 1fr', gap: '10px' }}>
            <div>
              <SearchableSelect
                value={selectedCustomerId}
                onChange={(customerId) => {
                  setSelectedCustomerId(customerId);
                  setCustomCustomerName('');
                  setCustomCustomerPhone('');
                }}
                options={customers.map((customer) => ({
                  value: customer.id,
                  label: `${customer.name} (${customer.type} - ${customer.phone})`,
                }))}
                placeholder="Search saved customer or VIP..."
                addNewLabel="Add new customer"
                onAddNew={(name) => {
                  setNewCustomerName(name);
                  setIsNewCustModalOpen(true);
                }}
              />
            </div>

            {selectedCustomerId && selectedCustObj && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIs360ProfileOpen(true)}
                style={{ color: 'var(--primary)', borderColor: 'var(--primary-border)', whiteSpace: 'nowrap' }}
                title="View Customer Body Sizes & Previous Bills"
              >
                <Scissors size={14} /> Sizing & History
              </button>
            )}

            {!selectedCustomerId && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Or New Customer Name"
                  value={customCustomerName}
                  onChange={(e) => setCustomCustomerName(e.target.value)}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Phone"
                  value={customCustomerPhone}
                  onChange={(e) => setCustomCustomerPhone(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Cashier Selection */}
        <div>
          <label className="form-label">Sales Cashier / Staff</label>
          <SearchableSelect
            value={selectedCashier}
            onChange={setSelectedCashier}
            options={employees.map((employee) => ({
              value: `${employee.name} (${employee.role})`,
              label: `${employee.name} - ${employee.role}`,
            }))}
            placeholder="Search cashier or staff name..."
            addNewLabel="Add new employee"
            onAddNew={(name) => {
              setNewEmployeeName(name);
              setIsNewEmployeeModalOpen(true);
            }}
          />
        </div>

        {/* Payment Methods Tabs */}
        <div>
          <label className="form-label">Payment Tender Method</label>
          <div className="payment-methods-grid">
            <button
              type="button"
              className={`btn ${paymentMethod === 'cash' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPaymentMethod('cash')}
            >
              <Banknote size={16} /> Cash
            </button>
            <button
              type="button"
              className={`btn ${paymentMethod === 'card' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPaymentMethod('card')}
            >
              <CreditCard size={16} /> Card
            </button>
            <button
              type="button"
              className={`btn ${paymentMethod === 'upi' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPaymentMethod('upi')}
            >
              <QrCode size={16} /> UPI / QR
            </button>
            <button
              type="button"
              className={`btn ${paymentMethod === 'split' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPaymentMethod('split')}
            >
              Split / Credit
            </button>
          </div>
        </div>

        {/* Payment Specific Details */}
        {paymentMethod === 'cash' && (
          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label">Cash Received</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  style={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="form-label">Change Return Due</label>
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'var(--bg-main)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    color: changeDue >= 0 ? '#10B981' : '#F43F5E',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {formatCurrency(changeDue, currency)}
                </div>
              </div>
            </div>
          </div>
        )}

        {paymentMethod === 'upi' && (
          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '90px',
                height: '90px',
                background: '#FFFFFF',
                borderRadius: '8px',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              <QrCode size={75} color="#000000" />
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', color: '#FFFFFF', marginBottom: '4px' }}>
                Scan to Pay via UPI / Digital Wallet
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                VPA: <code style={{ color: '#818CF8' }}>threadcraft@icici</code>
              </p>
              <div className="badge badge-cyan" style={{ marginTop: '6px' }}>
                Amount: {formatCurrency(grandTotal, currency)}
              </div>
            </div>
          </div>
        )}

        {paymentMethod === 'card' && (
          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}
          >
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Swipe or tap card on POS terminal. Merchant transaction reference will be attached to invoice.
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-success btn-lg"
          style={{ width: '100%', marginTop: '6px' }}
        >
          <CheckCircle size={20} />
          Complete Sale & Generate Receipt ({formatCurrency(grandTotal, currency)})
        </button>
      </form>

      {/* Embedded Customer Registration Modal */}
      <CustomerModal
        isOpen={isNewCustModalOpen}
        onClose={() => setIsNewCustModalOpen(false)}
        initialName={newCustomerName}
        onCustomerCreated={(newCust) => {
          setSelectedCustomerId(newCust.id);
        }}
      />

      <NewEmployeeModal
        isOpen={isNewEmployeeModalOpen}
        onClose={() => setIsNewEmployeeModalOpen(false)}
        initialName={newEmployeeName}
        onEmployeeCreated={(employee) => setSelectedCashier(`${employee.name} (${employee.role})`)}
      />

      {/* Customer 360 Profile & Sizing Hub Modal */}
      <CustomerProfileModal
        isOpen={is360ProfileOpen}
        onClose={() => setIs360ProfileOpen(false)}
        customer={selectedCustObj}
      />
    </Modal>
  );
};

