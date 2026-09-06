import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_PRODUCTS,
  INITIAL_VENDORS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_CUSTOMERS,
  INITIAL_SALES_ORDERS,
  INITIAL_LEDGER_ENTRIES,
  INITIAL_PRODUCT_STAGES,
  INITIAL_MEASUREMENTS,
  INITIAL_ORDER_BOOKINGS,
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE,
  INITIAL_USERS,
} from '../data/seedData';
import { generateId, generateBarcode, playSound } from '../utils/formatters';
import {
  authApi,
  productsApi,
  posApi,
  bookingsApi,
  employeesApi,
  customersApi,
  ledgerApi,
  api,
  purchasesApi,
} from '../api/client';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  // Authentication & Role-Based Access Control State
  const [users, setUsers] = useState([]);

  const [currentUser, setCurrentUser] = useState(null);

  // Business data is owned by the backend. These initial values keep the UI
  // renderable while the first API bootstrap request is in flight.
  const [products, setProducts] = useState([]);

  const [vendors, setVendors] = useState([]);

  const [purchaseOrders, setPurchaseOrders] = useState([]);

  const [customers, setCustomers] = useState([]);

  const [salesOrders, setSalesOrders] = useState([]);

  const [ledgerEntries, setLedgerEntries] = useState([]);

  const [productStages, setProductStages] = useState([]);

  const [measurements, setMeasurements] = useState([]);

  const [orderBookings, setOrderBookings] = useState([]);

  const [employees, setEmployees] = useState([]);

  const [attendance, setAttendance] = useState([]);
  const [assignedJobs, setAssignedJobs] = useState([]);
  const [workPayments, setWorkPayments] = useState([]);
  const [productionJobs, setProductionJobs] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [activeTab, setActiveTab] = useState('pos'); // pos, purchase, profit, ledger, stages, measurement, booking, employee
  const currency = 'INR';
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('tc_theme') || 'dark';
  });
  const [toasts, setToasts] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartDiscount, setCartDiscount] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [measurementHubCustomerId, setMeasurementHubCustomerId] = useState(null);
  const [measurementHubField, setMeasurementHubField] = useState(null);

  const openMeasurementHub = (customerId, field = null) => {
    setMeasurementHubCustomerId(customerId);
    setMeasurementHubField(field);
    setActiveTab('measurement');
  };

  // Apply theme to root document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tc_theme', theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    const loadBackendData = async () => {
      try {
        const [productData, customerData, orderData, bookingData, employeeData, attendanceData, ledgerData, stageData, measurementData, userData, vendorData, purchaseOrderData, jobData, paymentData, productionJobData] = await Promise.all([
          productsApi.getAll(),
          customersApi.getAll(),
          posApi.getOrders(),
          bookingsApi.getAll(),
          employeesApi.getAll(),
          employeesApi.getAttendance(),
          ledgerApi.getAll(),
          ledgerApi.getStages(),
          customersApi.getMeasurements(),
          authApi.getUsers(),
          purchasesApi.getVendors(),
          purchasesApi.getOrders(),
          bookingsApi.getMasterJobs(),
          employeesApi.getWorkPayments(),
          ledgerApi.getProductionJobs('all'),
        ]);
        if (cancelled) return;
        setProducts(productData);
        setCustomers(customerData);
        setSalesOrders(orderData);
        setOrderBookings(bookingData);
        setEmployees(employeeData);
        setAttendance(attendanceData);
        setLedgerEntries(ledgerData);
        setProductStages(stageData);
        setMeasurements(measurementData);
        setUsers(userData);
        setVendors(vendorData);
        setPurchaseOrders(purchaseOrderData);
        setAssignedJobs(jobData);
        setWorkPayments(paymentData);
        setProductionJobs(productionJobData);
      } catch (error) {
        if (!cancelled) showToast(`Could not load backend data: ${error.message}`, 'danger');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    loadBackendData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const refreshAttendance = async () => {
      try {
        setAttendance(await employeesApi.getAttendance());
      } catch {
        // Keep the current view if a background refresh is temporarily unavailable.
      }
    };
    window.addEventListener('focus', refreshAttendance);
    return () => window.removeEventListener('focus', refreshAttendance);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      showToast(`Switched to ${nextTheme === 'light' ? 'Minimalist Light' : 'Midnight Dark'} Mode`, 'info');
      return nextTheme;
    });
  };

  // Authentication & Login Operations
  const login = async (username, password) => {
    try {
      const { user } = await authApi.login(username.trim(), password);
      setCurrentUser(user);
      playSound('success');
      showToast(`Welcome back, ${user.name}! [${user.role}]`, 'success');
      // Switch to first permitted tab
      if (user.permissions && user.permissions.length > 0) {
        setActiveTab(user.permissions[0]);
      }
      return { success: true, user };
    } catch (error) {
      playSound('error');
      showToast(error.message || 'Invalid username or password. Please try again.', 'danger');
      return { success: false, error: error.message };
    }
  };

  const quickLoginAs = (roleKey) => {
    const user = users.find((u) => u.roleKey === roleKey || u.username === roleKey);
    if (user) {
      setCurrentUser(user);
      playSound('success');
      showToast(`Switched account: Logged in as ${user.name} (${user.role})`, 'success');
      if (user.permissions && user.permissions.length > 0) {
        setActiveTab(user.permissions[0]);
      }
      return user;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('tc_auth_user');
    localStorage.removeItem('tc_auth_token');
    clearCart();
    playSound('beep');
    showToast('You have been logged out successfully.', 'info');
  };

  useEffect(() => {
    const token = localStorage.getItem('tc_auth_token');
    if (!token) return;
    authApi.me().then(({ user }) => setCurrentUser(user)).catch(() => localStorage.removeItem('tc_auth_token'));
  }, []);

  // Toast Notification Helper
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // ----------------------------------------------------
  // POS & Sales Order Actions
  // ----------------------------------------------------
  const addToCart = (product, selectedVariant = {}) => {
    playSound('beep');
    setCart((prevCart) => {
      const size = selectedVariant.size || product.sizes?.[0] || 'Standard';
      const color = selectedVariant.color || product.colors?.[0] || 'Default';
      const existingIndex = prevCart.findIndex(
        (item) => item.id === product.id && item.size === size && item.color === color
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return updated;
      }

      return [
        ...prevCart,
        {
          ...product,
          size,
          color,
          quantity: 1,
          discount: 0,
        },
      ];
    });
    showToast(`Added ${product.name} to POS cart`, 'info');
  };

  const updateCartItemQty = (index, delta) => {
    setCart((prev) => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index] = { ...updated[index], quantity: newQty };
      return updated;
    });
  };

  const updateCartItemDiscount = (index, discount) => {
    setCart((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], discount: Number(discount) || 0 };
      return updated;
    });
  };

  const removeFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setCartDiscount(0);
    setSelectedCustomer(null);
  };

  // Complete POS Sale
  const completeSale = async (saleData) => {
    const newInvoiceNo = `TC-INV-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder = {
      id: generateId('INV'),
      invoiceNo: newInvoiceNo,
      date: new Date().toLocaleString(),
      customerName: saleData.customerName || 'Walk-in Retail Customer',
      customerPhone: saleData.customerPhone || 'N/A',
      items: saleData.items,
      saleType: saleData.saleType || 'finished_product',
      subtotal: saleData.subtotal,
      discountTotal: saleData.discountTotal,
      tax: saleData.tax,
      total: saleData.total,
      paymentMethod: saleData.paymentMethod, // 'cash' | 'card' | 'upi' | 'split'
      paymentStatus: 'Paid',
      cashier: saleData.cashier || (currentUser ? `${currentUser.name} (${currentUser.role})` : 'David Miller (Sales Executive)'),
      profit: saleData.profit,
    };

    const response = await posApi.checkout({
      id: newOrder.id,
      orderNo: newInvoiceNo,
      customerId: saleData.customerId,
      customerName: newOrder.customerName,
      cashierName: newOrder.cashier,
      items: saleData.items.map((item) => ({ ...item, productId: item.id })),
      subtotal: saleData.subtotal,
      discount: saleData.discountTotal,
      tax: saleData.tax,
      total: saleData.total,
      paymentMethod: saleData.paymentMethod,
      saleType: saleData.saleType || 'finished_product',
    });

    setSalesOrders((prev) => [response.order, ...prev]);
    const [productData, ledgerData, employeeData] = await Promise.all([
      productsApi.getAll(),
      ledgerApi.getAll(),
      employeesApi.getAll(),
    ]);
    setProducts(productData);
    setLedgerEntries(ledgerData);
    setEmployees(employeeData);

    clearCart();
    playSound('success');
    showToast(`Invoice #${newInvoiceNo} generated successfully!`, 'success');
    return response.order;
  };

  // ----------------------------------------------------
  // Purchase Orders & Inward Stock Actions
  // ----------------------------------------------------
  const createPurchaseOrder = async (poData) => {
    const newPO = {
      id: generateId('PO-2026'),
      vendorId: poData.vendorId,
      vendorName: poData.vendorName,
      orderDate: poData.orderDate || new Date().toISOString().split('T')[0],
      expectedDate: poData.expectedDate,
      status: 'Ordered',
      paymentStatus: poData.paidAmount >= poData.total ? 'Paid' : poData.paidAmount > 0 ? 'Partial Paid' : 'Pending',
      items: poData.items,
      subtotal: poData.subtotal,
      tax: poData.tax,
      total: poData.total,
      paidAmount: Number(poData.paidAmount) || 0,
      notes: poData.notes || 'Standard inward delivery purchase order',
    };

    const savedOrder = await purchasesApi.createOrder(newPO);
    setPurchaseOrders((prev) => [savedOrder, ...prev]);
    setVendors(await purchasesApi.getVendors());
    setLedgerEntries(await ledgerApi.getAll());

    showToast(`Purchase Order ${newPO.id} created!`, 'success');
    return savedOrder;
  };

  const receiveStockFromPO = async (poId) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return;

    await purchasesApi.receiveOrder(poId);
    setPurchaseOrders(await purchasesApi.getOrders());
    setProducts(await productsApi.getAll());

    showToast(`Stock received & inventory updated for PO #${poId}`, 'success');
  };

  // Add Vendor
  const addVendor = async (vendorData) => {
    const customOrGeneratedId = vendorData.customId?.trim() || generateId('VEN');
    const newVendor = {
      id: customOrGeneratedId,
      ...vendorData,
      balancePayable: Number(vendorData.balancePayable) || 0,
      rating: Number(vendorData.rating) || 5.0,
    };
    const savedVendor = await purchasesApi.createVendor(newVendor);
    setVendors((prev) => [savedVendor, ...prev]);
    showToast(`Vendor ${newVendor.name} [${newVendor.id}] added!`, 'success');
    return savedVendor;
  };

  const addProduct = async (productData) => {
    const productNumber = products.length + 101;
    const savedProduct = await productsApi.create({
      id: `PRD-${productNumber}`,
      name: productData.name,
      sku: productData.sku || `NEW-${productNumber}`,
      barcode: productData.barcode || `890100${productNumber}`,
      category: productData.category || 'Bespoke & Custom',
      price: Number(productData.price) || 0,
      costPrice: Number(productData.costPrice) || 0,
      mrp: Number(productData.mrp) || Number(productData.price) || 0,
      stock: Number(productData.stock) || 0,
      minStock: 5,
      sizes: [],
      colors: [],
      image: '👔',
    });
    setProducts((prev) => [savedProduct, ...prev]);
    showToast(`Product ${savedProduct.name} added!`, 'success');
    return savedProduct;
  };

  const deleteVendor = async (vendorId) => {
    await purchasesApi.deleteVendor(vendorId);
    setVendors((prev) => prev.filter((v) => v.id !== vendorId));
    showToast('Vendor removed from registry', 'info');
  };

  // Add / Manage Customers & Clients
  const addCustomer = async (custData) => {
    const customOrGeneratedId = custData.customId?.trim() || generateId('CUST');
    const newCustomer = {
      id: customOrGeneratedId,
      name: custData.name,
      phone: custData.phone || 'N/A',
      email: custData.email || '',
      city: custData.city || 'Local Store',
      type: custData.type || 'VIP Bespoke',
      loyaltyPoints: Number(custData.loyaltyPoints) || 0,
      balanceReceivable: Number(custData.balanceReceivable) || 0,
      totalSpent: 0,
    };
    const savedCustomer = await customersApi.create({
      ...newCustomer,
      creditLimit: newCustomer.balanceReceivable,
      balance: newCustomer.balanceReceivable,
    });
    setCustomers((prev) => [...prev, savedCustomer]);
    showToast(`Client ${newCustomer.name} [${newCustomer.id}] registered!`, 'success');
    return savedCustomer;
  };

  const deleteCustomer = async (customerId) => {
    await api.delete(`/customers/${customerId}`);
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
    showToast('Customer profile removed from registry', 'info');
  };

  const updateCustomer = async (customerId, updatedData) => {
    const savedCustomer = await api.put(`/customers/${customerId}`, updatedData);
    setCustomers((prev) => prev.map((c) => (c.id === customerId ? savedCustomer : c)));
    showToast('Customer profile updated successfully!', 'success');
  };

  // ----------------------------------------------------
  // Product Stages Actions (Manufacturing Pipeline)
  // ----------------------------------------------------
  const createProductBatch = async (batchData) => {
    const newBatch = {
      id: generateId('STG-BATCH'),
      batchNo: `LOT-2026-${Math.floor(100 + Math.random() * 900)}`,
      bookingId: batchData.bookingId || null,
      garmentType: batchData.garmentType,
      clientName: batchData.clientName || 'Showroom Lot',
      quantity: Number(batchData.quantity) || 1,
      currentStage: batchData.currentStage || 'Fabric Sourcing & Inward',
      assignedTo: batchData.assignedTo || 'Unassigned',
      employees: batchData.employees || [],
      startDate: batchData.startDate || new Date().toISOString().split('T')[0],
      targetDate: batchData.targetDate,
      progress: 15,
      fabricCode: batchData.fabricCode || 'FAB-GEN-01',
      qcStatus: 'In Progress',
      notes: batchData.notes || '',
      history: [
        {
          stage: batchData.currentStage || 'Fabric Sourcing & Inward',
          date: new Date().toISOString().split('T')[0],
          status: 'Active',
          by: batchData.assignedTo || 'Supervisor',
        },
      ],
    };

    const savedBatch = await ledgerApi.createStage(newBatch);
    setProductStages((prev) => [savedBatch, ...prev]);
    showToast(`Manufacturing batch ${savedBatch.batchNo} initiated!`, 'success');
    return savedBatch;
  };

  const advanceProductStage = async (batchId, nextStageName, progressVal) => {
    const batch = productStages.find((item) => item.id === batchId);
    if (!batch) return;
    const savedBatch = await ledgerApi.updateStage(batchId, {
      currentStage: nextStageName,
      progress: progressVal,
      history: [
        ...(batch.history || []),
        {
          stage: nextStageName,
          date: new Date().toISOString().split('T')[0],
          status: nextStageName === 'Showroom / Ready Stock' ? 'Completed' : 'Active',
          by: 'Department Master',
        },
      ],
    });
    setProductStages((prev) => prev.map((item) => item.id === batchId ? savedBatch : item));
    setProductionJobs(await ledgerApi.getProductionJobs('all'));
    if (batch.bookingId) {
      const status = nextStageName.includes('Trial') ? 'Ready for Trial' : nextStageName.includes('Ready') ? 'Ready for Delivery' : 'In Production';
      const savedBooking = await api.patch(`/bookings/${batch.bookingId}`, { status });
      setOrderBookings((prev) => prev.map((item) => item.id === batch.bookingId ? savedBooking : item));
    }
    showToast(`Batch moved to ${nextStageName}!`, 'info');
  };

  const moveProductStageBackward = async (batchId, previousStageName, progressVal) => {
    return advanceProductStage(batchId, previousStageName, progressVal);
  };

  const updateQCStatus = async (batchId, status, remarks) => {
    const batch = productStages.find((item) => item.id === batchId);
    if (!batch) return;
    const savedBatch = await ledgerApi.updateStage(batchId, {
      qcStatus: status,
      notes: remarks ? `${batch.notes || ''} [QC: ${remarks}]` : batch.notes,
    });
    setProductStages((prev) => prev.map((item) => item.id === batchId ? savedBatch : item));
    showToast(`QC status updated: ${status}`, 'success');
  };

  // ----------------------------------------------------
  // Item Measurements & Tailoring Sizing
  // ----------------------------------------------------
  const saveMeasurementProfile = async (profileData) => {
    const existingIndex = measurements.findIndex(
      (m) => m.customerId === profileData.customerId && m.garmentType === profileData.garmentType
    );

    if (existingIndex > -1) {
      const savedMeasurement = await customersApi.saveMeasurement({
        ...profileData,
        id: measurements[existingIndex].id,
        suitType: profileData.garmentType,
      });
      setMeasurements((prev) => prev.map((item, index) => index === existingIndex ? savedMeasurement : item));
      showToast('Measurement profile updated!', 'success');
    } else {
      const newM = {
        id: generateId('MSR'),
        updatedDate: new Date().toISOString().split('T')[0],
        ...profileData,
      };
      const savedMeasurement = await customersApi.saveMeasurement({
        ...newM,
        suitType: profileData.garmentType,
      });
      setMeasurements((prev) => [savedMeasurement, ...prev]);
      showToast('New measurement profile created!', 'success');
    }
  };

  // ----------------------------------------------------
  // Order Booking Actions (Advance Bespoke Orders)
  // ----------------------------------------------------
  const createOrderBooking = async (bookingData) => {
    const newBooking = {
      id: generateId('BKG-2026'),
      bookingNo: `BK-${Math.floor(100 + Math.random() * 900)}`,
      customerId: bookingData.customerId,
      customerName: bookingData.customerName,
      customerPhone: bookingData.customerPhone,
      garmentType: bookingData.garmentType,
      fabricDetails: bookingData.fabricDetails,
      bookingDate: new Date().toISOString().split('T')[0],
      trialDate: bookingData.trialDate,
      deliveryDate: bookingData.deliveryDate,
      totalAmount: Number(bookingData.totalAmount) || 0,
      advancePaid: Number(bookingData.advancePaid) || 0,
      balanceDue: Math.max(0, (Number(bookingData.totalAmount) || 0) - (Number(bookingData.advancePaid) || 0)),
      status: 'Booked',
      assignedMaster: bookingData.assignedMaster || bookingData.assignedEmployees?.[0]?.employeeName || 'Senior Tailor',
      assignedEmployees: bookingData.assignedEmployees || [],
      specialInstructions: bookingData.specialInstructions || '',
      measurementId: bookingData.measurementId || null,
    };

    const savedBooking = await bookingsApi.create(newBooking);
    setOrderBookings((prev) => [savedBooking, ...prev]);
    setLedgerEntries(await ledgerApi.getAll());

    showToast(`Order Booking #${newBooking.bookingNo} created with advance!`, 'success');
    return savedBooking;
  };

  const updateBookingStatus = async (bookingId, newStatus, balancePaidNow = 0) => {
    if (newStatus === 'Delivered') {
      const response = await bookingsApi.deliverAndSettle(bookingId);
      setOrderBookings((prev) => prev.map((b) => b.id === bookingId ? response.booking : b));
      setLedgerEntries(await ledgerApi.getAll());
    } else {
      const savedBooking = await api.patch(`/bookings/${bookingId}`, { status: newStatus, balancePaidNow });
      setOrderBookings((prev) => prev.map((b) => b.id === bookingId ? savedBooking : b));
    }
    showToast(`Booking status updated to ${newStatus}`, 'info');
  };

  // ----------------------------------------------------
  // Employee Attendance, Advances & Performance Payroll
  // ----------------------------------------------------
  const addEmployee = async (empData) => {
    const newEmp = {
      id: generateId('EMP'),
      empId: `TC-EMP-0${employees.length + 1}`,
      joinDate: new Date().toISOString().split('T')[0],
      advanceLoanTotal: 0,
      advanceLoanDeductionPerMonth: 0,
      advanceLoanRemaining: 0,
      performanceScore: 4.8,
      piecesCompletedThisMonth: 0,
      salesAchievedThisMonth: 0,
      avatar: '👤',
      status: 'Active',
      ...empData,
      baseSalary: Number(empData.baseSalary) || 500,
      overtimeRatePerHour: Number(empData.overtimeRatePerHour) || 8.0,
    };
    const savedEmployee = await employeesApi.create(newEmp);
    setEmployees((prev) => [...prev, savedEmployee]);
    showToast(`Employee ${newEmp.name} added!`, 'success');
    return savedEmployee;
  };

  const updateEmployee = async (empId, updatedFields) => {
    const savedEmployee = await employeesApi.update(empId, updatedFields);
    setEmployees((prev) => prev.map((emp) => emp.id === empId || emp.empId === empId ? savedEmployee : emp));
    showToast('Employee profile updated successfully!', 'success');
  };

  const updateEmployeeSalary = async (empId, salaryUpdates) => {
    const savedEmployee = await employeesApi.updateSalary(empId, salaryUpdates);
    setEmployees((prev) => prev.map((emp) => emp.id === empId || emp.empId === empId ? savedEmployee : emp));
    showToast('Salary details updated successfully!', 'success');
  };

  const grantEmployeeAdvanceLoan = async (empId, loanAmount, monthlyDeduction) => {
    const savedEmployee = await employeesApi.grantAdvanceLoan(empId, loanAmount, monthlyDeduction);
    setEmployees((prev) => prev.map((emp) => emp.id === empId || emp.empId === empId ? savedEmployee : emp));

    // Ledger entry for employee advance payout
    const empObj = employees.find((e) => e.id === empId || e.empId === empId);
    const newLedger = {
      id: generateId('LED'),
      date: new Date().toISOString().split('T')[0],
      partyType: 'Expense',
      partyName: `Staff Advance: ${empObj?.name || 'Employee'}`,
      type: 'Debit',
      description: `Advance Loan Disbursed ($${loanAmount})`,
      amount: Number(loanAmount),
      balance: Number(loanAmount),
      refNo: `ADV-${empId}`,
    };
    setLedgerEntries(await ledgerApi.getAll());

    showToast(`Advance loan of $${loanAmount} approved and logged!`, 'success');
  };

  const logDailyAttendance = async (attendanceRecord) => {
    const id = generateId('ATT');
    const newRecord = {
      id,
      date: new Date().toISOString().split('T')[0],
      ...attendanceRecord,
    };

    const savedRecord = await employeesApi.logAttendance(newRecord);
    setAttendance((prev) => [savedRecord, ...prev]);
    showToast(`Attendance marked for ${attendanceRecord.empName}`, 'success');
  };

  const updateAttendanceRecord = async (attId, updatedFields) => {
    try {
      const savedRecord = await employeesApi.updateAttendance(attId, updatedFields);
      setAttendance((prev) => prev.map((att) => (att.id === attId ? savedRecord : att)));
      return savedRecord;
    } catch (error) {
      showToast(`Attendance update failed: ${error.message}`, 'danger');
      return null;
    }
  };

  const completeAssignedJob = async (jobId) => {
    try {
      const completedJob = await bookingsApi.completeMasterJob(jobId);
      setAssignedJobs((prev) => prev.map((job) => job.id === jobId ? completedJob : job));

      // Refresh workPayments and productionJobs so the "Ready for Delivery
      // Employee Dues" tab immediately shows the newly unlocked READY_FOR_PAYMENT
      // entries without requiring a full page reload.
      const [employeeData, bookingData, freshPayments, freshProdJobs] = await Promise.all([
        employeesApi.getAll(),
        bookingsApi.getAll(),
        employeesApi.getWorkPayments(),
        ledgerApi.getProductionJobs('all'),
      ]);
      setEmployees(employeeData);
      setOrderBookings(bookingData);
      setWorkPayments(freshPayments);
      setProductionJobs(freshProdJobs);

      showToast('Assigned task marked completed. Payment dues updated.', 'success');
      return completedJob;
    } catch (error) {
      showToast(`Task completion failed: ${error.message}`, 'danger');
      return null;
    }
  };

  const settleWorkPayment = async (jobId, paymentMethod = 'Cash') => {
    const savedJob = await employeesApi.settleWorkPayment(jobId, paymentMethod);
    setWorkPayments((prev) => prev.filter((job) => job.id !== jobId));
    setProductionJobs((prev) => prev.map((job) => job.id === jobId ? savedJob : job));
    showToast(`Payment settled for ${savedJob.employeeName}`, 'success');
    return savedJob;
  };

  const settleEmployeeProductionBalance = async (employeeId, paymentMethod = 'Cash') => {
    const response = await employeesApi.settleProductionBalance(employeeId, paymentMethod);
    setWorkPayments((prev) => prev.filter((job) => job.employeeId !== employeeId));
    setProductionJobs((prev) => prev.map((job) => response.jobs.find((paidJob) => paidJob.id === job.id) || job));
    setLedgerEntries(await ledgerApi.getAll());
    showToast(`Production balance settled for ${response.employee.name}`, 'success');
    return response;
  };

  const checkInAttendance = (attId) => updateAttendanceRecord(attId, { action: 'checkIn' });
  const checkOutAttendance = (attId) => updateAttendanceRecord(attId, { action: 'checkOut' });

  const addLedgerVoucher = async (voucher) => {
    const newVoucher = {
      id: generateId('LED'),
      date: voucher.date || new Date().toISOString().split('T')[0],
      partyType: voucher.partyType, // 'Customer' | 'Supplier' | 'Expense'
      partyName: voucher.partyName,
      type: voucher.type, // 'Debit' | 'Credit'
      description: voucher.description,
      amount: Number(voucher.amount) || 0,
      balance: Number(voucher.amount) || 0,
      refNo: voucher.refNo || `VCH-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    const savedVoucher = await ledgerApi.addEntry({
      ...newVoucher,
      balanceAfter: newVoucher.balance,
      reference: newVoucher.refNo,
    });
    setLedgerEntries((prev) => [savedVoucher, ...prev]);
    showToast(`Ledger voucher recorded successfully!`, 'success');
  };

  const resetAllData = async () => {
    if (!window.confirm('Reload all business data from the database?')) return;
    try {
      const [productData, customerData, orderData, bookingData, employeeData, attendanceData, ledgerData, stageData, measurementData] = await Promise.all([
        productsApi.getAll(),
        customersApi.getAll(),
        posApi.getOrders(),
        bookingsApi.getAll(),
        employeesApi.getAll(),
        employeesApi.getAttendance(),
        ledgerApi.getAll(),
        ledgerApi.getStages(),
        customersApi.getMeasurements(),
      ]);
      setProducts(productData);
      setCustomers(customerData);
      setSalesOrders(orderData);
      setOrderBookings(bookingData);
      setEmployees(employeeData);
      setAttendance(attendanceData);
      setLedgerEntries(ledgerData);
      setProductStages(stageData);
      setMeasurements(measurementData);
      clearCart();
      showToast('Business data reloaded from the database.', 'info');
    } catch (error) {
      showToast(`Could not reload database data: ${error.message}`, 'danger');
    }
  };

  return (
    <AppContext.Provider
      value={{
        // Data
        products,
        setProducts,
        vendors,
        setVendors,
        purchaseOrders,
        setPurchaseOrders,
        customers,
        setCustomers,
        addCustomer,
        deleteCustomer,
        updateCustomer,
        salesOrders,
        setSalesOrders,
        ledgerEntries,
        setLedgerEntries,
        productStages,
        setProductStages,
        measurements,
        setMeasurements,
        orderBookings,
        setOrderBookings,
        employees,
        setEmployees,
        attendance,
        setAttendance,
        assignedJobs,
        workPayments,
        productionJobs,

        // POS & Cart
        cart,
        addToCart,
        updateCartItemQty,
        updateCartItemDiscount,
        removeFromCart,
        clearCart,
        cartDiscount,
        setCartDiscount,
        selectedCustomer,
        setSelectedCustomer,
        completeSale,
        settleWorkPayment,
        settleEmployeeProductionBalance,

        // Purchase
        createPurchaseOrder,
        receiveStockFromPO,
        addVendor,
        addProduct,
        deleteVendor,

        // Stages
        createProductBatch,
        advanceProductStage,
        moveProductStageBackward,
        updateQCStatus,

        // Measurements & Bookings
        saveMeasurementProfile,
        createOrderBooking,
        updateBookingStatus,

        // Employee & Payroll
        addEmployee,
        updateEmployee,
        updateEmployeeSalary,
        grantEmployeeAdvanceLoan,
        logDailyAttendance,
        updateAttendanceRecord,
        checkInAttendance,
        checkOutAttendance,
        completeAssignedJob,
        addLedgerVoucher,

        // UI & Global
        activeTab,
        setActiveTab,
        isMobileNavOpen,
        setIsMobileNavOpen,
        measurementHubCustomerId,
        measurementHubField,
        setMeasurementHubCustomerId,
        setMeasurementHubField,
        openMeasurementHub,
        currency,
        theme,
        toggleTheme,
        toasts,
        showToast,
        resetAllData,

        // Authentication & RBAC
        users,
        setUsers,
        currentUser,
        setCurrentUser,
        login,
        quickLoginAs,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
