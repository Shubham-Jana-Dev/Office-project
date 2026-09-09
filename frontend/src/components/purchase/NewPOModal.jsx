import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { SearchableSelect } from '../common/SearchableSelect';
import { VendorModal } from './VendorModal';
import { ProductModal } from '../common/ProductModal';
import { Plus, Trash2, Truck, FileText, Upload, Paperclip, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const NewPOModal = ({ isOpen, onClose }) => {
  const { vendors, products, createPurchaseOrder, currency } = useApp();

  const [selectedVendorId, setSelectedVendorId] = useState(vendors[0]?.id || '');
  const [expectedDate, setExpectedDate] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState('');
  
  // Supplier Invoice State
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
  const [supplierInvoiceDate, setSupplierInvoiceDate] = useState('');
  const [supplierInvoiceFile, setSupplierInvoiceFile] = useState('');
  const [supplierInvoiceName, setSupplierInvoiceName] = useState('');
  const [showInvoiceSection, setShowInvoiceSection] = useState(false);

  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [productRowIndex, setProductRowIndex] = useState(null);
  const [items, setItems] = useState([
    { name: products[0]?.name || 'Cotton Fabric Rolls', qty: 50, unitPrice: 5.00 },
  ]);

  const handleAddItemRow = () => {
    setItems((prev) => [...prev, { name: '', qty: 10, unitPrice: 10.00 }]);
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleInvoiceFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSupplierInvoiceName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setSupplierInvoiceFile(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.qty) || 0) * (Number(item.unitPrice) || 0),
    0
  );
  const tax = subtotal * 0.05; // 5% GST on raw fabric/goods
  const total = subtotal + tax;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const vendor = vendors.find((v) => v.id === selectedVendorId);

    const formattedItems = items.map((item) => ({
      name: item.name || 'Material Item',
      qty: Number(item.qty) || 1,
      unitPrice: Number(item.unitPrice) || 0,
      total: (Number(item.qty) || 1) * (Number(item.unitPrice) || 0),
    }));

    await createPurchaseOrder({
      vendorId: selectedVendorId,
      vendorName: vendor ? vendor.name : 'Textile Supplier',
      expectedDate: expectedDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      items: formattedItems,
      subtotal,
      tax,
      total,
      paidAmount: Number(paidAmount) || 0,
      notes,
      supplierInvoiceNo,
      supplierInvoiceDate: supplierInvoiceDate || new Date().toISOString().split('T')[0],
      supplierInvoiceFile,
      supplierInvoiceName,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Purchase Order (Raw Materials & Fabric Sourcing)"
      maxWidth="720px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label className="form-label">Select Vendor / Textile Mill</label>
            <SearchableSelect
              value={selectedVendorId}
              onChange={setSelectedVendorId}
              options={vendors.map((vendor) => ({
                value: vendor.id,
                label: `${vendor.name} (${vendor.category})`,
              }))}
              placeholder="Search vendor or textile mill..."
              addNewLabel="Add new supplier"
              onAddNew={(name) => {
                setNewVendorName(name);
                setIsVendorModalOpen(true);
              }}
              required
            />
          </div>

          <div>
            <label className="form-label">Expected Delivery Date</label>
            <input
              type="date"
              className="form-input"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* PO Line Items */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="form-label" style={{ margin: 0 }}>Purchase Line Items</label>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleAddItemRow}
            >
              <Plus size={14} /> Add Item Row
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {items.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1.2fr 1.2fr auto',
                  gap: '8px',
                  alignItems: 'center',
                  background: 'var(--bg-surface-elevated)',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <SearchableSelect
                  value={item.name}
                  onChange={(name) => handleItemChange(index, 'name', name)}
                  options={products.map((product) => ({ value: product.name, label: product.name }))}
                  placeholder="Search product or type a new item..."
                  addNewLabel="Add new product"
                  onAddNew={(name) => {
                    setNewProductName(name);
                    setProductRowIndex(index);
                  }}
                  required
                />
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  placeholder="Qty/Meters"
                  value={item.qty}
                  onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="Unit Price"
                  value={item.unitPrice}
                  onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                  required
                />
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#34D399', textAlign: 'right' }}>
                  {formatCurrency((Number(item.qty) || 0) * (Number(item.unitPrice) || 0), currency)}
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    style={{ background: 'transparent', border: 'none', color: '#F43F5E', cursor: 'cursor' }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Supplier Invoice Section Toggle & Card */}
        <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--primary)" />
              <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Supplier Invoice Attachment (Optional)</span>
            </div>
            <button
              type="button"
              className={`btn ${showInvoiceSection ? 'btn-secondary' : 'btn-outline'} btn-sm`}
              onClick={() => setShowInvoiceSection((prev) => !prev)}
            >
              <Paperclip size={14} /> {showInvoiceSection ? 'Hide Invoice Form' : '+ Add Invoice Details'}
            </button>
          </div>

          {showInvoiceSection && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--border-color)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Supplier Invoice No.</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. INV-SUP-9081"
                    value={supplierInvoiceNo}
                    onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Supplier Invoice Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={supplierInvoiceDate}
                    onChange={(e) => setSupplierInvoiceDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Upload Supplier Invoice File (PDF / Image)</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="file"
                    id="new-po-invoice-file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleInvoiceFileChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="new-po-invoice-file" className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                    <Upload size={14} /> Attach Invoice File
                  </label>
                  {supplierInvoiceName ? (
                    <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={14} /> {supplierInvoiceName}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No file attached yet</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Totals & Advance Payment */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label className="form-label">Advance Paid to Supplier Now</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={total}
              className="form-input"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
            />
          </div>

          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal, currency)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginTop: '2px' }}>
              <span>GST (5%):</span>
              <span>{formatCurrency(tax, currency)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 800,
                fontSize: '1rem',
                color: '#FFF',
                marginTop: '4px',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '4px',
              }}
            >
              <span>PO Total:</span>
              <span>{formatCurrency(total, currency)}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="form-label">Notes & Delivery Instructions</label>
          <textarea
            className="form-textarea"
            placeholder="Special packing instructions, roll inspection notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
          <Truck size={18} /> Generate Purchase Order & Update Ledger
        </button>
      </form>
      <VendorModal
        isOpen={isVendorModalOpen}
        onClose={() => setIsVendorModalOpen(false)}
        initialName={newVendorName}
        onVendorCreated={(vendor) => setSelectedVendorId(vendor.id)}
      />
      <ProductModal
        isOpen={productRowIndex !== null}
        onClose={() => setProductRowIndex(null)}
        initialName={newProductName}
        onProductCreated={(product) => {
          handleItemChange(productRowIndex, 'name', product.name);
          setProductRowIndex(null);
        }}
      />
    </Modal>
  );
};

