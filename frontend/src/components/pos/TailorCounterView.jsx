import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SHOP_DETAILS } from '../../config/constants';
import { formatCurrency } from '../../utils/formatters';
import { SearchableSelect } from '../common/SearchableSelect';
import { ReceiptModal } from './ReceiptModal';
import { CustomerModal } from '../common/CustomerModal';
import { Modal } from '../common/Modal';
import {
  Printer,
  FileText,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  Calendar,
  Phone,
  User,
  Scissors,
  DollarSign,
  Smartphone,
  ChevronDown
} from 'lucide-react';

export const TailorCounterView = ({ onNavigateToHistory }) => {
  const {
    customers = [],
    products = [],
    employees = [],
    createOrderBooking,
    completeSale,
    saveMeasurementProfile,
    measurements = [],
    orderBookings = [],
    sales = [],
    currency,
    showToast
  } = useApp();

  // Load draft POS billing form state from localStorage
  const loadDraft = () => {
    try {
      const saved = localStorage.getItem('tc_pos_billing_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.items)) {
          parsed.items = parsed.items.filter(
            (i) => i.name && i.name !== 'Selected Fabric/Garment' && i.name !== 'Custom Stitching Service'
          );
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse tc_pos_billing_draft', e);
    }
    return null;
  };
  const draftData = loadDraft();

  // Service Mode State ('custom_dress' or 'raw_material')
  const [serviceMode, setServiceMode] = useState(() => draftData?.serviceMode || 'custom_dress');
  // Raw Material Sub-Mode ('instant' for In-Stock Sale or 'booking' for Out-of-Stock Fabric Pre-Order)
  const [rawMaterialSaleType, setRawMaterialSaleType] = useState(() => draftData?.rawMaterialSaleType || 'instant');

  // Mobile Tab State ('bill' or 'sizing')
  const [mobileTab, setMobileTab] = useState('bill');

  // Customer & Header Info
  const [selectedCustomerId, setSelectedCustomerId] = useState(() => draftData?.selectedCustomerId || '');
  const [customerName, setCustomerName] = useState(() => draftData?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(() => draftData?.customerPhone || '');
  const [customerAddress, setCustomerAddress] = useState(() => draftData?.customerAddress || '');
  const [billNo, setBillNo] = useState(() => draftData?.billNo || `68${Math.floor(Math.random() * 90 + 10)}`);
  const [billDate, setBillDate] = useState(() => draftData?.billDate || new Date().toISOString().split('T')[0]);
  const [trialDate, setTrialDate] = useState(() => draftData?.trialDate || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState(() => draftData?.deliveryDate || new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]);

  // 3 Mandatory Core Jobs (Cutting, Stitching, Hemming) State
  const [coreJobs, setCoreJobs] = useState(() => draftData?.coreJobs || {
    cutting: { assignedEmployee: 'Suresh Kumar Sharma (Cutter)', incentive: 50 },
    stitching: { assignedEmployee: 'Master Harun Rasheed (Tailor)', incentive: 150 },
    hemming: { assignedEmployee: 'Fatima Zahra (Finisher)', incentive: 30 }
  });

  // Single Employee Assignment Mode State for 3 Core Jobs
  const [isSingleEmployeeMode, setIsSingleEmployeeMode] = useState(() => draftData?.isSingleEmployeeMode || false);
  const [singleEmployeeName, setSingleEmployeeName] = useState(() => draftData?.singleEmployeeName || '');
  const [singleEmployeeIncentive, setSingleEmployeeIncentive] = useState(() => draftData?.singleEmployeeIncentive !== undefined ? draftData.singleEmployeeIncentive : 230);
  const [previousCoreJobs, setPreviousCoreJobs] = useState(() => draftData?.previousCoreJobs || null);

  const applySingleEmployeeToCoreJobs = (empName, totalInc) => {
    const incVal = Number(totalInc) || 0;
    const cutInc = Math.round(incVal * 0.2);
    const stitchInc = Math.round(incVal * 0.65);
    const hemInc = Math.max(0, incVal - cutInc - stitchInc);

    setCoreJobs({
      cutting: { assignedEmployee: empName, incentive: cutInc },
      stitching: { assignedEmployee: empName, incentive: stitchInc },
      hemming: { assignedEmployee: empName, incentive: hemInc }
    });
  };

  const handleToggleSingleEmployeeMode = (enable) => {
    if (enable) {
      setPreviousCoreJobs(coreJobs);
      setIsSingleEmployeeMode(true);
      if (singleEmployeeName) {
        applySingleEmployeeToCoreJobs(singleEmployeeName, singleEmployeeIncentive);
      }
    } else {
      if (previousCoreJobs) {
        setCoreJobs(previousCoreJobs);
      }
      setIsSingleEmployeeMode(false);
    }
  };

  const handleSingleEmployeeChange = (empName) => {
    setSingleEmployeeName(empName);
    if (empName) {
      applySingleEmployeeToCoreJobs(empName, singleEmployeeIncentive);
    }
  };

  const handleSingleIncentiveChange = (val) => {
    const num = Number(val) || 0;
    setSingleEmployeeIncentive(num);
    if (singleEmployeeName) {
      applySingleEmployeeToCoreJobs(singleEmployeeName, num);
    }
  };

  // Toggle to show/hide extra work assignment & incentive details
  const [showWorkAssignmentDetails, setShowWorkAssignmentDetails] = useState(false);

  // Extra Tailoring Work Assignment Details, Default Prices & Incentives
  const DEFAULT_WORK_PRICES = {
    Ari: 150,
    Salma: 120,
    Chumki: 100,
    Gujrati: 160,
    Ripu: 80,
    'P. Ko': 90,
    Falls: 70,
    Polish: 80,
    Fabrick: 100,
    Khatha: 180,
    Embrodory: 250,
    Dry: 80
  };

  const [workDetails, setWorkDetails] = useState(() => draftData?.workDetails || {
    Ari: { assignedEmployee: 'Farooq Ahmed (Craftsman)', incentive: 40, price: 150 },
    Salma: { assignedEmployee: '', incentive: 35, price: 120 },
    Chumki: { assignedEmployee: '', incentive: 30, price: 100 },
    Gujrati: { assignedEmployee: '', incentive: 45, price: 160 },
    Ripu: { assignedEmployee: '', incentive: 25, price: 80 },
    'P. Ko': { assignedEmployee: 'Rohan Verma (Finisher)', incentive: 30, price: 90 },
    Falls: { assignedEmployee: '', incentive: 20, price: 70 },
    Polish: { assignedEmployee: '', incentive: 25, price: 80 },
    Fabrick: { assignedEmployee: '', incentive: 30, price: 100 },
    Khatha: { assignedEmployee: '', incentive: 50, price: 180 },
    Embrodory: { assignedEmployee: '', incentive: 60, price: 250 },
    Dry: { assignedEmployee: '', incentive: 20, price: 80 }
  });

  // Available Staff List for Job & Work Assignments
  const availableEmployees = employees.length > 0
    ? employees.map(e => e.name || e.empName)
    : [
        'Master Harun Rasheed (Tailor)',
        'Suresh Kumar Sharma (Cutter)',
        'Fatima Zahra (Hemming & QC)',
        'Farooq Ahmed (Craftsman)',
        'Rohan Verma (Finisher)'
      ];

  // Sizing / Measurement Specs
  const [sizing, setSizing] = useState(() => draftData?.sizing || {
    length: '',
    hbl: '',
    chest: '',
    waist: '',
    shoulder: '',
    sleeve: '',
    muhuri: '',
    fNeck: '',
    bp: '',
    bNeck: '',
    thigh: '',
    armpit: '',
    hai: '',
    hip: '',
    lining: '',
    demu: '',
    knee: '',
    gher: '',
    side: '',
    secom: ''
  });

  // Alteration / Fixing Form State
  const [alterationDetails, setAlterationDetails] = useState(() => draftData?.alterationDetails || {
    source: 'shop',
    garmentType: '',
    description: ''
  });

  // Options list for Alteration Product Search dropdown
  const alterationProductOptions = React.useMemo(() => {
    const defaults = [
      'Dress Fitting & Alteration',
      'Suit / Blazer Alteration',
      'Pant / Trouser Alteration',
      'Shirt Alteration',
      'Kurta / Pajama Alteration',
      'Lehenga / Choli Alteration',
      'Blouse Alteration',
      'Gown / Anarkali Alteration',
      'Sherwani Alteration',
      'Saree Fall & Pico',
      'Zip / Runner Replacement',
      'Waist / Hem Adjustment'
    ];
    const dbProductNames = (products || []).map((p) => p.name).filter(Boolean);
    const combined = Array.from(new Set([...defaults, ...dbProductNames]));
    return combined.map((name) => ({ value: name, label: name }));
  }, [products]);

  const handleAlterationProductChange = (name) => {
    setAlterationDetails((prev) => ({ ...prev, garmentType: name }));
    if (serviceMode === 'alteration') {
      const matchedProd = (products || []).find((p) => p.name && p.name.toLowerCase() === (name || '').toLowerCase());
      setItems((prevItems) => {
        if (prevItems.length === 0) {
          return [{
            name: name || 'Dress Fitting & Alteration',
            qty: 1,
            rate: matchedProd?.price ? Number(matchedProd.price) : 150,
            total: matchedProd?.price ? Number(matchedProd.price) : 150
          }];
        }
        const copy = [...prevItems];
        const mainIdx = copy.findIndex((i) => !i.isOtherJobs);
        if (mainIdx !== -1) {
          const currentRate = copy[mainIdx].rate;
          const newRate = matchedProd?.price ? Number(matchedProd.price) : (currentRate || 150);
          const qty = Number(copy[mainIdx].qty) || 1;
          copy[mainIdx] = {
            ...copy[mainIdx],
            name: name || 'Dress Fitting & Alteration',
            rate: newRate,
            total: qty * newRate
          };
        } else {
          copy.unshift({
            name: name || 'Dress Fitting & Alteration',
            qty: 1,
            rate: matchedProd?.price ? Number(matchedProd.price) : 150,
            total: matchedProd?.price ? Number(matchedProd.price) : 150
          });
        }
        return copy;
      });
    }
  };

  // Selected Work Types Checkboxes
  const [selectedWorks, setSelectedWorks] = useState(() => draftData?.selectedWorks || []);
  const WORK_TYPES = [
    'Ari', 'Salma', 'Chumki', 'Gujrati', 'Ripu', 'P. Ko',
    'Falls', 'Polish', 'Fabrick', 'Khatha', 'Embrodory', 'Dry'
  ];

  // Bill Line Items Grid
  const [items, setItems] = useState(() => draftData?.items || []);
  const [makingCharge, setMakingCharge] = useState(() => draftData?.makingCharge !== undefined ? draftData.makingCharge : 0);
  const [advancePaid, setAdvancePaid] = useState(() => draftData?.advancePaid !== undefined ? draftData.advancePaid : 0);

  // Cleanup legacy placeholder items from current state on mount
  useEffect(() => {
    setItems((prev) =>
      prev.filter(
        (i) => i.name && i.name !== 'Selected Fabric/Garment' && i.name !== 'Custom Stitching Service'
      )
    );
  }, []);

  // Auto-save form draft to localStorage
  useEffect(() => {
    const draftPayload = {
      serviceMode,
      rawMaterialSaleType,
      selectedCustomerId,
      customerName,
      customerPhone,
      customerAddress,
      billNo,
      billDate,
      trialDate,
      deliveryDate,
      coreJobs,
      isSingleEmployeeMode,
      singleEmployeeName,
      singleEmployeeIncentive,
      previousCoreJobs,
      workDetails,
      sizing,
      alterationDetails,
      selectedWorks,
      items,
      makingCharge,
      advancePaid
    };
    localStorage.setItem('tc_pos_billing_draft', JSON.stringify(draftPayload));
  }, [
    serviceMode,
    rawMaterialSaleType,
    selectedCustomerId,
    customerName,
    customerPhone,
    customerAddress,
    billNo,
    billDate,
    trialDate,
    deliveryDate,
    coreJobs,
    isSingleEmployeeMode,
    singleEmployeeName,
    singleEmployeeIncentive,
    previousCoreJobs,
    workDetails,
    sizing,
    alterationDetails,
    selectedWorks,
    items,
    makingCharge,
    advancePaid
  ]);

  // Warn user before accidental page reload/unload when form has filled data
  useEffect(() => {
    const isDirty = Boolean(
      customerName.trim() ||
      customerPhone.trim() ||
      selectedWorks.length > 0 ||
      items.some((i) => (Number(i.rate) || 0) > 0 || (i.name && i.name !== 'Selected Fabric/Garment' && i.name !== 'Custom Stitching Service')) ||
      Object.values(sizing).some((v) => v !== '')
    );

    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have filled values in the bill form. Are you sure you want to refresh?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [customerName, customerPhone, selectedWorks, items, sizing]);

  // Quick Fabric / Product Pickers by Service Mode (Default 1 Meter minimum)
  const QUICK_DRESS_SERVICES = [
    { label: 'Chudidar / Salwar Kamiz', val: 'Salwar Kamiz Stitching', rate: 450, qty: 1 },
    { label: 'Blouse Stitching', val: 'Blouse Stitching Service', rate: 350, qty: 1 },
    { label: 'Nighty / Frock', val: 'Nighty / Frock Stitching', rate: 400, qty: 1 },
    { label: 'Falls & Hemming', val: 'Falls & Hemming Work', rate: 120, qty: 1 },
    { label: 'Bed Sheet / Parda', val: 'Bed Sheet / Parda Stitching', rate: 250, qty: 1 },
    { label: 'Dry Cleaning / Polish', val: 'Dry Cleaning & Polish Service', rate: 180, qty: 1 }
  ];

  const QUICK_RAW_MATERIALS = [
    { label: 'Cotton Fabric Reel (₹120/m)', val: 'Cotton Fabric Roll (Meter)', rate: 120, qty: 1 },
    { label: 'Teri Cotton Poplin (₹150/m)', val: 'Teri Cotton Poplin Than', rate: 150, qty: 1 },
    { label: 'Chicken Material (₹220/m)', val: 'Chicken Shiffon Material', rate: 220, qty: 1 },
    { label: 'Garden Silk Reel (₹280/m)', val: 'Garden Silk Fabric Reel', rate: 280, qty: 1 },
    { label: 'South Cotton Than (₹160/m)', val: 'South Cotton Material Than', rate: 160, qty: 1 },
    { label: 'Bombay Dying (₹190/m)', val: 'Bombay Dying Fabric Roll', rate: 190, qty: 1 },
    { label: 'Rayon Print (₹140/m)', val: 'Rayon Print Fabric Reel', rate: 140, qty: 1 },
    { label: 'Velvet Fabric (₹350/m)', val: 'Velvet Fabric Material', rate: 350, qty: 1 },
    { label: 'Lining Material (₹60/m)', val: 'Astar / Lining Fabric Than', rate: 60, qty: 1 }
  ];

  const QUICK_READY_MADE_PRODUCTS = [
    { label: 'Salwar Suit Set (Size L)', val: 'Readymade Salwar Suit Set (Size L)', rate: 850, qty: 1 },
    { label: 'Churidar Suit (Size M)', val: 'Readymade Churidar Suit (Size M)', rate: 750, qty: 1 },
    { label: 'Pre-stitched Kurti (Size XL)', val: 'Readymade Kurti (Size XL)', rate: 550, qty: 1 },
    { label: 'Readymade Blouse (Size 38)', val: 'Readymade Blouse (Size 38)', rate: 450, qty: 1 },
    { label: 'Readymade Nighty (Free Size)', val: 'Readymade Nighty (Free Size)', rate: 380, qty: 1 },
    { label: 'Sample Frock (Size M)', val: 'Readymade Sample Frock (Size M)', rate: 650, qty: 1 }
  ];

  // Stage Options for Custom Orders
  const CUSTOM_STAGES = [
    'Cutting stage',
    'Stitching stage',
    'Hemming stage',
    'QC stage',
    'Ready to Delivery stage'
  ];

  // Helper to mark order as Delivered
  const handleMarkDelivered = (order) => {
    if (window.confirm(`Are you sure you want to mark order #${order.bookingNo || order.invoiceNo || order.id} as DELIVERED?`)) {
      order.currentStage = 'Delivered';
      order.stage = 'Delivered';
      order.status = 'Delivered';
      showToast(`Order #${order.bookingNo || order.invoiceNo || order.id} marked as Delivered`, 'success');
    }
  };

  // Modals & Receipts
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Billing History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  // Sync Customer details (Name, Phone, Address) & measurements when customer is selected
  useEffect(() => {
    if (selectedCustomerId) {
      const cust = customers.find((c) => c.id === selectedCustomerId);
      if (cust) {
        setCustomerName(cust.name || '');
        setCustomerPhone(cust.phone || '');
        setCustomerAddress(cust.address || cust.city || '');

        const existingMeas = measurements.find((m) => m.customerId === selectedCustomerId || m.id === cust.measurementId);
        if (existingMeas?.specs) {
          setSizing((prev) => ({ ...prev, ...existingMeas.specs }));
        }
      }
    }
  }, [selectedCustomerId, customers, measurements]);

  const handleSizingChange = (field, val) => {
    let cleaned = val.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    setSizing((prev) => ({ ...prev, [field]: cleaned }));
  };

  const handleSaveMeasurements = async () => {
    if (!customerName) {
      showToast('Please enter customer name to save measurements.', 'warning');
      return;
    }
    await saveMeasurementProfile({
      customerId: selectedCustomerId || `CUST-TEMP-${Date.now()}`,
      customerName,
      customerPhone,
      specs: sizing
    });
    showToast(`Measurements saved for ${customerName}!`, 'success');
  };

  // Add Quick Product / Service Item to Bill (Default 1 Meter min)
  const handleAddQuickItem = (itemObj) => {
    const qty = itemObj.qty || 1;
    const rate = itemObj.rate || 200;
    const total = qty * rate;

    setItems((prev) => [
      ...prev,
      { name: itemObj.val || itemObj.name, qty, rate, total }
    ]);
    showToast(`Added "${itemObj.label || itemObj.val}" (${qty} ${serviceMode === 'raw_material' ? 'meter' : 'pc'}) to bill`, 'info');
  };

  const handleAddItemRow = () => {
    setItems((prev) => [...prev, { name: '', qty: 1, rate: 0, total: 0 }]);
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      let cleanVal = value;
      if (typeof value === 'string' && (field === 'rate' || field === 'qty')) {
        cleanVal = value.replace(/^0+(?=\d)/, '');
      }
      const qty = field === 'qty' ? Number(cleanVal) || 0 : Number(updated[index].qty) || 0;
      const rate = field === 'rate' ? Number(cleanVal) || 0 : Number(updated[index].rate) || 0;
      const total = qty * rate;

      updated[index] = {
        ...updated[index],
        [field]: cleanVal,
        total: field === 'qty' || field === 'rate' ? total : updated[index].total
      };
      return updated;
    });

    if (serviceMode === 'alteration' && field === 'name' && index === 0) {
      setAlterationDetails((prev) => ({ ...prev, garmentType: value }));
    }
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Auto-sync selected extra finishing jobs into bill items as "Other Jobs"
  useEffect(() => {
    if (serviceMode === 'raw_material') return;

    const extraWorkTotal = selectedWorks.reduce((sum, w) => {
      const p = workDetails[w]?.price !== undefined ? Number(workDetails[w].price) : (DEFAULT_WORK_PRICES[w] || 0);
      return sum + (isNaN(p) ? 0 : p);
    }, 0);

    setItems((prevItems) => {
      const existingIdx = prevItems.findIndex(
        (i) => i.isOtherJobs || (i.name && i.name.startsWith('Other Jobs'))
      );

      if (selectedWorks.length === 0 || extraWorkTotal === 0) {
        if (existingIdx !== -1) {
          return prevItems.filter((_, idx) => idx !== existingIdx);
        }
        return prevItems;
      }

      const itemTitle = `Other Jobs (${selectedWorks.join(', ')})`;
      const updatedLine = {
        name: itemTitle,
        qty: 1,
        rate: extraWorkTotal,
        total: extraWorkTotal,
        isOtherJobs: true
      };

      if (existingIdx !== -1) {
        const copy = [...prevItems];
        copy[existingIdx] = updatedLine;
        return copy;
      } else {
        return [...prevItems, updatedLine];
      }
    });
  }, [selectedWorks, workDetails, serviceMode]);

  // Calculations
  const itemsSubtotal = items.reduce((sum, item) => sum + (Number(item.total) || (Number(item.qty || 1) * Number(item.rate || 0)) || 0), 0);
  const totalAmount = itemsSubtotal + Number(makingCharge || 0);
  const advanceVal = Number(advancePaid || 0);
  const dueBalance = Math.max(0, totalAmount - advanceVal);

  // Submit Order & Print Bill
  const handleRecordPayment = async () => {
    if (!customerName || !customerName.trim()) {
      showToast('Please provide Customer Name before creating bill.', 'danger');
      return;
    }

    const validItems = items.filter((i) => i.name && i.name.trim() !== '');
    if (validItems.length === 0 && selectedWorks.length === 0 && Number(makingCharge || 0) === 0 && !alterationDetails.garmentType) {
      showToast('Please add at least one product or service item to the bill before generating.', 'danger');
      return;
    }

    const isRawMaterial = serviceMode === 'raw_material';
    const isRawMaterialInstant = isRawMaterial && rawMaterialSaleType === 'instant';
    const isRawMaterialBooking = isRawMaterial && rawMaterialSaleType === 'booking';
    const isAlteration = serviceMode === 'alteration';
    const saleTypeVal = isRawMaterial ? 'raw_material' : 'finished_product';

    // Compile Employee Assignments (3 Core Mandatory Jobs + Selected Work Types)
    const compiledAssignedEmployees = isRawMaterial ? [] : [
      { jobType: 'Cutting Job', employeeName: coreJobs.cutting.assignedEmployee || 'Unassigned', incentive: coreJobs.cutting.incentive },
      { jobType: 'Stitching Job', employeeName: coreJobs.stitching.assignedEmployee || 'Unassigned', incentive: coreJobs.stitching.incentive },
      { jobType: 'Hemming & Finishing Job', employeeName: coreJobs.hemming.assignedEmployee || 'Unassigned', incentive: coreJobs.hemming.incentive },
      ...selectedWorks.map(w => ({
        jobType: `${w} Work`,
        employeeName: workDetails[w]?.assignedEmployee || 'Unassigned',
        incentive: workDetails[w]?.incentive || 0
      }))
    ];

    const actualAdvancePaid = isRawMaterialInstant ? totalAmount : advanceVal;
    const actualBalanceDue = isRawMaterialInstant ? 0 : dueBalance;

    const orderData = {
      id: `INV-${billNo}`,
      bookingNo: billNo,
      invoiceNo: `INV-${billNo}`,
      customerName,
      customerPhone,
      customerAddress,
      date: billDate,
      bookingDate: billDate,
      trialDate,
      deliveryDate,
      items: items.map((i) => ({
        name: i.name || (isRawMaterial ? 'Fabric Material Roll (Meter)' : 'Custom Garment Service'),
        quantity: i.qty || 1,
        price: Number(i.rate) || 0,
        total: Number(i.total) || (Number(i.qty || 1) * Number(i.rate || 0)) || 0
      })),
      total: totalAmount,
      totalAmount,
      advance: actualAdvancePaid,
      advancePaid: actualAdvancePaid,
      due: actualBalanceDue,
      balanceDue: actualBalanceDue,
      workTypes: (isRawMaterial || isAlteration) ? [] : selectedWorks,
      assignedEmployees: isAlteration ? [] : compiledAssignedEmployees,
      paymentMethod: 'CASH',
      status: (isRawMaterialInstant || actualBalanceDue === 0) ? 'Completed' : 'Booked',
      saleType: saleTypeVal,
      orderType: isAlteration ? 'ALTERATION' : (isRawMaterialBooking ? 'RAW_MATERIAL_BOOKING' : (isRawMaterial ? 'RAW_MATERIAL' : 'PRODUCT_BOOKING'))
    };

    if (isRawMaterialInstant) {
      // In-Stock Instant Sale: full payment & immediate stock adjustment
      await completeSale({
        customerId: selectedCustomerId || 'WALK-IN',
        customerName,
        customerPhone,
        customerAddress,
        items: items.map(i => ({
          productId: 'RAW-FABRIC',
          name: i.name,
          qty: i.qty,
          price: i.rate,
          total: i.total || (i.qty * i.rate)
        })),
        totalAmount,
        amountPaid: totalAmount,
        paymentMethod: 'CASH',
        saleType: 'raw_material'
      });
    } else if (isRawMaterialBooking) {
      // Out-Of-Stock Fabric Pre-Order: Advance deposit & delivery date booked in pipeline
      await createOrderBooking({
        customerId: selectedCustomerId || 'WALK-IN',
        customerName,
        customerPhone,
        customerAddress,
        garmentType: `Fabric Pre-Order: ${items[0]?.name || 'Raw Material Reel'}`,
        fabricDetails: items.map((i) => `${i.name} (${i.qty}m @ ₹${i.rate})`).join(', '),
        deliveryDate,
        totalAmount,
        advancePaid: actualAdvancePaid,
        orderType: 'RAW_MATERIAL_BOOKING',
        status: 'Awaiting Supplier Inward'
      });
    } else if (isAlteration) {
      // Alteration / Fixing Booking
      await createOrderBooking({
        customerId: selectedCustomerId || 'WALK-IN',
        customerName,
        customerPhone,
        customerAddress,
        garmentType: alterationDetails.garmentType || 'Garment Alteration',
        fabricDetails: `Source: ${alterationDetails.source === 'shop' ? 'Our Shop' : 'Outside'}`,
        trialDate,
        deliveryDate,
        totalAmount,
        advancePaid: actualAdvancePaid,
        specs: alterationDetails,
        // Initialise custom stages for alterations
        currentStage: 'Received',
        stage: 'Received',
        status: 'Received',
        orderType: 'ALTERATION',
        notes: alterationDetails.description
      });
    } else {
      // Custom Dress Order Booking: Sizing specs, 3 core jobs, trial/delivery dates & advance deposit
      await createOrderBooking({
        customerId: selectedCustomerId || 'WALK-IN',
        customerName,
        customerPhone,
        customerAddress,
        garmentType: items[0]?.name || 'Tailored Garment',
        fabricDetails: items.map((i) => i.name).join(', '),
        trialDate,
        deliveryDate,
        totalAmount,
        advancePaid: actualAdvancePaid,
        workTypes: selectedWorks,
        assignedEmployees: compiledAssignedEmployees,
        specs: sizing,
        // Initialise stage for custom orders
        currentStage: 'Cutting stage',
        stage: 'Cutting stage',
        status: 'Cutting stage'
      });
    }

    setReceiptOrder(orderData);
    setIsReceiptOpen(true);
    localStorage.removeItem('tc_pos_billing_draft');
    showToast(`${isRawMaterialBooking ? 'Fabric Pre-Order' : (isRawMaterialInstant ? 'Fabric Instant Sale' : 'Custom Dress Bill')} #${billNo} recorded successfully!`, 'success');
  };
  const finishingWorksComponent = (
    <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ fontSize: '12px', fontWeight: 800, color: '#1e3a8a' }}>
          Tailoring & Finishing Work Included:
        </div>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => setShowWorkAssignmentDetails(!showWorkAssignmentDetails)}
          style={{ fontSize: '11px', padding: '3px 8px', background: showWorkAssignmentDetails ? '#e2e8f0' : '#1e3a8a', color: showWorkAssignmentDetails ? '#334155' : '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', fontWeight: 700 }}
        >
          {showWorkAssignmentDetails ? '👁️ Hide Staff & Incentives' : '⚙️ Show Staff & Incentives'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {[WORK_TYPES.slice(0, 6), WORK_TYPES.slice(6, 12)].map((columnItems, colIdx) => (
          <div key={colIdx} style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
            {columnItems.map((work) => {
              const isChecked = selectedWorks.includes(work);
              const workPrice = workDetails[work]?.price !== undefined ? workDetails[work].price : (DEFAULT_WORK_PRICES[work] || 100);
              return (
                <div key={work} style={{ background: isChecked ? '#f0f9ff' : '#f8fafc', padding: '6px 8px', borderRadius: '6px', border: isChecked ? '1px solid #93c5fd' : '1px solid #cbd5e1', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', color: isChecked ? '#1e3a8a' : '#334155', flex: 1, minWidth: 0 }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedWorks([...selectedWorks, work]);
                            if (!showWorkAssignmentDetails) {
                              const globalTask = products.find(p => p.category === 'Finishing Task' && p.name === work);
                              if (globalTask) {
                                setWorkDetails(prev => ({
                                  ...prev,
                                  [work]: {
                                    ...(prev[work] || {}),
                                    assignedEmployee: globalTask.assignedEmployee && globalTask.assignedEmployee !== 'Not Assigned' ? globalTask.assignedEmployee : (prev[work]?.assignedEmployee || ''),
                                    incentive: globalTask.baseIncentive || (prev[work]?.incentive || 30),
                                    price: prev[work]?.price !== undefined ? prev[work].price : (DEFAULT_WORK_PRICES[work] || 100)
                                  }
                                }));
                              }
                            }
                          } else {
                            setSelectedWorks(selectedWorks.filter((w) => w !== work));
                          }
                        }}
                        style={{ accentColor: '#1e3a8a' }}
                      />
                      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{work}</span>
                    </label>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} title="Extra Work Price charged to customer">
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>₹</span>
                      <input
                        type="number"
                        value={workPrice}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setWorkDetails(prev => ({
                            ...prev,
                            [work]: { ...(prev[work] || {}), price: val }
                          }));
                        }}
                        style={{
                          width: '52px',
                          padding: '2px 4px',
                          fontSize: '11px',
                          borderRadius: '4px',
                          border: isChecked ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                          fontWeight: 700,
                          textAlign: 'right',
                          background: isChecked ? '#ffffff' : '#f1f5f9',
                          color: isChecked ? '#1e3a8a' : '#475569'
                        }}
                      />
                    </div>
                  </div>

                  {isChecked && showWorkAssignmentDetails && (
                    <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <select
                        value={workDetails[work]?.assignedEmployee || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWorkDetails(prev => ({
                            ...prev,
                            [work]: { ...(prev[work] || { incentive: 30 }), assignedEmployee: val }
                          }));
                        }}
                        style={{ width: '100%', padding: '3px 4px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      >
                        <option value="">-- Select Staff --</option>
                        {availableEmployees.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                      </select>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>Incentive (₹):</span>
                        <input
                          type="number"
                          value={workDetails[work]?.incentive || 0}
                          onChange={(e) => {
                            const inc = Number(e.target.value) || 0;
                            setWorkDetails(prev => ({
                              ...prev,
                              [work]: { ...(prev[work] || { assignedEmployee: '' }), incentive: inc }
                            }));
                          }}
                          style={{ width: '55px', padding: '2px 4px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 700, textAlign: 'right' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Top Shop Banner Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
          color: '#ffffff',
          padding: '16px 20px',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
              {SHOP_DETAILS.name || 'সোনা Ladies Own Tailors'}
            </h1>
            <span style={{ fontSize: '0.75rem', background: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
              GARMENT ERP
            </span>
          </div>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', opacity: 0.9, fontWeight: 500 }}>
            "{SHOP_DETAILS.tagline || 'A UNIQUE WOMAN'}" • {SHOP_DETAILS.address}
          </p>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', opacity: 0.8 }}>
            Ph: {SHOP_DETAILS.phone} | Email: {SHOP_DETAILS.email}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn"
            onClick={() => {
              localStorage.removeItem('tc_pos_billing_draft');
              setBillNo(`68${Math.floor(Math.random() * 90 + 10)}`);
              setSelectedCustomerId('');
              setCustomerName('');
              setCustomerPhone('');
              setCustomerAddress('');
              setIsSingleEmployeeMode(false);
              setSingleEmployeeName('');
              setSingleEmployeeIncentive(230);
              setPreviousCoreJobs(null);
              setItems([]);
              showToast('Created new blank bill', 'info');
            }}
            style={{ background: '#ffffff', color: '#1e3a8a', fontWeight: 700, fontSize: '0.85rem' }}
          >
            + Create New Bill
          </button>

          <button
            className="btn"
            onClick={() => {
              if (onNavigateToHistory) onNavigateToHistory();
              setIsHistoryModalOpen(true);
            }}
            style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', fontWeight: 700, fontSize: '0.85rem', border: '1px solid rgba(255, 255, 255, 0.4)' }}
          >
            📋 Billing History
          </button>
        </div>
      </div>

      {/* 2 Service Mode Switcher Bar */}
      <div
        style={{
          background: '#ffffff',
          padding: '10px 14px',
          borderBottom: '1px solid #e2e8f0',
          borderLeft: '1px solid #cbd5e1',
          borderRight: '1px solid #cbd5e1',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          flexWrap: 'wrap',
          justify: 'space-between'
        }}
      >
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Counter Service Mode:</span>
          <span style={{ fontSize: '0.75rem', background: serviceMode === 'alteration' ? '#ffedd5' : (serviceMode === 'custom_dress' ? '#e0f2fe' : (serviceMode === 'raw_material' ? '#d1fae5' : '#f3e8ff')), color: serviceMode === 'alteration' ? '#c2410c' : (serviceMode === 'custom_dress' ? '#0369a1' : (serviceMode === 'raw_material' ? '#047857' : '#7e22ce')), padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
            {serviceMode === 'alteration' ? '🪡 Mode 1: Alteration & Fixing' : (serviceMode === 'custom_dress' ? '👗 Mode 2: Custom Dress Stitching' : (serviceMode === 'raw_material' ? '✂️ Mode 3: Raw Material Sales (By Meter)' : '🛍️ Mode 4: Ready-Made Garments (With Size)'))}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flex: 1, maxWidth: '780px' }}>
          <button
            type="button"
            onClick={() => {
              setServiceMode('alteration');
              setMakingCharge(0);
              setAdvancePaid(0);
            }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: serviceMode === 'alteration' ? '2px solid #ea580c' : '1px solid #cbd5e1',
              background: serviceMode === 'alteration' ? '#ea580c' : '#f8fafc',
              color: serviceMode === 'alteration' ? '#ffffff' : '#334155',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '6px'
            }}
          >
            <span>🪡 Alteration & Fixing</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setServiceMode('custom_dress');
              setMakingCharge(0);
              setAdvancePaid(0);
            }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: serviceMode === 'custom_dress' ? '2px solid #1e3a8a' : '1px solid #cbd5e1',
              background: serviceMode === 'custom_dress' ? '#1e3a8a' : '#f8fafc',
              color: serviceMode === 'custom_dress' ? '#ffffff' : '#334155',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '6px'
            }}
          >
            <span>👗 Custom Dress Booking</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setServiceMode('raw_material');
              setMakingCharge(0);
              setAdvancePaid(0);
            }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: serviceMode === 'raw_material' ? '2px solid #059669' : '1px solid #cbd5e1',
              background: serviceMode === 'raw_material' ? '#059669' : '#f8fafc',
              color: serviceMode === 'raw_material' ? '#ffffff' : '#334155',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '6px'
            }}
          >
            <span>✂️ Raw Material (By Meter)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setServiceMode('readymade');
              setMakingCharge(0);
              setAdvancePaid(0);
            }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: serviceMode === 'readymade' ? '2px solid #7c3aed' : '1px solid #cbd5e1',
              background: serviceMode === 'readymade' ? '#7c3aed' : '#f8fafc',
              color: serviceMode === 'readymade' ? '#ffffff' : '#334155',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '6px'
            }}
          >
            <span>🛍️ Ready-Made (With Size)</span>
          </button>
        </div>

        {serviceMode === 'raw_material' && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1' }}>
            <button
              type="button"
              onClick={() => {
                setRawMaterialSaleType('instant');
                setAdvancePaid(0);
              }}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: '4px',
                border: rawMaterialSaleType === 'instant' ? '1.5px solid #059669' : '1px solid #cbd5e1',
                background: rawMaterialSaleType === 'instant' ? '#ecfdf5' : '#ffffff',
                color: rawMaterialSaleType === 'instant' ? '#047857' : '#475569',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              ⚡ In-Stock Instant Sale (100% Paid)
            </button>
            <button
              type="button"
              onClick={() => {
                setRawMaterialSaleType('booking');
                setAdvancePaid(100);
              }}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: '4px',
                border: rawMaterialSaleType === 'booking' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                background: rawMaterialSaleType === 'booking' ? '#eff6ff' : '#ffffff',
                color: rawMaterialSaleType === 'booking' ? '#1d4ed8' : '#475569',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              📋 Out-of-Stock Fabric Booking (Advance Deposit & Mill Pre-Order)
            </button>
          </div>
        )}
      </div>

      {/* Mobile Tab Switcher Bar (Visible on smaller screens) */}
      <div className="tailor-mobile-tabs" style={{ background: '#1e293b', padding: '8px 12px', gap: '8px' }}>
        <button
          onClick={() => setMobileTab('bill')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '6px',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.9rem',
            background: mobileTab === 'bill' ? '#2563eb' : '#334155',
            color: '#ffffff'
          }}
        >
          📄 Bill & Products
        </button>
        <button
          onClick={() => setMobileTab('sizing')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '6px',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.9rem',
            background: mobileTab === 'sizing' ? '#2563eb' : '#334155',
            color: '#ffffff'
          }}
        >
          {serviceMode === 'raw_material' ? '✂️ Fabric Stock' : '📏 Sizing & Specs'}
        </button>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="tailor-layout-grid">
        {/* ========================================================
            LEFT COLUMN: Sizing (or Fabric Reel Guide)
           ======================================================== */}
        <div
          className={`sizing-col ${mobileTab === 'sizing' ? 'mobile-show' : ''}`}
          style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {serviceMode === 'custom_dress' ? (
            <>
              <div
                style={{
                  background: '#1e3a8a',
                  color: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Scissors size={18} />
                <span>Sizing / Measurements (Inches)</span>
              </div>

              {/* Sizing Grid 2-columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { label: 'Length', key: 'length' },
                  { label: 'Chest', key: 'chest' },
                  { label: 'Waist', key: 'waist' },
                  { label: 'Shoulder', key: 'shoulder' },
                  { label: 'Sleeve', key: 'sleeve' },
                  { label: 'Muhuri', key: 'muhuri' },
                  { label: 'F. Neck', key: 'fNeck' },
                  { label: 'B. Neck', key: 'bNeck' },
                  { label: 'Thigh', key: 'thigh' },
                  { label: 'Armpit', key: 'armpit' },
                  { label: 'Hai', key: 'hai' },
                  { label: 'Hip', key: 'hip' },
                  { label: 'Lining', key: 'lining' },
                  { label: 'H.B.L.', key: 'hbl' },
                  { label: 'B. P.', key: 'bp' }
                ].map((item) => (
                  <div key={item.key} style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '2px' }}>{item.label}</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Numbers only"
                      value={sizing[item.key] || ''}
                      onChange={(e) => handleSizingChange(item.key, e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '6px 8px',
                        fontSize: '13px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        background: '#ffffff',
                        color: '#0f172a',
                        fontWeight: 600
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Lower Body / Skirt Section */}
              <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#1e3a8a', marginBottom: '6px' }}>
                  Lower Body / Skirt Specs
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { label: 'Demu', key: 'demu' },
                    { label: 'Knee', key: 'knee' },
                    { label: 'Gher', key: 'gher' },
                    { label: 'Side', key: 'side' },
                    { label: 'Secom', key: 'secom' }
                  ].map((item) => (
                    <div key={item.key} style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '2px' }}>{item.label}</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Numbers only"
                        value={sizing[item.key] || ''}
                        onChange={(e) => handleSizingChange(item.key, e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '6px 8px',
                          fontSize: '13px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                          background: '#ffffff',
                          color: '#0f172a',
                          fontWeight: 600
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="btn"
                onClick={handleSaveMeasurements}
                style={{
                  background: '#1e3a8a',
                  color: '#ffffff',
                  padding: '10px',
                  fontWeight: 700,
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  marginTop: '4px'
                }}
              >
                <Save size={16} style={{ marginRight: '6px', display: 'inline' }} />
                Save Measurements
              </button>
            </>
          ) : serviceMode === 'alteration' ? (
            <>
              <div
                style={{
                  background: '#ea580c',
                  color: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Scissors size={18} />
                <span>Alteration / Fixing Details</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px', display: 'block' }}>Garment Source</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input type="radio" name="altSource" value="shop" checked={alterationDetails.source === 'shop'} onChange={(e) => setAlterationDetails(p => ({...p, source: e.target.value}))} /> From Our Shop
                    </label>
                    <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input type="radio" name="altSource" value="outside" checked={alterationDetails.source === 'outside'} onChange={(e) => setAlterationDetails(p => ({...p, source: e.target.value}))} /> Outside Garment
                    </label>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px', display: 'block' }}>Alteration Product Name</label>
                  <SearchableSelect
                    value={alterationDetails.garmentType}
                    onChange={handleAlterationProductChange}
                    options={alterationProductOptions}
                    placeholder="Search or enter alteration product name..."
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px', display: 'block' }}>Alteration Notes</label>
                  <textarea
                    value={alterationDetails.description}
                    onChange={(e) => setAlterationDetails(p => ({...p, description: e.target.value}))}
                    placeholder="E.g., Zip replacement, hem reduction by 2 inches, side fitting..."
                    rows={3}
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* Sizing & Measurements for Alterations */}
              <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '10px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div
                  style={{
                    background: '#ea580c',
                    color: '#ffffff',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Scissors size={15} />
                  <span>Sizing / Alteration Specs (Inches)</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { label: 'Length', key: 'length' },
                    { label: 'Chest', key: 'chest' },
                    { label: 'Waist', key: 'waist' },
                    { label: 'Shoulder', key: 'shoulder' },
                    { label: 'Sleeve', key: 'sleeve' },
                    { label: 'Muhuri', key: 'muhuri' },
                    { label: 'F. Neck', key: 'fNeck' },
                    { label: 'B. Neck', key: 'bNeck' },
                    { label: 'Thigh', key: 'thigh' },
                    { label: 'Armpit', key: 'armpit' },
                    { label: 'Hai', key: 'hai' },
                    { label: 'Hip', key: 'hip' },
                    { label: 'Lining', key: 'lining' },
                    { label: 'H.B.L.', key: 'hbl' },
                    { label: 'B. P.', key: 'bp' }
                  ].map((item) => (
                    <div key={item.key} style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '2px' }}>{item.label}</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Numbers only"
                        value={sizing[item.key] || ''}
                        onChange={(e) => handleSizingChange(item.key, e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '6px 8px',
                          fontSize: '13px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                          background: '#ffffff',
                          color: '#0f172a',
                          fontWeight: 600
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#ea580c', marginBottom: '6px' }}>
                    Lower Body / Skirt Specs
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[
                      { label: 'Demu', key: 'demu' },
                      { label: 'Knee', key: 'knee' },
                      { label: 'Gher', key: 'gher' },
                      { label: 'Side', key: 'side' },
                      { label: 'Secom', key: 'secom' }
                    ].map((item) => (
                      <div key={item.key} style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '2px' }}>{item.label}</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="Numbers only"
                          value={sizing[item.key] || ''}
                          onChange={(e) => handleSizingChange(item.key, e.target.value)}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '6px 8px',
                            fontSize: '13px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            background: '#ffffff',
                            color: '#0f172a',
                            fontWeight: 600
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn"
                  onClick={handleSaveMeasurements}
                  style={{
                    background: '#ea580c',
                    color: '#ffffff',
                    padding: '10px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    marginTop: '4px'
                  }}
                >
                  <Save size={16} style={{ marginRight: '6px', display: 'inline' }} />
                  Save Measurements
                </button>
              </div>
            </>
          ) : (
            <>
              {/* RAW MATERIAL FABRIC REEL GUIDE & INVENTORY STATUS */}
              <div
                style={{
                  background: '#059669',
                  color: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Scissors size={18} />
                <span>Fabric Stock Reels (In Stock)</span>
              </div>

              <div style={{ fontSize: '12px', color: '#334155', background: '#ecfdf5', padding: '10px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                <p style={{ margin: '0 0 6px 0', fontWeight: 700, color: '#047857' }}>
                  ✂️ Bulk Fabric Than Inventory Status:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Cotton Fabric Reel:</span>
                    <strong style={{ color: '#047857' }}>45.0 Meters</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Teri Cotton Poplin:</span>
                    <strong style={{ color: '#047857' }}>62.5 Meters</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Garden Silk Reel:</span>
                    <strong style={{ color: '#047857' }}>28.0 Meters</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Chicken Shiffon:</span>
                    <strong style={{ color: '#047857' }}>18.5 Meters</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>South Cotton Than:</span>
                    <strong style={{ color: '#047857' }}>50.0 Meters</strong>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#047857', marginBottom: '6px' }}>
                  💡 Meter Cut Estimator (For Tailors)
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11.5px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li><strong>Full Salwar Kameez:</strong> 4.0 - 4.5 Meters</li>
                  <li><strong>Blouse Piece:</strong> 0.8 - 1.0 Meter</li>
                  <li><strong>Chudidar Bottom:</strong> 2.25 Meters</li>
                  <li><strong>Full Gown / Frock:</strong> 3.5 - 4.0 Meters</li>
                  <li><strong>Curtain / Parda:</strong> 2.5 - 3.0 Meters</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* ========================================================
            RIGHT COLUMN: Bill Details & Product Sourcing
           ======================================================== */}
        <div
          className={`bill-col ${mobileTab === 'bill' ? 'mobile-show' : ''}`}
          style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          {/* Top Header Card: Bill No., Dates & Customer Details */}
          <div style={{ background: '#f1f5f9', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Bill No.</label>
                <input
                  type="text"
                  value={billNo}
                  onChange={(e) => setBillNo(e.target.value)}
                  style={{ width: '100%', padding: '6px', fontSize: '14px', fontWeight: 800, color: '#1e3a8a', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Date</label>
                <input
                  type="date"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  style={{ width: '100%', padding: '6px', fontSize: '13px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>D. Date (Delivery)</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  style={{ width: '100%', padding: '6px', fontSize: '13px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>T. Date (Trial)</label>
                <input
                  type="date"
                  value={trialDate}
                  onChange={(e) => setTrialDate(e.target.value)}
                  style={{ width: '100%', padding: '6px', fontSize: '13px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Customer Name</label>
                <SearchableSelect
                  value={selectedCustomerId}
                  onChange={(id) => {
                    setSelectedCustomerId(id);
                    const cust = customers.find((c) => c.id === id);
                    if (cust) {
                      setCustomerName(cust.name || '');
                      setCustomerPhone(cust.phone || '');
                      setCustomerAddress(cust.address || cust.city || '');
                    }
                  }}
                  options={customers.map((c) => ({ value: c.id, label: `${c.name} (${c.phone})` }))}
                  placeholder="Search or enter customer name..."
                  addNewLabel="Add New Client"
                  onAddNew={(name) => {
                    setNewCustomerName(name);
                    setIsCustomerModalOpen(true);
                  }}
                />
                {!selectedCustomerId && (
                  <input
                    type="text"
                    placeholder="Direct Customer Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    style={{ width: '100%', marginTop: '4px', padding: '6px', fontSize: '13px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  />
                )}
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Customer Phone</label>
                <input
                  type="tel"
                  placeholder="Enter 10-digit phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  style={{ width: '100%', padding: '6px', fontSize: '13px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Customer Address</label>
                <input
                  type="text"
                  placeholder="Auto-fetched or enter address..."
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  style={{ width: '100%', padding: '6px', fontSize: '13px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>
            </div>
          </div>

          {/* Mandatory 3 Core Jobs Section (Cutting, Stitching, Hemming) */}
          {serviceMode === 'custom_dress' && (
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Scissors size={16} />
                  <span>Mandatory Core Job Assignments & Incentives (Cutting, Stitching, Hemming)</span>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#2563eb', cursor: 'pointer', background: '#eff6ff', padding: '4px 8px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                  <input
                    type="checkbox"
                    checked={isSingleEmployeeMode}
                    onChange={(e) => handleToggleSingleEmployeeMode(e.target.checked)}
                    style={{ accentColor: '#2563eb' }}
                  />
                  Assign Single Employee for All 3 Core Jobs
                </label>
              </div>

              {/* Single Employee Quick Assignment Banner */}
              {isSingleEmployeeMode && (
                <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', padding: '10px 12px', borderRadius: '6px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 2, minWidth: '200px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#1e3a8a', marginBottom: '2px', display: 'block' }}>
                        Single Master Staff (All 3 Jobs):
                      </label>
                      <select
                        value={singleEmployeeName}
                        onChange={(e) => handleSingleEmployeeChange(e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', fontSize: '12px', fontWeight: 700, borderRadius: '4px', border: '1px solid #2563eb', background: '#ffffff', color: '#1e3a8a' }}
                      >
                        <option value="">-- Select Master Staff for All 3 Jobs --</option>
                        {availableEmployees.map((emp) => <option key={emp} value={emp}>{emp}</option>)}
                      </select>
                    </div>

                    <div style={{ flex: 1, minWidth: '130px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#1e3a8a', marginBottom: '2px', display: 'block' }}>
                        Editable Total Incentive (₹):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={singleEmployeeIncentive === 0 ? '' : singleEmployeeIncentive}
                        onChange={(e) => handleSingleIncentiveChange(e.target.value.replace(/^0+(?=\d)/, ''))}
                        placeholder="230"
                        style={{ width: '100%', padding: '5px 8px', fontSize: '12px', fontWeight: 800, borderRadius: '4px', border: '1px solid #2563eb', background: '#ffffff', color: '#16a34a' }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleSingleEmployeeMode(false)}
                      style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 700, background: '#ffffff', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer', marginTop: '16px' }}
                      title="Undo single assignment and restore individual 3 employee settings"
                    >
                      ↩️ Undo Single Mode
                    </button>
                  </div>
                  <div style={{ fontSize: '11px', color: '#1e40af', marginTop: '6px' }}>
                    💡 <em>Note: Previous 3-employee individual assignments are preserved and will be restored if you click Undo or uncheck Single Mode.</em>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                {/* 1. Cutting Job */}
                <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>✂️ 1. Cutting Job (Mandatory)</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <select
                      value={coreJobs?.cutting?.assignedEmployee || ''}
                      disabled={isSingleEmployeeMode}
                      onChange={(e) => setCoreJobs(prev => ({ ...prev, cutting: { ...(prev?.cutting || {}), assignedEmployee: e.target.value } }))}
                      style={{ width: '100%', padding: '4px 6px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', opacity: isSingleEmployeeMode ? 0.8 : 1 }}
                    >
                      <option value="">-- Assign Cutter --</option>
                      {availableEmployees.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                    </select>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Incentive (₹):</span>
                      <input
                        type="number"
                        disabled={isSingleEmployeeMode}
                        value={coreJobs?.cutting?.incentive || 0}
                        onChange={(e) => setCoreJobs(prev => ({ ...prev, cutting: { ...(prev?.cutting || {}), incentive: Number(e.target.value) || 0 } }))}
                        style={{ width: '70px', padding: '2px 4px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 700, textAlign: 'right', opacity: isSingleEmployeeMode ? 0.8 : 1 }}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Stitching Job */}
                <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>🪡 2. Stitching Job (Mandatory)</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <select
                      value={coreJobs?.stitching?.assignedEmployee || ''}
                      disabled={isSingleEmployeeMode}
                      onChange={(e) => setCoreJobs(prev => ({ ...prev, stitching: { ...(prev?.stitching || {}), assignedEmployee: e.target.value } }))}
                      style={{ width: '100%', padding: '4px 6px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', opacity: isSingleEmployeeMode ? 0.8 : 1 }}
                    >
                      <option value="">-- Assign Tailor --</option>
                      {availableEmployees.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                    </select>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Incentive (₹):</span>
                      <input
                        type="number"
                        disabled={isSingleEmployeeMode}
                        value={coreJobs?.stitching?.incentive || 0}
                        onChange={(e) => setCoreJobs(prev => ({ ...prev, stitching: { ...(prev?.stitching || {}), incentive: Number(e.target.value) || 0 } }))}
                        style={{ width: '70px', padding: '2px 4px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 700, textAlign: 'right', opacity: isSingleEmployeeMode ? 0.8 : 1 }}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Hemming Job */}
                <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>🧵 3. Hemming & Finishing (Mandatory)</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <select
                      value={coreJobs?.hemming?.assignedEmployee || ''}
                      disabled={isSingleEmployeeMode}
                      onChange={(e) => setCoreJobs(prev => ({ ...prev, hemming: { ...(prev?.hemming || {}), assignedEmployee: e.target.value } }))}
                      style={{ width: '100%', padding: '4px 6px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', opacity: isSingleEmployeeMode ? 0.8 : 1 }}
                    >
                      <option value="">-- Assign Finisher --</option>
                      {availableEmployees.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                    </select>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Incentive (₹):</span>
                      <input
                        type="number"
                        disabled={isSingleEmployeeMode}
                        value={coreJobs?.hemming?.incentive || 0}
                        onChange={(e) => setCoreJobs(prev => ({ ...prev, hemming: { ...(prev?.hemming || {}), incentive: Number(e.target.value) || 0 } }))}
                        style={{ width: '70px', padding: '2px 4px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 700, textAlign: 'right', opacity: isSingleEmployeeMode ? 0.8 : 1 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Select Fabric & Products Section */}
          <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: serviceMode === 'raw_material' ? '#059669' : '#1e3a8a', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{serviceMode === 'raw_material' ? '✂️ Quick Select Raw Material Fabric Rolls (By Meter)' : '👗 Quick Select Custom Dress Stitching Services'}</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
                {serviceMode === 'raw_material' ? 'Click to add meters' : 'Click to add service'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '6px' }}>
              {(serviceMode === 'raw_material' ? QUICK_RAW_MATERIALS : QUICK_DRESS_SERVICES).map((prod) => (
                <button
                  key={prod.val}
                  type="button"
                  onClick={() => handleAddQuickItem(prod)}
                  style={{
                    padding: '6px 8px',
                    background: serviceMode === 'raw_material' ? '#ecfdf5' : '#f1f5f9',
                    border: serviceMode === 'raw_material' ? '1px solid #a7f3d0' : '1px solid #cbd5e1',
                    borderRadius: '4px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: serviceMode === 'raw_material' ? '#047857' : '#1e3a8a',
                    cursor: 'pointer',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={`Add ${prod.label}`}
                >
                  + {prod.label}
                </button>
              ))}
            </div>
          </div>

          {/* Work Types Checkboxes & Staff Assignments (CUSTOM DRESS + ALTERATION) */}
          {(serviceMode === 'custom_dress' || serviceMode === 'alteration') && finishingWorksComponent}

          {/* Main Billing Particulars Table Grid (Traditional Format) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e3a8a' }}>
                Particulars & Billing Grid
              </div>
              <button
                type="button"
                className="btn btn-sm"
                onClick={handleAddItemRow}
                style={{ background: '#1e3a8a', color: '#fff', fontSize: '11px', padding: '4px 8px' }}
              >
                <Plus size={12} style={{ marginRight: '2px', display: 'inline' }} /> Add Row
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #1e3a8a', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ background: '#1e3a8a', color: '#ffffff' }}>
                  <th style={{ border: '1px solid #1e3a8a', padding: '6px', textAlign: 'center', width: '35px' }}>No.</th>
                  <th style={{ border: '1px solid #1e3a8a', padding: '6px 8px', textAlign: 'left' }}>
                    {serviceMode === 'raw_material' ? 'FABRIC MATERIAL / REEL NAME' : 'PARTICULARS'}
                  </th>
                  <th style={{ border: '1px solid #1e3a8a', padding: '6px', textAlign: 'center', width: '110px' }}>
                    {serviceMode === 'raw_material' ? 'Meters (m)' : 'Qty'}
                  </th>
                  <th style={{ border: '1px solid #1e3a8a', padding: '6px', textAlign: 'right', width: '85px' }}>
                    {serviceMode === 'raw_material' ? 'Rate / m' : 'Rs.'}
                  </th>
                  <th style={{ border: '1px solid #1e3a8a', padding: '6px', textAlign: 'center', width: '35px' }}>P.</th>
                  <th style={{ border: '1px solid #1e3a8a', padding: '6px', textAlign: 'center', width: '30px' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const itemTotal = Number(item.total) || (Number(item.qty || 1) * Number(item.rate || 0)) || 0;
                  const rsVal = Math.floor(itemTotal);
                  const pVal = Math.round((itemTotal - rsVal) * 100);
                  return (
                    <tr key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ border: '1px solid #1e3a8a', textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #1e3a8a', padding: '2px 4px' }}>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                          placeholder={serviceMode === 'raw_material' ? 'Fabric material name (e.g. Cotton Reel)...' : 'Garment/Particulars description...'}
                          style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '12.5px', outline: 'none' }}
                        />
                      </td>
                      <td style={{ border: '1px solid #1e3a8a', padding: '2px 4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              const step = serviceMode === 'raw_material' ? 0.5 : 1;
                              const currentVal = Number(item.qty) || 1;
                              const newVal = Math.max(1, currentVal - step);
                              handleItemChange(idx, 'qty', newVal);
                            }}
                            style={{
                              padding: '2px 5px',
                              background: '#e2e8f0',
                              border: '1px solid #cbd5e1',
                              borderRadius: '3px',
                              fontSize: '10px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              color: '#1e293b',
                              lineHeight: 1
                            }}
                            title="Decrease meters (Min 1m)"
                          >
                            ▼
                          </button>
                          <input
                            type="number"
                            step={serviceMode === 'raw_material' ? '0.1' : '1'}
                            min="1"
                            value={item.qty}
                            onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                            placeholder="1"
                            style={{
                              width: '46px',
                              border: '1px solid #cbd5e1',
                              borderRadius: '3px',
                              padding: '2px 3px',
                              fontSize: '12.5px',
                              textAlign: 'center',
                              fontWeight: 700,
                              color: serviceMode === 'raw_material' ? '#047857' : 'inherit',
                              background: '#ffffff',
                              outline: 'none'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const step = serviceMode === 'raw_material' ? 0.5 : 1;
                              const currentVal = Number(item.qty) || 1;
                              const newVal = currentVal + step;
                              handleItemChange(idx, 'qty', newVal);
                            }}
                            style={{
                              padding: '2px 5px',
                              background: '#e2e8f0',
                              border: '1px solid #cbd5e1',
                              borderRadius: '3px',
                              fontSize: '10px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              color: '#1e293b',
                              lineHeight: 1
                            }}
                            title="Increase meters"
                          >
                            ▲
                          </button>
                        </div>
                      </td>
                      <td style={{ border: '1px solid #1e3a8a', padding: '2px 4px' }}>
                        <input
                          type="number"
                          min="0"
                          value={item.rate === 0 || item.rate === '0' ? '' : item.rate}
                          onChange={(e) => handleItemChange(idx, 'rate', e.target.value.replace(/^0+(?=\d)/, ''))}
                          placeholder="0"
                          style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '12.5px', textAlign: 'right', fontWeight: 700, outline: 'none' }}
                        />
                      </td>
                      <td style={{ border: '1px solid #1e3a8a', textAlign: 'right', padding: '4px', fontSize: '11px' }}>
                        {pVal > 0 ? pVal : '00'}
                      </td>
                      <td style={{ border: '1px solid #1e3a8a', textAlign: 'center' }}>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                          >
                            ×
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {/* Making Charge Row */}
                <tr>
                  <td colSpan="3" style={{ border: '1px solid #1e3a8a', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>Making Charge</td>
                  <td style={{ border: '1px solid #1e3a8a', padding: '2px 4px' }}>
                    <input
                      type="number"
                      value={makingCharge === 0 || makingCharge === '0' ? '' : makingCharge}
                      onChange={(e) => setMakingCharge(e.target.value.replace(/^0+(?=\d)/, ''))}
                      placeholder="0"
                      style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '12.5px', textAlign: 'right', fontWeight: 700, outline: 'none' }}
                    />
                  </td>
                  <td style={{ border: '1px solid #1e3a8a', textAlign: 'right', padding: '4px', fontSize: '11px' }}>00</td>
                  <td style={{ border: '1px solid #1e3a8a' }}></td>
                </tr>

                {/* Total Row */}
                <tr style={{ background: '#f1f5f9' }}>
                  <td colSpan="3" style={{ border: '1px solid #1e3a8a', padding: '6px 8px', textAlign: 'right', fontWeight: 800 }}>Total</td>
                  <td style={{ border: '1px solid #1e3a8a', padding: '6px', textAlign: 'right', fontWeight: 800, color: '#1e3a8a', fontSize: '14px' }}>
                    {Math.floor(totalAmount)}
                  </td>
                  <td style={{ border: '1px solid #1e3a8a', textAlign: 'right', padding: '4px', fontSize: '11px', fontWeight: 700 }}>
                    {Math.round((totalAmount - Math.floor(totalAmount)) * 100) || '00'}
                  </td>
                  <td style={{ border: '1px solid #1e3a8a' }}></td>
                </tr>

                {/* Advance Row */}
                <tr>
                  <td colSpan="3" style={{ border: '1px solid #1e3a8a', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>Advance Paid</td>
                  <td style={{ border: '1px solid #1e3a8a', padding: '2px 4px' }}>
                    <input
                      type="number"
                      value={advancePaid === 0 || advancePaid === '0' ? '' : advancePaid}
                      onChange={(e) => setAdvancePaid(e.target.value.replace(/^0+(?=\d)/, ''))}
                      placeholder="0"
                      style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '12.5px', textAlign: 'right', fontWeight: 700, color: '#16a34a', outline: 'none' }}
                    />
                  </td>
                  <td style={{ border: '1px solid #1e3a8a', textAlign: 'right', padding: '4px', fontSize: '11px' }}>00</td>
                  <td style={{ border: '1px solid #1e3a8a' }}></td>
                </tr>

                {/* Due Row */}
                <tr style={{ background: '#fff1f2' }}>
                  <td colSpan="3" style={{ border: '1px solid #1e3a8a', padding: '6px 8px', textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>Due Balance</td>
                  <td style={{ border: '1px solid #1e3a8a', padding: '6px', textAlign: 'right', fontWeight: 800, color: '#dc2626', fontSize: '14px' }}>
                    {Math.floor(dueBalance)}
                  </td>
                  <td style={{ border: '1px solid #1e3a8a', textAlign: 'right', padding: '4px', fontSize: '11px', fontWeight: 700, color: '#dc2626' }}>
                    {Math.round((dueBalance - Math.floor(dueBalance)) * 100) || '00'}
                  </td>
                  <td style={{ border: '1px solid #1e3a8a' }}></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Terms Footer Banner */}
          <div style={{ fontSize: '11px', color: '#475569', borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
            <p style={{ margin: '0 0 2px 0' }}>
              <strong>N.B. :</strong> Shop owner will not be responsible if material is not taken within a month. Complaints accepted within 3 days of delivery.
            </p>
            <p style={{ margin: 0, fontWeight: 800, color: '#1e3a8a', textAlign: 'center' }}>
              WEDNESDAY HALF & THURSDAY FULL CLOSED
            </p>
          </div>

          {/* Action Buttons Bar */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => showToast('Draft saved locally', 'info')}
            >
              Save Draft
            </button>
            <button
              type="button"
              className="btn"
              onClick={handleRecordPayment}
              style={{ background: serviceMode === 'custom_dress' ? '#1e3a8a' : (rawMaterialSaleType === 'booking' ? '#2563eb' : '#16a34a'), color: '#ffffff', fontWeight: 700, padding: '10px 20px', fontSize: '0.9rem' }}
            >
              <CheckCircle2 size={16} style={{ marginRight: '6px', display: 'inline' }} />
              {serviceMode === 'custom_dress'
                ? '👗 Book Custom Order & Job Card'
                : (rawMaterialSaleType === 'booking' ? '📋 Book Fabric Pre-Order & Print Bill' : '✂️ Record Instant Sale & Print Bill')}
            </button>
          </div>
        </div>
      </div>

      {/* Customer Modal for adding new customers */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        initialName={newCustomerName}
        onCustomerCreated={(c) => {
          setSelectedCustomerId(c.id);
          setCustomerName(c.name);
          setCustomerPhone(c.phone);
        }}
      />

      {/* Receipt Modal for viewing and printing receipt */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        order={receiptOrder}
      />

      {/* Billing History Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="📋 Counter Billing History & Custom Order Stage Tracker"
        maxWidth="1150px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search history by customer name, phone or bill no..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '13px',
                minWidth: '240px'
              }}
            />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
              Total Bills Recorded: {(orderBookings.length + sales.length)}
            </span>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ background: '#1e3a8a', color: '#ffffff', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px' }}>Bill / Booking No.</th>
                  <th style={{ padding: '10px 12px' }}>Date</th>
                  <th style={{ padding: '10px 12px' }}>Customer</th>
                  <th style={{ padding: '10px 12px' }}>Type</th>
                  <th style={{ padding: '10px 12px', minWidth: '170px' }}>Product Stage Status</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total (₹)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Advance (₹)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Due (₹)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {[...orderBookings, ...sales]
                  .filter((b) => {
                    if (!historySearch) return true;
                    const q = historySearch.toLowerCase();
                    return (
                      (b.bookingNo || b.invoiceNo || b.id || '').toLowerCase().includes(q) ||
                      (b.customerName || '').toLowerCase().includes(q) ||
                      (b.customerPhone || '').includes(q)
                    );
                  })
                  .slice(0, 30)
                  .map((b, idx) => {
                    const isRaw = b.saleType === 'raw_material' || b.orderType === 'RAW_MATERIAL';
                    const isReadymade = b.saleType === 'readymade' || b.orderType === 'READYMADE';
                    const tot = Number(b.totalAmount || b.total || 0);
                    const adv = Number(b.advancePaid || b.advance || b.amountPaid || 0);
                    const due = Math.max(0, tot - adv);
                    const currentStageVal = b.currentStage || b.stage || b.status || 'Cutting stage';

                    return (
                      <tr key={b.id || idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: '#1e3a8a' }}>{b.bookingNo || b.invoiceNo || b.id}</td>
                        <td style={{ padding: '8px 12px', fontSize: '12px' }}>{b.bookingDate || b.date || 'Today'}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ fontWeight: 600 }}>{b.customerName || 'Walk-in'}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{b.customerPhone || 'N/A'}</div>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px', background: isRaw ? '#ecfdf5' : (isReadymade ? '#f3e8ff' : '#e0f2fe'), color: isRaw ? '#047857' : (isReadymade ? '#7e22ce' : '#0369a1'), fontWeight: 700 }}>
                            {isRaw ? '✂️ Fabric Sale' : (isReadymade ? '🛍️ Ready-Made' : '👗 Custom Order')}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          {isRaw || isReadymade ? (
                            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px', background: '#f3f4f6', color: '#6b7280', fontWeight: 700 }}>
                              N/A
                            </span>
                          ) : (
                            <>
                              <select
                                value={currentStageVal}
                                onChange={(e) => {
                                  const selectedStage = e.target.value;
                                  if (window.confirm(`Are you sure you want to change order #${b.bookingNo || b.invoiceNo || b.id} stage to "${selectedStage}"?`)) {
                                    b.currentStage = selectedStage;
                                    b.stage = selectedStage;
                                    b.status = selectedStage;
                                    showToast(`Order #${b.bookingNo || b.invoiceNo || b.id} status updated to "${selectedStage}"`, 'success');
                                  }
                                }}
                                style={{
                                  padding: '4px 6px',
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  borderRadius: '4px',
                                  border: '1px solid #cbd5e1',
                                  background: '#ffffff',
                                  color: '#1e3a8a',
                                  cursor: 'pointer'
                                }}
                              >
                                {CUSTOM_STAGES.map((stg) => (
                                  <option key={stg} value={stg}>{stg}</option>
                                ))}
                              </select>
                              {currentStageVal === 'Ready to Delivery stage' && (
                                <button
                                  type="button"
                                  style={{
                                    marginLeft: '6px',
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    background: '#10b981',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => handleMarkDelivered(b)}
                                >
                                  Delivered
                                </button>
                              )}
                            </>
                          )}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>₹{tot}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>₹{adv}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: due > 0 ? '#dc2626' : '#64748b', fontWeight: 700 }}>₹{due}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => {
                              setIsHistoryModalOpen(false);
                              setReceiptOrder(b);
                              setIsReceiptOpen(true);
                            }}
                            style={{ fontSize: '11px', padding: '4px 10px', background: '#1e3a8a', color: '#ffffff', fontWeight: 700 }}
                          >
                            👁️ View Bill
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
};
