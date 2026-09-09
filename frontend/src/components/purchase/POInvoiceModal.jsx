import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { FileText, Upload, Download, Edit2, CheckCircle, File, Eye } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const POInvoiceModal = ({ isOpen, onClose, po }) => {
  const { uploadPOInvoice } = useApp();

  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [invoiceFile, setInvoiceFile] = useState('');
  const [invoiceName, setInvoiceName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (po) {
      setInvoiceNo(po.supplierInvoiceNo || '');
      setInvoiceDate(po.supplierInvoiceDate || po.orderDate || new Date().toISOString().split('T')[0]);
      setInvoiceFile(po.supplierInvoiceFile || '');
      setInvoiceName(po.supplierInvoiceName || '');
      setIsEditing(!po.supplierInvoiceNo && !po.supplierInvoiceFile);
    }
  }, [po, isOpen]);

  if (!po) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setInvoiceName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      setInvoiceFile(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await uploadPOInvoice(po.id, {
        supplierInvoiceNo: invoiceNo,
        supplierInvoiceDate: invoiceDate,
        supplierInvoiceFile: invoiceFile,
        supplierInvoiceName: invoiceName,
      });
      setIsEditing(false);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = () => {
    if (invoiceFile) {
      const link = document.createElement('a');
      link.href = invoiceFile;
      link.download = invoiceName || `Supplier_Invoice_${po.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(`Invoice #${invoiceNo || po.id} details saved. File preview not available.`);
    }
  };

  const isImage = invoiceFile && invoiceFile.startsWith('data:image/');
  const isPdf = invoiceFile && invoiceFile.startsWith('data:application/pdf');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Supplier Invoice - ${po.vendorName}`}
      maxWidth="600px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header Summary */}
        <div style={{ background: 'var(--bg-surface-elevated)', padding: '12px 16px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Purchase Order</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{po.id}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Supplier</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{po.vendorName}</div>
          </div>
        </div>

        {!isEditing && (po.supplierInvoiceNo || po.supplierInvoiceFile) ? (
          /* View Invoice Details Mode */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Supplier Invoice No.</span>
                <strong style={{ fontSize: '1rem', color: '#34D399', fontFamily: 'var(--font-mono)' }}>
                  {invoiceNo || 'N/A'}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Invoice Date</span>
                <strong style={{ fontSize: '0.95rem' }}>
                  {formatDate(invoiceDate)}
                </strong>
              </div>
            </div>

            {/* Document Preview Box */}
            <div style={{ border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', textAlign: 'center', background: 'var(--bg-surface)' }}>
              {isImage ? (
                <div>
                  <img
                    src={invoiceFile}
                    alt="Supplier Invoice Document"
                    style={{ maxWidth: '100%', maxHeight: '280px', borderRadius: 'var(--radius-sm)', objectFit: 'contain', border: '1px solid var(--border-color)' }}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>{invoiceName}</div>
                </div>
              ) : isPdf ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <FileText size={48} color="var(--primary)" />
                  <div style={{ fontWeight: 600 }}>{invoiceName || 'Supplier_Invoice_Document.pdf'}</div>
                  <iframe src={invoiceFile} title="Invoice PDF" style={{ width: '100%', height: '200px', border: 'none', borderRadius: 'var(--radius-sm)' }} />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px' }}>
                  <File size={42} color="var(--primary)" />
                  <div style={{ fontWeight: 600 }}>{invoiceName || `Supplier Invoice File attached`}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Document is linked to Purchase Order #{po.id}</div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
                <Edit2 size={16} /> Edit Invoice Details
              </button>
              {invoiceFile && (
                <button className="btn btn-primary" onClick={handleDownload}>
                  <Download size={16} /> Download File
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Upload / Edit Form Mode */
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label">Supplier Invoice No.</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. INV-SUP-8921"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">Invoice Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label">Attach Supplier Invoice (Image / PDF)</label>
              <div
                style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                  textAlign: 'center',
                  background: 'var(--bg-surface-elevated)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="file"
                  id="po-invoice-file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="po-invoice-file" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Upload size={28} color="var(--primary)" />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    {invoiceName ? `Selected: ${invoiceName}` : 'Click here to upload supplier invoice bill/photo'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Supports PNG, JPG, JPEG, and PDF documents
                  </span>
                </label>
              </div>

              {invoiceFile && (
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.1)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <CheckCircle size={16} color="#10B981" />
                  <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 600 }}>
                    File attached ready to save: {invoiceName || 'Invoice_Document'}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              {(po.supplierInvoiceNo || po.supplierInvoiceFile) && (
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              )}
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                <Upload size={16} /> {isSubmitting ? 'Saving...' : 'Save & Attach Invoice'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
