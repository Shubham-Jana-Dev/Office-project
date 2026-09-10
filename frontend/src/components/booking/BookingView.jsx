import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CalendarCheck,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Download,
  Scissors,
  Users,
  UserPlus,
  Trash2,
  Crown,
  Phone,
  Mail,
  MapPin,
  Search,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { NewBookingModal } from './NewBookingModal';
import { CustomerModal } from '../common/CustomerModal';
import { CustomerProfileModal } from '../customer/CustomerProfileModal';
import { ReceiptModal } from '../pos/ReceiptModal';
import { StatCard } from '../common/StatCard';
import { exportTailorJobCardPDF } from '../../utils/pdfGenerator';

export const BookingView = () => {
  const { orderBookings, updateBookingStatus, measurements, customers, deleteCustomer, currency } = useApp();
  const [mainTab, setMainTab] = useState('bookings'); // 'bookings' or 'clients'
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [selectedCustomerFor360, setSelectedCustomerFor360] = useState(null);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [bookingSearch, setBookingSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  const totalAdvanceCollected = orderBookings.reduce((sum, b) => sum + (b.advancePaid || 0), 0);
  const totalBalanceDue = orderBookings.reduce((sum, b) => sum + (b.balanceDue || 0), 0);
  const activeBookings = orderBookings.filter((b) => b.status !== 'Delivered').length;

  const filteredBookings = orderBookings.filter((b) => {
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    if (!matchesStatus) return false;
    if (!bookingSearch.trim()) return true;
    const q = bookingSearch.toLowerCase();
    return (
      (b.bookingNo && b.bookingNo.toLowerCase().includes(q)) ||
      (b.id && b.id.toLowerCase().includes(q)) ||
      (b.customerName && b.customerName.toLowerCase().includes(q)) ||
      (b.customerPhone && b.customerPhone.includes(q)) ||
      (b.garmentType && b.garmentType.toLowerCase().includes(q)) ||
      (b.fabricDetails && b.fabricDetails.toLowerCase().includes(q)) ||
      (b.assignedMaster && b.assignedMaster.toLowerCase().includes(q))
    );
  });

  const handleJobCardDownload = (booking) => {
    const custMeasurement = measurements.find((m) => m.customerId === booking.customerId);
    exportTailorJobCardPDF(booking, custMeasurement?.measurements || {});
  };

  const handleDeliverAndSettle = (booking) => {
    if (booking.balanceDue > 0) {
      if (
        window.confirm(
          `Collect balance payment of ${formatCurrency(booking.balanceDue, currency)} and mark as DELIVERED?`
        )
      ) {
        updateBookingStatus(booking.id, 'Delivered', booking.balanceDue);
      }
    } else {
      updateBookingStatus(booking.id, 'Delivered', 0);
    }
  };

  return (
    <div className="view-container">
      <div className="booking-list-wrapper">
        {/* Header */}
        <div className="responsive-header-row">
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Booking History</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Historical custom order bookings, deposit collection, trial fitting scheduling & client registry
            </p>
          </div>
            <div className="responsive-header-actions" style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => setIsNewCustomerOpen(true)}>
                <UserPlus size={16} /> + Register New Client
              </button>
              <button className="btn btn-primary" onClick={() => setIsNewBookingOpen(true)}>
                <Plus size={16} /> Book Custom Tailoring Order
              </button>
            </div>
          </div>


      {/* KPI Stats */}
      <div className="stats-grid">
        <StatCard
          label="Total Advance Collected"
          value={formatCurrency(totalAdvanceCollected, currency)}
          icon={DollarSign}
          color="#10B981"
          trend="Secured in advance"
          trendPositive={true}
        />
        <StatCard
          label="Pending Balance Due"
          value={formatCurrency(totalBalanceDue, currency)}
          icon={AlertCircle}
          color="#F43F5E"
          trend="Receivable upon delivery"
          trendPositive={false}
        />
        <StatCard
          label="Active In-Progress Bookings"
          value={`${activeBookings} Orders`}
          icon={Scissors}
          color="#6366F1"
        />
        <StatCard
          label="Registered Bespoke Clients"
          value={`${customers.length} Clients`}
          icon={Users}
          color="#38BDF8"
        />
      </div>

      {/* Main Tab Switcher */}
      <div className="booking-tab-switcher" style={{ marginBottom: '14px' }}>
        <button
          className={`btn ${mainTab === 'bookings' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setMainTab('bookings')}
        >
          <CalendarCheck size={14} /> Custom Orders & Bookings ({orderBookings.length})
        </button>
        <button
          className={`btn ${mainTab === 'clients' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setMainTab('clients')}
        >
          <Users size={14} /> Clients & VIP Directory ({customers.length})
        </button>
      </div>

      {/* Filters and Categories Bar */}
      {mainTab === 'bookings' ? (
        <div className="pos-filters-bar booking-filters-bar">
          <div className="pos-search-input booking-search-input">
            <Search size={18} className="pos-search-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search booking ref, client, garment, phone..."
              value={bookingSearch}
              onChange={(e) => setBookingSearch(e.target.value)}
            />
          </div>

          <div className="pos-category-pills booking-category-pills">
            {['All', 'In Production', 'Awaiting Supplier Inward', 'Ready for Trial', 'Delivered'].map((status) => {
              const count =
                status === 'All'
                  ? orderBookings.length
                  : orderBookings.filter((b) => b.status === status).length;
              const isSelected = statusFilter === status;
              return (
                <button
                  key={status}
                  className={`category-pill booking-cat-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => setStatusFilter(status)}
                >
                  <span>{status === 'All' ? 'All Bookings' : status}</span>
                  <span
                    className="stage-pill-count"
                    style={isSelected ? { background: 'rgba(255,255,255,0.25)', color: '#FFF' } : {}}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="pos-filters-bar booking-filters-bar" style={{ marginBottom: '16px' }}>
          <div className="pos-search-input booking-search-input" style={{ width: '100%', flex: '1 1 100%' }}>
            <Search size={18} className="pos-search-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search clients by name, phone number, client ID..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {mainTab === 'bookings' ? (
        <>
          {/* Desktop Bookings Table */}
          <div className="card table-responsive desktop-only-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Booking Ref</th>
                  <th>Customer Name</th>
                  <th>Garment & Fabric Details</th>
                  <th>Trial Date</th>
                  <th>Delivery Date</th>
                  <th>Agreed Total</th>
                  <th>Advance Paid</th>
                  <th>Balance Due</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                      No custom bookings found for this filter.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{b.bookingNo || b.id}</strong>
                      </td>
                      <td>
                        <div
                          style={{ fontWeight: 600, cursor: 'pointer', color: 'var(--primary)' }}
                          onClick={() => {
                            const matched = customers.find((c) => c.id === b.customerId || c.name === b.customerName);
                            setSelectedCustomerFor360(matched || { id: b.customerId, name: b.customerName, phone: b.customerPhone, type: 'VIP Bespoke' });
                          }}
                          title="Click to view full 360° Customer Profile & Body Sizes"
                        >
                          {b.customerName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.customerPhone}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{b.garmentType}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.fabricDetails}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                          <Clock size={12} color="#F59E0B" /> {formatDate(b.trialDate)}
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--text-main)' }}>{formatDate(b.deliveryDate)}</strong>
                      </td>
                      <td>
                        <span className="font-mono">{formatCurrency(b.totalAmount, currency)}</span>
                      </td>
                      <td>
                        <span style={{ color: '#10B981', fontWeight: 700 }} className="font-mono">
                          {formatCurrency(b.advancePaid, currency)}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            color: b.balanceDue > 0 ? '#F43F5E' : '#10B981',
                            fontWeight: 700,
                          }}
                          className="font-mono"
                        >
                          {formatCurrency(b.balanceDue, currency)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            b.status === 'Delivered'
                              ? 'badge-success'
                              : b.status === 'Ready for Trial'
                              ? 'badge-cyan'
                              : b.status === 'In Production'
                              ? 'badge-warning'
                              : 'badge-primary'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleJobCardDownload(b)}
                            title="Download Cutting Sheet & Tailor Specs PDF"
                          >
                            <Download size={13} /> Job Card
                          </button>
                          
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setSelectedOrderForReceipt({
                                invoiceNo: b.bookingNo || b.id,
                                date: formatDate(b.bookingDate || b.date),
                                customerName: b.customerName,
                                customerPhone: b.customerPhone,
                                customerAddress: b.customerAddress,
                                items: [{ name: b.garmentType + (b.fabricDetails ? ' - ' + b.fabricDetails : ''), quantity: 1, price: b.totalAmount }],
                                total: b.totalAmount,
                                advancePaid: b.advancePaid,
                                balanceDue: b.balanceDue,
                                workTypes: b.workTypes || [],
                                paymentMethod: b.status === 'Delivered' ? 'Full Settlement' : 'Advance Deposit'
                              });
                            }}
                            title="Show Bill"
                          >
                            <FileText size={13} /> Show Bill
                          </button>


                          {b.status !== 'Delivered' && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleDeliverAndSettle(b)}
                              title="Settle balance due and mark as delivered"
                            >
                              <CheckCircle2 size={13} /> Settle & Deliver
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Responsive Cards Format (Matching Reference Image) */}
          <div className="mobile-only-cards">
            {filteredBookings.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                No custom bookings found for this filter.
              </div>
            ) : (
              filteredBookings.map((b) => (
                <div key={b.id} className="mobile-data-card">
                  {/* Top Row: Icon + ID Badge (Left) and Status (Right) */}
                  <div className="mobile-card-top">
                    <div className="mobile-card-badge-group">
                      <div className="mobile-card-icon-box">
                        <CalendarCheck size={18} color="var(--primary)" />
                      </div>
                      <span className="badge badge-primary font-mono">{b.bookingNo || b.id}</span>
                    </div>
                    <span
                      className={`badge ${
                        b.status === 'Delivered'
                          ? 'badge-success'
                          : b.status === 'Ready for Trial'
                          ? 'badge-cyan'
                          : b.status === 'In Production'
                          ? 'badge-warning'
                          : 'badge-primary'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <h3
                      className="mobile-card-title"
                      style={{ cursor: 'pointer', color: 'var(--primary)' }}
                      onClick={() => {
                        const matched = customers.find((c) => c.id === b.customerId || c.name === b.customerName);
                        setSelectedCustomerFor360(matched || { id: b.customerId, name: b.customerName, phone: b.customerPhone, type: 'VIP Bespoke' });
                      }}
                      title="View Customer Profile"
                    >
                      {b.customerName}
                    </h3>
                    <div className="mobile-card-subtitle">
                      {b.garmentType} • {b.fabricDetails}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mobile-card-details">
                    <div>
                      Phone: <strong style={{ color: 'var(--text-main)' }}>{b.customerPhone}</strong>
                    </div>
                    <div>
                      Trial: <strong style={{ color: '#F59E0B' }}>{formatDate(b.trialDate)}</strong> • Delivery: <strong style={{ color: 'var(--text-main)' }}>{formatDate(b.deliveryDate)}</strong>
                    </div>
                    <div>
                      Master: {b.assignedMaster || 'Lead Tailor'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                      <span>Total: {formatCurrency(b.totalAmount, currency)}</span>
                      <span style={{ color: '#10B981' }}>Advance: {formatCurrency(b.advancePaid, currency)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => handleJobCardDownload(b)}
                    >
                      <Download size={13} /> Job Card
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => {
                        setSelectedOrderForReceipt({
                          invoiceNo: b.bookingNo || b.id,
                          date: formatDate(b.bookingDate || b.date),
                          customerName: b.customerName,
                          customerPhone: b.customerPhone,
                          customerAddress: b.customerAddress,
                          items: [{ name: b.garmentType + (b.fabricDetails ? ' - ' + b.fabricDetails : ''), quantity: 1, price: b.totalAmount }],
                          total: b.totalAmount,
                          advancePaid: b.advancePaid,
                          balanceDue: b.balanceDue,
                          workTypes: b.workTypes || [],
                          paymentMethod: b.status === 'Delivered' ? 'Full Settlement' : 'Advance Deposit'
                        });
                      }}
                    >
                      <FileText size={13} /> Show Bill
                    </button>
                    {b.status !== 'Delivered' && (
                      <button
                        className="btn btn-success btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => handleDeliverAndSettle(b)}
                      >
                        <CheckCircle2 size={13} /> Settle & Deliver
                      </button>
                    )}
                  </div>

                  {/* Dashed Separator */}
                  <div className="mobile-card-divider" />

                  {/* Footer Row */}
                  <div className="mobile-card-footer">
                    <span className="mobile-card-footer-label">Balance Due:</span>
                    <strong
                      className="mobile-card-footer-value"
                      style={{ color: b.balanceDue > 0 ? '#F43F5E' : '#10B981' }}
                    >
                      {formatCurrency(b.balanceDue, currency)}
                    </strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        /* Clients & VIP Directory Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {customers
            .filter(
              (c) =>
                c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                c.phone.includes(customerSearch) ||
                c.id.toLowerCase().includes(customerSearch.toLowerCase())
            )
            .map((cust) => (
              <div key={cust.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                      👤
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{cust.name}</h3>
                      <span className="badge badge-primary font-mono" style={{ fontSize: '0.65rem' }}>{cust.id}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className={`badge ${(cust.type || 'Standard Client').includes('VIP') ? 'badge-warning' : 'badge-cyan'}`} style={{ fontSize: '0.7rem' }}>
                      {cust.type || 'Standard Client'}
                    </span>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete client "${cust.name}" (${cust.id})?`)) {
                          deleteCustomer(cust.id);
                        }
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#F43F5E', cursor: 'pointer', padding: '4px' }}
                      title="Delete Customer Profile"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                    <Phone size={13} color="var(--primary)" /> <span>{cust.phone}</span>
                  </div>
                  {cust.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                      <Mail size={13} color="var(--primary)" /> <span>{cust.email}</span>
                    </div>
                  )}
                  {cust.city && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                      <MapPin size={13} color="var(--primary)" /> <span>{cust.city}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px', borderTop: '1px dashed var(--border-color)', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Loyalty Points:</span>
                  <span style={{ color: '#F59E0B', fontWeight: 700 }}>{cust.loyaltyPoints || 0} pts</span>
                </div>

                {/* 360° Profile & Sizing Trigger Button */}
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setSelectedCustomerFor360(cust)}
                  style={{ width: '100%', marginTop: '4px', gap: '6px' }}
                >
                  <Scissors size={14} /> View 360° Profile, Sizes & Bills
                </button>
              </div>
            ))}
        </div>
      )}
      </div>

      {/* Modals */}
      <NewBookingModal isOpen={isNewBookingOpen} onClose={() => setIsNewBookingOpen(false)} />
      <CustomerModal isOpen={isNewCustomerOpen} onClose={() => setIsNewCustomerOpen(false)} />
      <CustomerProfileModal
        isOpen={Boolean(selectedCustomerFor360)}
        onClose={() => setSelectedCustomerFor360(null)}
        customer={selectedCustomerFor360}
      />
      <ReceiptModal
        isOpen={Boolean(selectedOrderForReceipt)}
        onClose={() => setSelectedOrderForReceipt(null)}
        order={selectedOrderForReceipt}
        currency={currency}
      />
    </div>
  );
};


