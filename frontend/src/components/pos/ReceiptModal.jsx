import React, { useEffect, useRef, useState } from 'react';
import { Modal } from '../common/Modal';
import { Printer, Download, CheckCircle2, MessageCircle, FileText, AlertCircle } from 'lucide-react';
import { SHOP_DETAILS } from '../../config/constants';
import { exportInvoicePDF, generateInvoicePDFBlob } from '../../utils/pdfGenerator';
import JsBarcode from 'jsbarcode';
import html2canvas from 'html2canvas';

export const ReceiptModal = ({ isOpen, onClose, order, currency = 'INR' }) => {
  const barcodeRef = useRef(null);
  const [shareNotice, setShareNotice] = useState(null);

  useEffect(() => {
    if (isOpen && order && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, order.invoiceNo || order.bookingNo || order.id || 'INV-000', {
          format: 'CODE128',
          lineColor: '#1e3a8a',
          width: 1.6,
          height: 38,
          displayValue: true,
          fontSize: 10,
          font: 'monospace',
        });
      } catch (err) {
        console.error('Barcode render error:', err);
      }
    }
  }, [isOpen, order]);

  if (!order) return null;

  const totalVal = order.total !== undefined
    ? Number(order.total)
    : (order.totalAmount !== undefined ? Number(order.totalAmount) : 0);

  let advanceVal = 0;
  if (order.advance !== undefined) {
    advanceVal = Number(order.advance);
  } else if (order.advancePaid !== undefined) {
    advanceVal = Number(order.advancePaid);
  } else if (order.amountPaid !== undefined) {
    advanceVal = Number(order.amountPaid);
  } else {
    advanceVal = totalVal;
  }

  let dueVal = 0;
  if (order.balanceDue !== undefined) {
    dueVal = Math.max(0, Number(order.balanceDue));
  } else if (order.due !== undefined) {
    dueVal = Math.max(0, Number(order.due));
  } else {
    dueVal = Math.max(0, totalVal - advanceVal);
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    exportInvoicePDF(order);
  };

  const handleShareWhatsAppPDF = async () => {
    setShareNotice(null);
    let rawPhone = order.customerPhone || '';
    let digitsOnly = rawPhone.replace(/\D/g, '');

    // Default country code 91 if 10-digit Indian mobile number
    if (digitsOnly.length === 10) {
      digitsOnly = `91${digitsOnly}`;
    }

    const billNoStr = order.invoiceNo || order.bookingNo || order.id || 'N/A';

    try {
      // 1. Generate Invoice PDF Blob & File
      const { file: pdfFile, fileName: pdfFileName, blob: pdfBlob } = generateInvoicePDFBlob(order);

      // 2. Always trigger download of the PDF file to ensure it's saved locally
      const pdfLink = document.createElement('a');
      pdfLink.href = URL.createObjectURL(pdfBlob);
      pdfLink.download = pdfFileName;
      document.body.appendChild(pdfLink);
      pdfLink.click();
      document.body.removeChild(pdfLink);

      // 3. Mobile Devices: Try Native Web Share API with PDF File
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            files: [pdfFile],
            title: `Invoice_${billNoStr}`
          });
          return;
        } catch (shareErr) {
          if (shareErr.name === 'AbortError') return; // User canceled share popup
          console.log('Native PDF share fallback:', shareErr);
        }
      }

      // 4. Desktop / WhatsApp Web link fallback:
      // Open WhatsApp chat directly with customer's phone number without text param
      // so plain text message is NOT pre-filled or sent into the chat.
      setShareNotice({
        title: `✅ PDF Downloaded: ${pdfFileName}`,
        text: `WhatsApp Web has been opened! Click the 📎 Attachment icon in WhatsApp ➔ Select 'Document' ➔ Choose '${pdfFileName}' to send the PDF bill.`
      });

      const waUrl = digitsOnly
        ? `https://api.whatsapp.com/send?phone=${digitsOnly}`
        : `https://api.whatsapp.com/send`;

      window.open(waUrl, '_blank', 'noopener,noreferrer');

    } catch (err) {
      console.error('Failed to share PDF:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bill Receipt"
      maxWidth="800px"
      zIndex={7000}
      footer={
        <div className="receipt-modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close & Next Order
          </button>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              className="btn"
              onClick={handleShareWhatsAppPDF}
              style={{ background: '#25D366', color: '#ffffff', fontWeight: 700, border: 'none' }}
              title="Share PDF Bill Document directly to customer's WhatsApp"
            >
              <MessageCircle size={16} />
              Share Bill PDF (WhatsApp)
            </button>
            <button className="btn btn-secondary" onClick={handlePrint}>
              <Printer size={16} />
              Print Bill
            </button>
            <button className="btn btn-primary" onClick={handleDownloadPDF}>
              <Download size={16} />
              Download A4 Bill (PDF)
            </button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
        {/* Success Banner & Quick WhatsApp Action */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            color: '#10B981',
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            width: '100%',
            maxWidth: '650px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Payment Approved ({order.paymentMethod?.toUpperCase() || 'PAID'}) • Bill Generated
            </span>
          </div>

          <button
            type="button"
            className="btn btn-sm"
            onClick={handleShareWhatsAppPDF}
            style={{ background: '#25D366', color: '#ffffff', fontWeight: 700, border: 'none', borderRadius: '14px', padding: '4px 12px', fontSize: '0.78rem' }}
            title="Send PDF bill document directly to customer's WhatsApp"
          >
            <MessageCircle size={14} style={{ marginRight: '4px', display: 'inline' }} />
            Share Bill PDF (WhatsApp)
          </button>
        </div>

        {/* Instructions banner when fallback downloads PDF on HTTP desktop */}
        {shareNotice && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              color: '#1e3a8a',
              background: '#eff6ff',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #bfdbfe',
              width: '100%',
              maxWidth: '650px',
              fontSize: '0.83rem'
            }}
          >
            <AlertCircle size={18} style={{ color: '#2563eb', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{shareNotice.title}</div>
              <div>{shareNotice.text}</div>
            </div>
          </div>
        )}

        {/* Bill Paper Container Wrapper */}
        <div className="bill-paper-container">
          <div 
            className="full-bill-paper" 
            id="printable-receipt"
          >
            {/* Top Line Header: No. and Date */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
              <span>No. {order.invoiceNo || order.bookingNo || order.id}</span>
              <span>Date : {order.date || order.bookingDate || new Date().toLocaleDateString('en-GB')}</span>
            </div>

            {/* Center Shop Header */}
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 4px 0', color: '#1e3a8a', letterSpacing: '-0.5px' }}>{SHOP_DETAILS.name}</h2>
              <p style={{ margin: '2px 0', fontSize: '13px', fontWeight: 'bold' }}>"{SHOP_DETAILS.tagline || 'A UNIQUE WOMAN'}"</p>
              <p style={{ margin: '3px 0 2px 0', fontSize: '12px' }}>{SHOP_DETAILS.address}</p>
              {SHOP_DETAILS.email && <p style={{ margin: '2px 0', fontSize: '12px' }}>E-mail : {SHOP_DETAILS.email}</p>}
              <p style={{ margin: '2px 0', fontSize: '12px' }}>Ph. : {SHOP_DETAILS.phone}</p>
              <div style={{ borderBottom: '2px solid #1e3a8a', marginTop: '12px' }}></div>
              <div style={{ borderBottom: '1px dashed #1e3a8a', marginTop: '2px' }}></div>
            </div>

            {/* Customer Header Info */}
            <div className="bill-customer-header">
              <div>
                Phone : {order.customerPhone || '________________'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>Name : {order.customerName || 'Walk-in Retail Customer'}</div>
                <div>Address : {order.customerAddress || '____________________________________'}</div>
              </div>
            </div>

            {/* Main Layout: Left Work Types + Right Grid Table */}
            <div className="bill-main-layout">
              
              {/* Work Types (Product Bills ONLY) */}
              {!(order.saleType === 'raw_material' || order.orderType === 'RAW_MATERIAL' || order.type === 'PURCHASE_ORDER') && (
                <div className="bill-work-types-column">
                   {['Ari', 'Salma', 'Chumki', 'Gujrati', 'Ripu', 'P. Ko', 'Falls', 'Polish', 'Fabrick', 'Khatha', 'Embrodory', 'Dry'].map(item => {
                     const isChecked = Array.isArray(order.workTypes) && order.workTypes.includes(item);
                     return (
                       <div key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <span>{item} -</span>
                         <span style={{ fontWeight: 800, minWidth: '20px', textAlign: 'right', color: isChecked ? '#1e3a8a' : 'transparent' }}>
                           {isChecked ? '✓' : ''}
                         </span>
                       </div>
                     );
                   })}
                </div>
              )}

              {/* Table Grid with Full Blue Borders */}
              <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #1e3a8a', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ border: '1px solid #1e3a8a', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>
                        {(order.saleType === 'raw_material' || order.orderType === 'RAW_MATERIAL') ? 'Fabric Particulars' : 'Particulars'}
                      </th>
                      <th style={{ border: '1px solid #1e3a8a', padding: '6px 4px', textAlign: 'center', fontWeight: 'bold', width: (order.saleType === 'raw_material' || order.orderType === 'RAW_MATERIAL') ? '75px' : '38px' }}>
                        {(order.saleType === 'raw_material' || order.orderType === 'RAW_MATERIAL') ? 'Meters (m)' : 'Qty'}
                      </th>
                      <th style={{ border: '1px solid #1e3a8a', padding: '6px 4px', textAlign: 'center', fontWeight: 'bold', width: '60px' }}>
                        {(order.saleType === 'raw_material' || order.orderType === 'RAW_MATERIAL') ? 'Rate / m' : 'Rate'}
                      </th>
                      <th style={{ border: '1px solid #1e3a8a', padding: '6px 4px', textAlign: 'center', fontWeight: 'bold', width: '60px' }}>Rs.</th>
                      <th style={{ border: '1px solid #1e3a8a', padding: '6px 2px', textAlign: 'center', fontWeight: 'bold', width: '30px' }}>P.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items && order.items.length > 0 ? order.items : [{ name: 'Item Particulars', quantity: 1, price: totalVal }]).map((item, idx) => {
                      const qty = Number(item.quantity || item.qty || 1);
                      const rate = Number(item.price || item.unitPrice || 0);
                      const itemTotal = Number(item.total !== undefined ? item.total : rate * qty);
                      const rsVal = Math.floor(itemTotal);
                      const pVal = Math.round((itemTotal - rsVal) * 100);
                      return (
                        <tr key={idx}>
                          <td style={{ border: '1px solid #1e3a8a', padding: '6px 8px', textAlign: 'left' }}>{item.name}</td>
                          <td style={{ border: '1px solid #1e3a8a', padding: '6px 4px', textAlign: 'center', fontWeight: (order.saleType === 'raw_material' || order.orderType === 'RAW_MATERIAL') ? 700 : 400 }}>
                            {(order.saleType === 'raw_material' || order.orderType === 'RAW_MATERIAL') ? `${qty} m` : qty}
                          </td>
                          <td style={{ border: '1px solid #1e3a8a', padding: '6px 4px', textAlign: 'right' }}>{rate > 0 ? rate : ''}</td>
                          <td style={{ border: '1px solid #1e3a8a', padding: '6px 4px', textAlign: 'right', fontWeight: 600 }}>{rsVal}</td>
                          <td style={{ border: '1px solid #1e3a8a', padding: '6px 2px', textAlign: 'right', fontSize: '11px' }}>{pVal > 0 ? pVal : ''}</td>
                        </tr>
                      );
                    })}

                    {/* Minimum height spacing rows */}
                    {(!order.items || order.items.length < 2) && (
                      <tr style={{ height: '32px' }}>
                        <td style={{ border: '1px solid #1e3a8a', padding: '6px' }}>&nbsp;</td>
                        <td style={{ border: '1px solid #1e3a8a', padding: '6px' }}>&nbsp;</td>
                        <td style={{ border: '1px solid #1e3a8a', padding: '6px' }}>&nbsp;</td>
                        <td style={{ border: '1px solid #1e3a8a', padding: '6px' }}>&nbsp;</td>
                        <td style={{ border: '1px solid #1e3a8a', padding: '6px' }}>&nbsp;</td>
                      </tr>
                    )}

                    {/* Grid Footer Rows: Total, Advance, Due INSIDE the table grid */}
                    <tr>
                      <td colSpan="3" style={{ border: '1px solid #1e3a8a', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>Total</td>
                      <td style={{ border: '1px solid #1e3a8a', padding: '6px 4px', textAlign: 'right', fontWeight: 'bold' }}>{Math.floor(totalVal)}</td>
                      <td style={{ border: '1px solid #1e3a8a', padding: '6px 2px', textAlign: 'right', fontSize: '11px' }}>{Math.round((totalVal - Math.floor(totalVal)) * 100) || ''}</td>
                    </tr>
                    <tr>
                      <td colSpan="3" style={{ border: '1px solid #1e3a8a', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>Advance</td>
                      <td style={{ border: '1px solid #1e3a8a', padding: '6px 4px', textAlign: 'right' }}>{advanceVal > 0 ? Math.floor(advanceVal) : ''}</td>
                      <td style={{ border: '1px solid #1e3a8a', padding: '6px 2px', textAlign: 'right', fontSize: '11px' }}>{advanceVal > 0 && Math.round((advanceVal - Math.floor(advanceVal)) * 100) ? Math.round((advanceVal - Math.floor(advanceVal)) * 100) : ''}</td>
                    </tr>
                    <tr>
                      <td colSpan="3" style={{ border: '1px solid #1e3a8a', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>Due</td>
                      <td style={{ border: '1px solid #1e3a8a', padding: '6px 4px', textAlign: 'right', fontWeight: 'bold' }}>{dueVal > 0 ? Math.floor(dueVal) : ''}</td>
                      <td style={{ border: '1px solid #1e3a8a', padding: '6px 2px', textAlign: 'right', fontSize: '11px' }}>{dueVal > 0 && Math.round((dueVal - Math.floor(dueVal)) * 100) ? Math.round((dueVal - Math.floor(dueVal)) * 100) : ''}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Area */}
            <div className="bill-footer-flex">
               <div style={{ flex: 1 }}>
                 <p style={{ margin: '0 0 6px 0' }}>Date of Delivery ....................................</p>
                 <p style={{ margin: '4px 0 2px 0', fontSize: '11px' }}>N.B. : {SHOP_DETAILS.terms1 || 'Shop owner will not be responsible if material is not taken within a month.'}</p>
                 <p style={{ margin: '0', fontSize: '11px' }}>{SHOP_DETAILS.terms2 || 'Complaints should be accepted after three days of delivery.'}</p>
               </div>
               <div style={{ width: '140px', textAlign: 'center' }}>
                  <div style={{ borderTop: '1px solid #1e3a8a', paddingTop: '4px', fontSize: '12px' }}>
                    Signature
                  </div>
               </div>
            </div>

            <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
               <p style={{ margin: 0 }}>WEDNESDAY HALF & THURSDAY FULL CLOSED</p>
            </div>

            {/* Barcode Output */}
            <div className="barcode-svg-container" style={{ textAlign: 'center', marginTop: '16px' }}>
              <svg ref={barcodeRef} style={{ maxWidth: '180px' }}></svg>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};


