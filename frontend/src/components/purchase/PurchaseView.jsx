import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Truck,
  Plus,
  PackageCheck,
  Building2,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Trash2,
  Download,
  FileText,
  Tag,
  Archive,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportPurchaseOrderPDF } from '../../utils/pdfGenerator';
import { NewPOModal } from './NewPOModal';
import { VendorModal } from './VendorModal';
import { POInvoiceModal } from './POInvoiceModal';
import { StatCard } from '../common/StatCard';

export const PurchaseView = () => {
  const { purchaseOrders, vendors, receiveStockFromPO, deleteVendor, currency, rawMaterialLots } = useApp();
  const [activeTab, setActiveTab] = useState('pos'); // 'pos', 'vendors', 'lots'
  const [isNewPOOpen, setIsNewPOOpen] = useState(false);
  const [isVendorOpen, setIsVendorOpen] = useState(false);
  const [selectedPOForInvoice, setSelectedPOForInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lotSearch, setLotSearch] = useState('');

  const totalPayables = vendors.reduce((acc, v) => acc + (v.balancePayable || 0), 0);
  const pendingOrders = purchaseOrders.filter((po) => po.status === 'Ordered').length;
  const completedOrders = purchaseOrders.filter((po) => po.status === 'Completed').length;

  const filteredPOs = purchaseOrders.filter(
    (po) =>
      po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (po.supplierInvoiceNo && po.supplierInvoiceNo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="view-container">
      {/* Header */}
      <div className="responsive-header-row">
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Purchase Orders & Sourcing</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Manage raw fabric rolls, accessories procurement, textile mills, and supplier invoice records
          </p>
        </div>
        <div className="responsive-header-actions" style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setIsVendorOpen(true)}>
            <Building2 size={16} /> Add Supplier
          </button>
          <button className="btn btn-primary" onClick={() => setIsNewPOOpen(true)}>
            <Plus size={16} /> Create Purchase Order
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid">
        <StatCard
          label="Total Vendor Payables"
          value={formatCurrency(totalPayables, currency)}
          icon={Building2}
          color="#F43F5E"
          trend="Outstanding Bills"
          trendPositive={false}
        />
        <StatCard
          label="Open POs In Transit"
          value={`${pendingOrders} Orders`}
          icon={Truck}
          color="#F59E0B"
        />
        <StatCard
          label="Completed Inwards"
          value={`${completedOrders} Batches`}
          icon={PackageCheck}
          color="#10B981"
        />
        <StatCard
          label="Registered Textile Mills"
          value={`${vendors.length} Partners`}
          icon={Building2}
          color="#6366F1"
        />
      </div>

      {/* View Switcher Tabs & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={`btn ${activeTab === 'pos' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab('pos')}
          >
            <Truck size={14} /> Purchase Orders ({purchaseOrders.length})
          </button>
          <button
            className={`btn ${activeTab === 'lots' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab('lots')}
          >
            <Archive size={14} /> Raw Material Lots ({rawMaterialLots.length})
          </button>
          <button
            className={`btn ${activeTab === 'vendors' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab('vendors')}
          >
            <Building2 size={14} /> Suppliers & Mills ({vendors.length})
          </button>
        </div>

        <div style={{ position: 'relative', width: '100%', maxWidth: '300px', minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '34px', fontSize: '0.85rem' }}
            placeholder="Search PO / Supplier / Invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'lots' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Archive size={20} color="var(--primary-color)" /> Raw Material Inventory Lot Ledger
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                Each received batch is assigned a unique lot code: <code style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>PREFIX-Price-Month-Day-Random</code>. Example: <strong>CP-150-09-09-4521</strong> = Cotton Print received on Sept 9 at ₹150/unit.
              </p>
            </div>
            <div style={{ position: 'relative', minWidth: '220px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '32px', fontSize: '0.85rem' }}
                placeholder="Search lot code, material, supplier..."
                value={lotSearch}
                onChange={(e) => setLotSearch(e.target.value)}
              />
            </div>
          </div>

          {rawMaterialLots.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
              <Archive size={48} style={{ opacity: 0.25, marginBottom: '12px' }} />
              <p style={{ fontWeight: 700 }}>No lot records yet.</p>
              <p style={{ fontSize: '0.85rem' }}>Lot codes are auto-generated when you click <strong>"Receive Goods"</strong> on a Purchase Order.</p>
            </div>
          ) : (
            <div className="table-responsive products-table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Lot Code</th>
                    <th>Material Name</th>
                    <th>Qty Received</th>
                    <th>Unit Price (₹)</th>
                    <th>Purchase Date</th>
                    <th>Supplier / Mill</th>
                    <th>PO Reference</th>
                    <th>Invoice No.</th>
                  </tr>
                </thead>
                <tbody>
                  {rawMaterialLots
                    .filter((lot) =>
                      !lotSearch ||
                      lot.lotCode.toLowerCase().includes(lotSearch.toLowerCase()) ||
                      lot.itemName.toLowerCase().includes(lotSearch.toLowerCase()) ||
                      lot.supplierName.toLowerCase().includes(lotSearch.toLowerCase())
                    )
                    .map((lot, idx) => (
                      <tr key={`${lot.lotCode}-${idx}`}>
                        <td data-label="Lot Code">
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.85rem', background: '#eef2ff', color: '#4338ca', padding: '3px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                            <Tag size={12} style={{ display: 'inline', marginRight: '4px' }} />
                            {lot.lotCode}
                          </span>
                        </td>
                        <td data-label="Material">{lot.itemName}</td>
                        <td data-label="Qty">{lot.qty} units</td>
                        <td data-label="Unit Price" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          ₹{Number(lot.unitPrice).toFixed(2)}
                        </td>
                        <td data-label="Purchase Date">{lot.purchaseDate}</td>
                        <td data-label="Supplier">{lot.supplierName}</td>
                        <td data-label="PO Ref" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {lot.poId}
                        </td>
                        <td data-label="Invoice No." style={{ fontSize: '0.8rem' }}>
                          {lot.supplierInvoiceNo || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'pos' && (
        <>

          {/* Desktop Table View */}
          <div className="table-responsive card desktop-only-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier / Mill</th>
                  <th>Order Date</th>
                  <th>Expected Date</th>
                  <th>Line Items</th>
                  <th>Total Value</th>
                  <th>Supplier Invoice</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPOs.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                      No purchase orders found. Click "+ Create Purchase Order" to raise an inward order.
                    </td>
                  </tr>
                ) : (
                  filteredPOs.map((po) => (
                    <tr key={po.id}>
                      <td>
                        <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{po.id}</strong>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{po.vendorName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {po.vendorId}</div>
                      </td>
                      <td>{formatDate(po.orderDate)}</td>
                      <td>{formatDate(po.expectedDate)}</td>
                      <td>
                        <div style={{ fontSize: '0.8rem' }}>
                          {po.items?.map((item, idx) => (
                            <div key={idx} style={{ color: 'var(--text-muted)' }}>
                              • {item.name} ({item.qty} units)
                            </div>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: '#34D399', fontFamily: 'var(--font-mono)' }}>
                          {formatCurrency(po.total, currency)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          Paid: {formatCurrency(po.paidAmount || 0, currency)}
                        </div>
                      </td>
                      <td>
                        {po.supplierInvoiceNo || po.supplierInvoiceFile ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34D399', fontFamily: 'var(--font-mono)' }}>
                              {po.supplierInvoiceNo || 'Invoice Attached'}
                            </span>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => setSelectedPOForInvoice(po)}
                              title="View / Download Supplier Invoice"
                            >
                              <FileText size={14} /> View Invoice
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedPOForInvoice(po)}
                            title="Attach Supplier Invoice"
                          >
                            <Plus size={14} /> Add Invoice
                          </button>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            po.status === 'Completed'
                              ? 'badge-success'
                              : po.status === 'Ordered'
                              ? 'badge-warning'
                              : 'badge-primary'
                          }`}
                        >
                          {po.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => exportPurchaseOrderPDF(po)}
                            title="Download Raw Material Purchase Bill (PDF)"
                          >
                            <Download size={14} /> PDF Bill
                          </button>
                          {po.status !== 'Completed' ? (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => receiveStockFromPO(po.id)}
                              title="Verify delivery, add to inventory stock & record goods inward"
                            >
                              <PackageCheck size={14} /> Receive Goods
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle size={14} /> Inwarded
                            </span>
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
            {filteredPOs.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                No purchase orders found. Click "+ Create Purchase Order" to raise an inward order.
              </div>
            ) : (
              filteredPOs.map((po) => (
                <div key={po.id} className="mobile-data-card">
                  {/* Top Row: Icon + ID Badge (Left) and Statuses (Right) */}
                  <div className="mobile-card-top">
                    <div className="mobile-card-badge-group">
                      <div className="mobile-card-icon-box">
                        <Truck size={18} color="var(--primary)" />
                      </div>
                      <span className="badge badge-primary font-mono">{po.id}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        className={`badge ${
                          po.paymentStatus === 'Paid'
                            ? 'badge-success'
                            : po.paymentStatus === 'Partial Paid'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}
                      >
                        {po.paymentStatus}
                      </span>
                      <span
                        className={`badge ${
                          po.status === 'Completed'
                            ? 'badge-success'
                            : po.status === 'Ordered'
                            ? 'badge-warning'
                            : 'badge-primary'
                        }`}
                      >
                        {po.status}
                      </span>
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <h3 className="mobile-card-title">{po.vendorName}</h3>
                    <div className="mobile-card-subtitle">
                      Ordered: {formatDate(po.orderDate)} • Expected: {formatDate(po.expectedDate)}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mobile-card-details">
                    <div>
                      Supplier ID: <strong style={{ color: 'var(--text-main)' }}>{po.vendorId}</strong>
                    </div>
                    <div>
                      Line Items: {po.items?.map((item) => `${item.name} (${item.qty})`).join(', ') || 'None'}
                    </div>
                    <div>
                      Paid: <strong style={{ color: '#10B981' }}>{formatCurrency(po.paidAmount || 0, currency)}</strong>
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      Supplier Invoice: {' '}
                      {po.supplierInvoiceNo ? (
                        <span style={{ color: '#34D399', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{po.supplierInvoiceNo}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Not attached</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => setSelectedPOForInvoice(po)}
                    >
                      <FileText size={14} /> {po.supplierInvoiceNo || po.supplierInvoiceFile ? 'View Invoice' : 'Add Invoice'}
                    </button>
                    {po.status !== 'Completed' && (
                      <button
                        className="btn btn-success btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => receiveStockFromPO(po.id)}
                      >
                        <PackageCheck size={14} /> Receive Goods
                      </button>
                    )}
                  </div>

                  {/* Dashed Separator */}
                  <div className="mobile-card-divider" />

                  {/* Footer Row */}
                  <div className="mobile-card-footer">
                    <span className="mobile-card-footer-label">Total Value:</span>
                    <strong className="mobile-card-footer-value" style={{ color: '#34D399' }}>
                      {formatCurrency(po.total, currency)}
                    </strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'vendors' && (
        /* Vendors Directory Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {vendors.map((v) => (
            <div key={v.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building2 size={20} color="var(--primary)" />
                  </div>
                  <span className="badge badge-primary font-mono">{v.id}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="badge badge-warning">{v.rating || 5.0} ★</span>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete vendor "${v.name}" (${v.id}) from registry?`)) {
                        deleteVendor(v.id);
                      }
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#F43F5E', cursor: 'pointer', padding: '4px' }}
                    title="Delete Vendor"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{v.name}</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {v.category} • {v.city}
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', background: 'var(--bg-surface)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
                <div>Contact: <strong style={{ color: 'var(--text-main)' }}>{v.contactPerson}</strong></div>
                <div>Phone: {v.phone}</div>
                <div>GSTIN: {v.gstin || 'N/A'}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px', borderTop: '1px dashed var(--border-color)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Balance Payable:</span>
                <span style={{ fontWeight: 800, color: (v.balancePayable || 0) > 0 ? '#F43F5E' : '#10B981', fontFamily: 'var(--font-mono)' }}>
                  {formatCurrency(v.balancePayable || 0, currency)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <NewPOModal isOpen={isNewPOOpen} onClose={() => setIsNewPOOpen(false)} />
      <VendorModal isOpen={isVendorOpen} onClose={() => setIsVendorOpen(false)} />
      <POInvoiceModal
        isOpen={Boolean(selectedPOForInvoice)}
        onClose={() => setSelectedPOForInvoice(null)}
        po={selectedPOForInvoice}
      />
    </div>
  );
};

