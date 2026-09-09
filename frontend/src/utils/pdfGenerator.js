import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './formatters';
import { SHOP_DETAILS } from '../config/constants';

const drawHeader = (doc, no, dateStr) => {
  doc.setTextColor(30, 58, 138); // Dark Blue text mimicking the ink
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`No. ${no || '_____'}`, 14, 15);
  doc.text(`Date : ${dateStr || new Date().toLocaleDateString()}`, 160, 15);

  doc.setFontSize(24);
  doc.text(SHOP_DETAILS.name, 105, 25, { align: 'center' });

  doc.setFontSize(11);
  doc.text(SHOP_DETAILS.tagline, 105, 31, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(SHOP_DETAILS.address, 105, 36, { align: 'center' });
  if (SHOP_DETAILS.email) doc.text(`E-mail : ${SHOP_DETAILS.email}`, 105, 41, { align: 'center' });
  doc.text(`Ph. : ${SHOP_DETAILS.phone}`, 105, 46, { align: 'center' });

  doc.setDrawColor(30, 58, 138);
  doc.line(14, 50, 196, 50);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(14, 52, 196, 52);
  doc.setLineDashPattern([], 0); // reset
};

const drawFooter = (doc, finalY, advance, due) => {
  doc.setTextColor(30, 58, 138);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  doc.text(`Date of Delivery ...............................`, 80, finalY + 8);
  
  doc.setFontSize(8);
  doc.text(`N.B. : ${SHOP_DETAILS.terms1}`, 80, finalY + 14);
  doc.text(`          ${SHOP_DETAILS.terms2}`, 80, finalY + 18);

  doc.setFont('helvetica', 'bold');
  doc.text(SHOP_DETAILS.footerNote, 105, finalY + 25, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.line(160, finalY + 35, 196, finalY + 35);
  doc.text('Signature', 170, finalY + 40);
};

// Helper to build jsPDF document for Invoice
export const buildInvoicePDFDoc = (order) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawHeader(doc, order.invoiceNo || order.bookingNo || order.id, order.date || order.bookingDate);

  const totalVal = order.total !== undefined ? Number(order.total) : (order.totalAmount !== undefined ? Number(order.totalAmount) : 0);
  
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

  const isRawMaterialBill = order.saleType === 'raw_material' || order.orderType === 'RAW_MATERIAL' || order.type === 'PURCHASE_ORDER';

  // Customer Details
  doc.setTextColor(30, 58, 138);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Phone : ${order.customerPhone || '________________'}`, 14, 58);
  doc.text(`Name : ${order.customerName || 'Walk-in Retail Customer'}`, 80, 58);
  doc.text(`Address : ${order.customerAddress || '____________________________________'}`, 80, 65);

  // Left Column list (Work Types Checkboxes - Product Selling / Booking Bills ONLY)
  if (!isRawMaterialBill) {
    const leftItems = ['Ari', 'Salma', 'Chumki', 'Gujrati', 'Ripu', 'P. Ko', 'Falls', 'Polish', 'Fabrick', 'Khatha', 'Embrodory', 'Dry'];
    let yPos = 72;
    leftItems.forEach(item => {
      const isChecked = Array.isArray(order.workTypes) && order.workTypes.includes(item);
      doc.setFont('helvetica', isChecked ? 'bold' : 'normal');
      doc.text(`${item} - ${isChecked ? 'v' : ''}`, 14, yPos);
      yPos += 7.5;
    });
  }

  // Items Table (Right side for product bills, Full width for raw material bills)
  const tableRows = (order.items || []).map((item) => {
    const qty = item.quantity || item.qty || 1;
    const rate = (item.price || item.unitPrice || 0);
    const itemTotal = item.total !== undefined ? item.total : rate * qty;
    const rsVal = Math.floor(itemTotal);
    const pVal = Math.round((itemTotal - rsVal) * 100);
    return [
      item.name,
      qty,
      rate > 0 ? rate.toFixed(0) : '',
      rsVal > 0 ? rsVal.toString() : '',
      pVal > 0 ? pVal.toString() : ''
    ];
  });

  const totalRs = Math.floor(totalVal);
  const totalP = Math.round((totalVal - totalRs) * 100);
  const advRs = advanceVal > 0 ? Math.floor(advanceVal) : '';
  const advP = advanceVal > 0 && Math.round((advanceVal - Math.floor(advanceVal)) * 100) ? Math.round((advanceVal - Math.floor(advanceVal)) * 100) : '';
  const dueRs = dueVal > 0 ? Math.floor(dueVal) : '';
  const dueP = dueVal > 0 && Math.round((dueVal - Math.floor(dueVal)) * 100) ? Math.round((dueVal - Math.floor(dueVal)) * 100) : '';

  autoTable(doc, {
    startY: 72,
    margin: { left: isRawMaterialBill ? 14 : 75, right: 14 },
    head: [isRawMaterialBill ? ['Fabric Particulars', 'Meters (m)', 'Rate / m', 'Rs.', 'P.'] : ['Particulars', 'Qty', 'Rate', 'Rs.', 'P.']],
    body: tableRows.length ? tableRows : [['Standard Particular', '1', totalVal.toFixed(0), Math.floor(totalVal).toString(), '']],
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [30, 58, 138],
      lineColor: [30, 58, 138],
      lineWidth: 0.3,
      halign: 'center',
      fontStyle: 'bold'
    },
    bodyStyles: {
      textColor: [30, 58, 138],
      lineColor: [30, 58, 138],
      lineWidth: 0.3,
      minCellHeight: 7
    },
    columnStyles: {
      0: { cellWidth: isRawMaterialBill ? 90 : 56 },
      1: { cellWidth: isRawMaterialBill ? 22 : 14, halign: 'center' },
      2: { cellWidth: isRawMaterialBill ? 22 : 18, halign: 'right' },
      3: { cellWidth: isRawMaterialBill ? 22 : 18, halign: 'right' },
      4: { cellWidth: 10, halign: 'right' }
    },
    foot: [
      [{ content: 'Total', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } }, totalRs ? totalRs.toString() : '', totalP ? totalP.toString() : ''],
      [{ content: 'Advance', colSpan: 3, styles: { halign: 'right' } }, advRs ? advRs.toString() : '', advP ? advP.toString() : ''],
      [{ content: 'Due', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } }, dueRs ? dueRs.toString() : '', dueP ? dueP.toString() : '']
    ],
    footStyles: {
      fillColor: [255, 255, 255],
      textColor: [30, 58, 138],
      lineColor: [30, 58, 138],
      lineWidth: 0.3,
      fontStyle: 'normal'
    }
  });

  drawFooter(doc, doc.lastAutoTable.finalY, advanceVal, dueVal);
  return doc;
};

// 1. Generate & Save Invoice PDF (Product Sales & Order Bookings)
export const exportInvoicePDF = (order) => {
  const doc = buildInvoicePDFDoc(order);
  const billNo = order.invoiceNo || order.bookingNo || order.id || '000';
  doc.save(`Invoice_${billNo}.pdf`);
};

// Generate Invoice PDF File/Blob Object for Sharing
export const generateInvoicePDFBlob = (order) => {
  const doc = buildInvoicePDFDoc(order);
  const billNo = order.invoiceNo || order.bookingNo || order.id || '000';
  const fileName = `Invoice_${billNo}.pdf`;
  const blob = doc.output('blob');
  const file = new File([blob], fileName, { type: 'application/pdf' });
  return { blob, file, fileName };
};

// 2. Generate Tailor Job Card
export const exportTailorJobCardPDF = (booking, measurements) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawHeader(doc, booking.bookingNo || booking.id, formatDate(booking.date || booking.bookingDate));

  const totalVal = Number(booking.totalAmount !== undefined ? booking.totalAmount : (booking.total !== undefined ? booking.total : 0));
  const advanceVal = Number(booking.advancePaid !== undefined ? booking.advancePaid : (booking.advance !== undefined ? booking.advance : totalVal));
  const dueVal = Number(booking.balanceDue !== undefined ? booking.balanceDue : Math.max(0, totalVal - advanceVal));

  // Customer Details
  doc.setTextColor(30, 58, 138);
  doc.setFontSize(10);
  doc.text(`Name : ${booking.customerName || '______________________________________'}`, 80, 60);
  doc.text(`Phone : ${booking.customerPhone || '______________________________________'}`, 80, 68);

  // Left Column Measurements (Matching POS Sizing Specs)
  const posMeasurementItems = [
    { label: 'Length', key: 'length' },
    { label: 'H.B.L.', key: 'hbl' },
    { label: 'Chest', key: 'chest' },
    { label: 'Waist', key: 'waist' },
    { label: 'Shoulder', key: 'shoulder' },
    { label: 'Sleeve', key: 'sleeve' },
    { label: 'Muhuri', key: 'muhuri' },
    { label: 'F.Neck', key: 'fNeck' },
    { label: 'B.P.', key: 'bp' },
    { label: 'B.Neck', key: 'bNeck' },
    { label: 'Thigh', key: 'thigh' },
    { label: 'Armpit', key: 'armpit' },
    { label: 'Hai', key: 'hai' },
    { label: 'Hip', key: 'hip' },
    { label: 'Lining', key: 'lining' },
    { label: 'Demu', key: 'demu' },
    { label: 'Knee', key: 'knee' },
    { label: 'Gher', key: 'gher' },
    { label: 'Side', key: 'side' },
    { label: 'Secom', key: 'secom' }
  ];
  let yPos = 70;
  doc.setFontSize(8.5);
  posMeasurementItems.forEach(item => {
    const val = (measurements && (measurements[item.key] || measurements[item.label] || measurements[item.key.toLowerCase()])) || '';
    doc.text(`${item.label} - ${val}`, 14, yPos);
    yPos += 5.5;
  });

  // Work Type checkboxes
  const check = (work) => (booking.workTypes && booking.workTypes.includes(work)) ? '[v] ' + work : '[ ] ' + work;

  autoTable(doc, {
    startY: 75,
    margin: { left: 80, right: 14 },
    head: [['Particulars', '', '', '', 'Rs.', 'P.']],
    body: [
      [{ content: 'Work Required:', colSpan: 6 }],
      [{ content: check('Ari'), colSpan: 1 }, { content: check('Salma'), colSpan: 1 }, { content: check('Chumki'), colSpan: 1 }, { content: check('Gujrati'), colSpan: 1 }, '', ''],
      [{ content: check('Ripu'), colSpan: 1 }, { content: check('P. Ko'), colSpan: 1 }, { content: check('Falls'), colSpan: 1 }, { content: check('Polish'), colSpan: 1 }, '', ''],
      [{ content: check('Fabrick'), colSpan: 1 }, { content: check('Khatha'), colSpan: 1 }, { content: check('Embrodory'), colSpan: 1 }, { content: check('Dry'), colSpan: 1 }, '', ''],
      [{ content: 'Making Charge', colSpan: 4, styles: { halign: 'right' } }, '', ''],
      [{ content: 'Total', colSpan: 4, styles: { halign: 'right' } }, totalVal.toFixed(2), ''],
      [{ content: 'Advance', colSpan: 4, styles: { halign: 'right' } }, advanceVal.toFixed(2), ''],
      [{ content: 'Due', colSpan: 4, styles: { halign: 'right' } }, dueVal.toFixed(2), '']
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      lineColor: [30, 58, 138],
      lineWidth: 0.3,
      halign: 'center'
    },
    bodyStyles: {
      textColor: [30, 58, 138],
      lineColor: [30, 58, 138],
      lineWidth: 0.3,
      minCellHeight: 8
    },
    columnStyles: {
      4: { cellWidth: 20 },
      5: { cellWidth: 11 }
    }
  });

  drawFooter(doc, doc.lastAutoTable.finalY, advanceVal, dueVal);
  doc.save(`JobCard_${booking.bookingNo || booking.id}.pdf`);
};

// 3. Keep Employee Salary Slip mostly same but with new Shop Name
export const exportSalarySlipPDF = (employee, salaryData) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(SHOP_DETAILS.name.toUpperCase(), 14, 16);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`MONTHLY SALARY PAYSLIP - ${salaryData.month || 'Current Month'}`, 14, 24);

  // Quick fallback content
  doc.setTextColor(0, 0, 0);
  doc.text(`Employee Name: ${employee.name}`, 14, 40);
  doc.text(`Net Pay: ${formatCurrency(salaryData.netPay)}`, 14, 50);
  
  doc.save(`Payslip_${employee.empId || employee.id}.pdf`);
};

// 4. Generate Raw Material Purchase Order PDF (No Work Types Checkboxes!)
export const exportPurchaseOrderPDF = (po) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawHeader(doc, po.id, po.orderDate);

  const totalVal = Number(po.total || 0);
  const paidVal = Number(po.paidAmount || 0);
  const dueVal = Math.max(0, totalVal - paidVal);

  // Supplier Details (Full Width Header)
  doc.setTextColor(30, 58, 138);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`RAW MATERIAL PURCHASE ORDER / INWARD MATERIAL BILL`, 14, 58);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Supplier / Mill : ${po.vendorName || 'Textile Supplier'}`, 14, 65);
  doc.text(`Supplier ID : ${po.vendorId || 'VEN-001'}`, 14, 72);
  doc.text(`Order Date : ${po.orderDate || ''}`, 130, 65);
  doc.text(`Expected Delivery : ${po.expectedDate || ''}`, 130, 72);

  // Raw Material Line Items Table (Full Width: Left 14 to Right 14 - NO Checkboxes!)
  const tableRows = (po.items || []).map((item) => [
    item.name,
    item.qty || item.quantity || 1,
    (item.unitPrice || item.price || 0).toFixed(2),
    ((item.unitPrice || item.price || 0) * (item.qty || item.quantity || 1)).toFixed(2),
    ''
  ]);

  autoTable(doc, {
    startY: 78,
    margin: { left: 14, right: 14 },
    head: [['Raw Material Particulars / Specifications', 'Qty / Rolls', 'Rate per Unit', 'Rs.', 'P.']],
    body: tableRows.length ? tableRows : [['Raw Material / Fabric Roll Procurement', '1', totalVal.toFixed(2), totalVal.toFixed(2), '']],
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [30, 58, 138],
      lineColor: [30, 58, 138],
      lineWidth: 0.3,
      halign: 'center'
    },
    bodyStyles: {
      textColor: [30, 58, 138],
      lineColor: [30, 58, 138],
      lineWidth: 0.3,
      minCellHeight: 8
    },
    columnStyles: {
      0: { cellWidth: 95 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 12 }
    },
    foot: [
      [{ content: 'Total Purchase Amount', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } }, totalVal.toFixed(2), ''],
      [{ content: 'Amount Paid', colSpan: 3, styles: { halign: 'right' } }, paidVal.toFixed(2), ''],
      [{ content: 'Balance Payable', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } }, dueVal.toFixed(2), '']
    ],
    footStyles: {
      fillColor: [255, 255, 255],
      textColor: [30, 58, 138],
      lineColor: [30, 58, 138],
      lineWidth: 0.3,
      fontStyle: 'normal'
    }
  });

  drawFooter(doc, doc.lastAutoTable.finalY, paidVal, dueVal);
  doc.save(`PO_${po.id}.pdf`);
};
