import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Package,
  Layers,
  DollarSign,
  Plus,
  Search,
  CheckCircle2,
  Users,
  Edit3,
  Scissors,
  Save,
  Tag,
  Boxes,
  Percent,
  Truck,
  Trash2,
  FileText,
  Printer,
  ChevronDown,
  ChevronUp,
  Wallet,
  CheckCircle2 as CheckCircle2Icon,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { StatCard } from '../common/StatCard';
import { Modal } from '../common/Modal';
import { PurchaseView } from '../purchase/PurchaseView';

export const SuperAdminView = () => {
  const {
    products,
    createProduct,
    updateProduct,
    deleteProduct,
    employees,
    updateEmployeeSalary,
    currency,
    showToast,
    productStages,
    workPayments,
    settleWorkPayment,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('products'); // 'products', 'raw_materials', 'finishing_tasks', 'incentives', 'payslips', 'purchase_orders'

  // Payslip state
  const currentDate = new Date();
  const [payslipMonth, setPayslipMonth] = useState(currentDate.getMonth() + 1);
  const [payslipYear, setPayslipYear] = useState(currentDate.getFullYear());
  const [payslipDrafts, setPayslipDrafts] = useState({}); // { empId: { daysPresent, overtimeHours, bonuses, deductions } }
  const [expandedEmp, setExpandedEmp] = useState(null);

  // Modals & Form States
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddRawOpen, setIsAddRawOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New Product Form
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Formal Shirts');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCost, setProdCost] = useState('');
  const [prodStock, setProdStock] = useState('20');
  const [prodBaseIncentive, setProdBaseIncentive] = useState('300');

  // New Raw Material Form
  const [rawName, setRawName] = useState('');
  const [rawCategory, setRawCategory] = useState('Raw Fabrics');
  const [rawUnit, setRawUnit] = useState('Meters');
  const [rawCost, setRawCost] = useState('');
  const [rawStock, setRawStock] = useState('100');

  // Matrix Incentive Edit State: { empId: { productName: amount } }
  const [incentiveDrafts, setIncentiveDrafts] = useState({});

  // Filter Finished Products vs Raw Materials
  const RAW_CATEGORIES = ['Raw Materials & Fabrics'];
  
  const finishedProducts = products.filter((p) => !RAW_CATEGORIES.includes(p.category) && p.category !== 'Finishing Task');
  const rawMaterials = products.filter((p) => RAW_CATEGORIES.includes(p.category));
  const finishingTasks = products.filter((p) => p.category === 'Finishing Task');

  // Calculate ready quantity from productStages
  const getReadyQuantity = (productName) => {
    if (!productStages) return 0;
    return productStages
      .filter(stage => stage.garmentType === productName && stage.currentStage === 'Ready')
      .reduce((sum, stage) => sum + (stage.quantity || 1), 0);
  };

  // Search Filtering
  const filteredProducts = finishedProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRaw = rawMaterials.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFinishingTasks = finishingTasks.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const productionEmployees = employees.filter((e) => e.status !== 'Inactive');

  const handleCreateProductSubmit = async (e) => {
    e.preventDefault();
    if (!prodName.trim()) return;

    const sku = `PRD-${Date.now().toString().slice(-6)}`;
    const barcode = `890100${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      await createProduct({
        name: prodName.trim(),
        category: prodCategory,
        price: Number(prodPrice) || 0,
        costPrice: Number(prodCost) || 0,
        stock: Number(prodStock) || 0,
        sku,
        barcode,
        baseIncentive: Number(prodBaseIncentive) || 200,
        sizes: ['M', 'L', 'XL'],
        colors: ['Standard'],
      });
      showToast(`Added product "${prodName}" to Super Admin Catalog!`, 'success');
      setProdName('');
      setProdPrice('');
      setProdCost('');
      setIsAddProductOpen(false);
    } catch (err) {
      showToast(err.message || 'Failed to add product', 'danger');
    }
  };

  const handleCreateRawSubmit = async (e) => {
    e.preventDefault();
    if (!rawName.trim()) return;

    const sku = `RAW-${Date.now().toString().slice(-6)}`;
    const barcode = `890200${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      await createProduct({
        name: rawName.trim(),
        category: rawCategory,
        price: Number(rawCost) || 0,
        costPrice: Number(rawCost) || 0,
        stock: Number(rawStock) || 0,
        unit: rawUnit,
        sku,
        barcode,
      });
      showToast(`Added Raw Material "${rawName}" to Inventory!`, 'success');
      setRawName('');
      setRawCost('');
      setIsAddRawOpen(false);
    } catch (err) {
      showToast(err.message || 'Failed to add raw material', 'danger');
    }
  };

  const handleIncentiveChange = (empId, productName, value) => {
    setIncentiveDrafts((prev) => ({
      ...prev,
      [empId]: {
        ...(prev[empId] || {}),
        [productName]: value,
      },
    }));
  };

  const handleSaveEmpIncentives = async (emp) => {
    const drafts = incentiveDrafts[emp.id] || {};
    const existing = emp.pieceRatePerItem || {};
    const updated = { ...existing, ...drafts };

    // Convert string inputs to numeric amounts
    const cleanMapping = {};
    Object.keys(updated).forEach((k) => {
      cleanMapping[k] = Number(updated[k]) || 0;
    });

    try {
      await updateEmployeeSalary(emp.id, {
        pieceRatePerItem: cleanMapping,
      });
      showToast(`Saved manufacturing incentive rates for ${emp.name}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update employee incentives', 'danger');
    }
  };

  return (
    <div className="superadmin-container">
      <style>{`
        @media (max-width: 768px) {
          .products-table-responsive table, .products-table-responsive thead, .products-table-responsive tbody, .products-table-responsive th, .products-table-responsive td, .products-table-responsive tr { 
            display: block; 
          }
          .products-table-responsive thead tr { 
            position: absolute; top: -9999px; left: -9999px;
          }
          .products-table-responsive tr { 
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            margin-bottom: 1rem;
            padding: 1rem;
            background: var(--bg-surface);
          }
          .products-table-responsive td { 
            border: none;
            border-bottom: 1px solid var(--border-color); 
            position: relative;
            padding-left: 40%; 
            text-align: right;
            min-height: 45px;
            display: flex;
            align-items: center;
            justify-content: flex-end;
          }
          .products-table-responsive td:before { 
            position: absolute;
            top: 50%;
            left: 10px;
            transform: translateY(-50%);
            width: 35%; 
            padding-right: 10px; 
            white-space: nowrap;
            text-align: left;
            font-weight: bold;
            content: attr(data-label);
          }
          .products-table-responsive td:last-child {
            border-bottom: 0;
          }
          .products-table-responsive input, .products-table-responsive select {
            width: 100%;
            text-align: right;
          }
        }
      `}</style>
      {/* Header Banner */}
      <div className="responsive-header-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-warning font-mono" style={{ fontSize: '0.7rem' }}>
              SUPER ADMIN RESTRICTED
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• Privileged Management Console</span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={26} color="var(--primary)" />
            Super Admin Governance & Manufacturing Incentives
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Manage master product list, raw material inventories, and set employee piece-rate manufacturing incentives.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {activeSubTab === 'products' && (
            <button className="btn btn-primary btn-sm" onClick={() => setIsAddProductOpen(true)}>
              <Plus size={15} /> Add New Product Name
            </button>
          )}
          {activeSubTab === 'raw_materials' && (
            <button className="btn btn-primary btn-sm" onClick={() => setIsAddRawOpen(true)}>
              <Plus size={15} /> Add New Raw Material
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid">
        <StatCard
          label="Catalog Product Items"
          value={`${finishedProducts.length} Products`}
          icon={Package}
          color="#6366F1"
        />
        <StatCard
          label="Raw Materials & Trims"
          value={`${rawMaterials.length} Items`}
          icon={Layers}
          color="#34D399"
        />
        <StatCard
          label="Production Staff Members"
          value={`${productionEmployees.length} Artisans`}
          icon={Users}
          color="#F59E0B"
        />
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          className={`btn ${activeSubTab === 'products' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveSubTab('products')}
        >
          <Package size={14} /> Product Names & Catalog ({finishedProducts.length})
        </button>
        <button
          className={`btn ${activeSubTab === 'raw_materials' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveSubTab('raw_materials')}
        >
          <Layers size={14} /> Raw Materials & Inventory ({rawMaterials.length})
        </button>
        <button
          className={`btn ${activeSubTab === 'finishing_tasks' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveSubTab('finishing_tasks')}
        >
          <Scissors size={14} /> Finishing Tasks Configuration ({finishingTasks.length})
        </button>
        <button
          className={`btn ${activeSubTab === 'incentives' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveSubTab('incentives')}
        >
          <Scissors size={14} /> Employee Manufacturing Incentive Matrix ({productionEmployees.length})
        </button>
        <button
          className={`btn ${activeSubTab === 'employee_dues' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveSubTab('employee_dues')}
        >
          <Wallet size={14} /> Employee Dues {workPayments?.length > 0 && `(${workPayments.length})`}
        </button>
        <button
          className={`btn ${activeSubTab === 'payslips' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveSubTab('payslips')}
        >
          <FileText size={14} /> Monthly Payslips
        </button>
        <button
          className={`btn ${activeSubTab === 'purchase_orders' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveSubTab('purchase_orders')}
        >
          <Truck size={14} /> Purchase Orders
        </button>
      </div>

      {/* Search Input for Products or Raw Materials or Finishing Tasks */}
      {(activeSubTab === 'products' || activeSubTab === 'raw_materials' || activeSubTab === 'finishing_tasks') && (
        <div style={{ marginBottom: '16px', position: 'relative', maxWidth: '380px' }}>
          <Search
            size={16}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="search"
            className="form-input"
            style={{ paddingLeft: '36px' }}
            placeholder={`Search ${activeSubTab === 'products' ? 'product name or category...' : 'raw material or fabric...'}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 1: Products Catalog & Name Management
      ---------------------------------------------------- */}
      {activeSubTab === 'products' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Master Products Catalog</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Add new products to sell in POS or manufacture in bespoke bookings.
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setIsAddProductOpen(true)}>
              <Plus size={14} /> Add Product
            </button>
          </div>

          <div className="table-responsive products-table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>SKU / Barcode</th>
                  <th>Retail Price (MRP)</th>
                  <th>Cost Price</th>
                  <th>Ready to Deliver</th>
                  <th>Base Mfg Incentive</th>
                  <th>Assigned Employee</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((prod) => (
                  <tr key={prod.id}>
                    <td data-label="Product Name">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                        <span style={{ fontSize: '1.2rem' }}>{prod.image || '👔'}</span>
                        <input 
                          type="text" 
                          className="form-input" 
                          style={{ fontWeight: 700, padding: '4px 8px', minWidth: '150px', width: '100%' }}
                          defaultValue={prod.name} 
                          onBlur={(e) => {
                            if (e.target.value !== prod.name) {
                              updateProduct(prod.id, { name: e.target.value });
                            }
                          }}
                        />
                      </div>
                    </td>
                    <td data-label="Category">
                      <input 
                        type="text" 
                        className="form-input badge badge-primary" 
                        style={{ padding: '4px 8px', background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)', width: '130px', textAlign: 'center' }}
                        defaultValue={prod.category || 'General'} 
                        onBlur={(e) => {
                          if (e.target.value !== (prod.category || 'General')) {
                            updateProduct(prod.id, { category: e.target.value });
                          }
                        }}
                      />
                    </td>
                    <td data-label="SKU / Barcode">
                      <div className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {prod.sku}
                      </div>
                    </td>
                    <td data-label="Retail Price (MRP)">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: 'var(--text-main)' }}>₹</span>
                        <input 
                          type="number" min="1"
                          className="form-input font-mono" 
                          style={{ color: 'var(--text-main)', padding: '4px 8px', fontWeight: 'bold', width: '80px' }}
                          defaultValue={prod.price} 
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val !== prod.price) {
                              updateProduct(prod.id, { price: val });
                            }
                          }}
                        />
                      </div>
                    </td>
                    <td data-label="Cost Price">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>₹</span>
                        <input 
                          type="number" min="1"
                          className="form-input font-mono" 
                          style={{ color: 'var(--text-muted)', padding: '4px 8px', width: '80px' }}
                          defaultValue={prod.costPrice || 0} 
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val !== (prod.costPrice || 0)) {
                              updateProduct(prod.id, { costPrice: val });
                            }
                          }}
                        />
                      </div>
                    </td>
                    <td data-label="Ready to Deliver">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span
                          className="badge"
                          style={{ 
                            padding: '6px 12px', 
                            background: getReadyQuantity(prod.name) === 0 ? 'rgba(244,63,94,0.15)' : 'rgba(16,185,129,0.15)',
                            color: getReadyQuantity(prod.name) === 0 ? '#F43F5E' : '#10B981',
                            fontWeight: 700,
                            border: 'none',
                          }}
                        >
                          {getReadyQuantity(prod.name)} {prod.unit || 'Pcs'}
                        </span>
                      </div>
                    </td>
                    <td data-label="Base Mfg Incentive">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34D399', fontWeight: 700 }} className="font-mono">
                        ₹
                        <input 
                          type="number" min="1" 
                          className="form-input font-mono" 
                          style={{ color: '#34D399', padding: '4px 8px', fontWeight: 'bold' }}
                          defaultValue={prod.baseIncentive || 0.0} 
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val !== (prod.baseIncentive || 0)) {
                              updateProduct(prod.id, { baseIncentive: val });
                            }
                          }}
                        />
                      </div>
                    </td>
                    <td data-label="Assigned Employee">
                      <input 
                        type="text" 
                        className="form-input" 
                        style={{ padding: '4px 8px', width: '130px' }}
                        defaultValue={prod.assignedEmployee || 'Not Assigned'} 
                        onBlur={(e) => {
                          if (e.target.value !== (prod.assignedEmployee || 'Not Assigned')) {
                            updateProduct(prod.id, { assignedEmployee: e.target.value });
                          }
                        }}
                        placeholder="Not Assigned"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 2: Raw Materials Inventory Management
      ---------------------------------------------------- */}
      {activeSubTab === 'raw_materials' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Raw Materials & Sourcing Inventory</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Manage fabrics, threads, lining, buttons, and custom embellishments.
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setIsAddRawOpen(true)}>
              <Plus size={14} /> Add Raw Material
            </button>
          </div>

          <div className="table-responsive products-table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Material Name</th>
                  <th>Category</th>
                  <th>Unit Type</th>
                  <th>Unit Cost (₹)</th>
                  <th>Stock Available</th>
                  <th>SKU Code</th>
                </tr>
              </thead>
              <tbody>
                {filteredRaw.map((raw) => (
                  <tr key={raw.id}>
                    <td data-label="Material Name">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                        <span style={{ fontSize: '1.2rem' }}>{raw.image || '🧵'}</span>
                        <input 
                          type="text" 
                          className="form-input" 
                          style={{ fontWeight: 700, padding: '4px 8px', minWidth: '150px', width: '100%' }}
                          defaultValue={raw.name} 
                          onBlur={(e) => {
                            if (e.target.value !== raw.name) {
                              updateProduct(raw.id, { name: e.target.value });
                            }
                          }}
                        />
                      </div>
                    </td>
                    <td data-label="Category">
                      <input 
                        type="text" 
                        className="form-input badge badge-warning" 
                        style={{ padding: '4px 8px', background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)', width: '130px', textAlign: 'center' }}
                        defaultValue={raw.category || 'Raw Materials & Fabrics'} 
                        onBlur={(e) => {
                          if (e.target.value !== (raw.category || 'Raw Materials & Fabrics')) {
                            updateProduct(raw.id, { category: e.target.value });
                          }
                        }}
                      />
                    </td>
                    <td data-label="Unit Type">
                      <input 
                        type="text" 
                        className="form-input" 
                        style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '4px 8px', width: '80px', textAlign: 'center' }}
                        defaultValue={raw.unit || 'Meters'} 
                        onBlur={(e) => {
                          if (e.target.value !== (raw.unit || 'Meters')) {
                            updateProduct(raw.id, { unit: e.target.value });
                          }
                        }}
                      />
                    </td>
                    <td data-label="Unit Cost (₹)">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#34D399' }}>₹</span>
                        <input 
                          type="number" min="1"
                          className="form-input font-mono" 
                          style={{ color: '#34D399', padding: '4px 8px', fontWeight: 'bold', width: '80px' }}
                          defaultValue={raw.costPrice || raw.price || 0} 
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val !== (raw.costPrice || raw.price || 0)) {
                              updateProduct(raw.id, { costPrice: val });
                            }
                          }}
                        />
                      </div>
                    </td>
                    <td data-label="Stock Available">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input 
                          type="number" min="1"
                          className="form-input badge" 
                          style={{ 
                            padding: '4px 8px', 
                            background: (raw.stock || 0) <= (raw.minStock || 5) ? 'rgba(244,63,94,0.15)' : 'rgba(16,185,129,0.15)',
                            color: (raw.stock || 0) <= (raw.minStock || 5) ? '#F43F5E' : '#10B981',
                            fontWeight: 700,
                            border: 'none',
                            width: '80px'
                          }}
                          defaultValue={raw.stock || 0} 
                          onBlur={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val !== (raw.stock || 0)) {
                              updateProduct(raw.id, { stock: val });
                            }
                          }}
                        />
                        <span style={{ fontSize: '0.85rem' }}>{raw.unit || 'Meters'}</span>
                      </div>
                    </td>
                    <td data-label="SKU Code">
                      <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        {raw.sku}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* ----------------------------------------------------
          TAB 3: Finishing Tasks Configuration
      ---------------------------------------------------- */}
      {activeSubTab === 'finishing_tasks' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Scissors size={20} color="var(--primary-color)" /> Tailoring & Finishing Work Configuration
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                Set the default assigned employee and incentive for each finishing task. These defaults are auto-applied in the POS when a task is selected.
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => {
              setProdCategory('Finishing Task');
              setIsAddProductOpen(true);
            }}>
              <Plus size={16} /> Add Finishing Task
            </button>
          </div>

          <div className="table-responsive products-table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task Name</th>
                  <th>Base Mfg Incentive</th>
                  <th>Assigned Employee</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredFinishingTasks.map((task) => (
                  <tr key={task.id}>
                    <td data-label="Task Name">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                        <span style={{ fontSize: '1.2rem' }}>{task.image || '🪡'}</span>
                        <input 
                          type="text" 
                          className="form-input" 
                          style={{ fontWeight: 700, padding: '4px 8px', minWidth: '150px', width: '100%' }}
                          defaultValue={task.name} 
                          onBlur={(e) => {
                            if (e.target.value !== task.name) {
                              updateProduct(task.id, { name: e.target.value });
                            }
                          }}
                        />
                      </div>
                    </td>
                    <td data-label="Base Mfg Incentive">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34D399', fontWeight: 700 }} className="font-mono">
                        ₹
                        <input 
                          type="number" min="0"
                          className="form-input font-mono" 
                          style={{ color: '#34D399', padding: '4px 8px', fontWeight: 'bold', width: '80px' }}
                          defaultValue={task.baseIncentive || 0.0} 
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val !== (task.baseIncentive || 0)) {
                              updateProduct(task.id, { baseIncentive: val });
                            }
                          }}
                        />
                      </div>
                    </td>
                    <td data-label="Assigned Employee">
                      <select
                        className="form-input"
                        style={{ padding: '4px 8px', width: '180px' }}
                        value={task.assignedEmployee || 'Not Assigned'}
                        onChange={(e) => {
                          if (e.target.value !== (task.assignedEmployee || 'Not Assigned')) {
                            updateProduct(task.id, { assignedEmployee: e.target.value });
                          }
                        }}
                      >
                        <option value="Not Assigned">Not Assigned</option>
                        {productionEmployees.map((emp) => (
                          <option key={emp.id} value={emp.name}>{emp.name}</option>
                        ))}
                      </select>
                    </td>
                    <td data-label="Actions" style={{ textAlign: 'center' }}>
                      <button 
                        className="btn btn-sm" 
                        style={{ padding: '4px 8px', color: '#ef4444' }}
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete ${task.name}?`)) {
                            deleteProduct(task.id);
                          }
                        }}
                        title="Delete Task"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* ----------------------------------------------------
          TAB 3: Employee Manufacturing Incentive Matrix
      ---------------------------------------------------- */}
      {activeSubTab === 'incentives' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Scissors size={18} color="#34D399" />
                Employee Manufacturing Incentive Matrix
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Configure how much each employee gets paid (incentive in ₹) for manufacturing/making each product. These rates populate automatically when assigning employees during order booking!
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {productionEmployees.map((emp) => {
              const empMapping = { ...(emp.pieceRatePerItem || {}), ...(incentiveDrafts[emp.id] || {}) };
              return (
                <div
                  key={emp.id}
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ fontSize: '1.8rem' }}>{emp.avatar || '👤'}</div>
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: 800 }}>{emp.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {emp.role} • <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{emp.empId}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleSaveEmpIncentives(emp)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Save size={14} /> Save Incentive Rates for {emp.name.split(' ')[0]}
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
                    {finishedProducts.slice(0, 8).map((prod) => {
                      const currentIncentive = empMapping[prod.name] !== undefined
                        ? empMapping[prod.name]
                        : (prod.name.toLowerCase().includes('suit') ? 500 : prod.name.toLowerCase().includes('sherwani') ? 400 : 200);

                      return (
                        <div
                          key={prod.id}
                          style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '10px 12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <div style={{ overflow: 'hidden', flex: 1 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {prod.name}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                              Base Price: {formatCurrency(prod.price, currency)}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '0.8rem', color: '#34D399', fontWeight: 800 }}>₹</span>
                            <input
                              type="number" min="1"
                              step="10"
                              min="0"
                              className="form-input font-mono"
                              style={{ width: '80px', padding: '4px 6px', fontSize: '0.85rem', fontWeight: 700 }}
                              value={currentIncentive}
                              onChange={(e) => handleIncentiveChange(emp.id, prod.name, e.target.value)}
                              title={`Edit incentive rate for ${emp.name} making ${prod.name}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB: Employee Dues (Ready for Delivery Payments)
      ---------------------------------------------------- */}
      {activeSubTab === 'employee_dues' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={20} color="#10B981" /> Ready for Delivery — Employee Dues
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                Only production work attached to delivery-ready products appears here. Super Admin only can settle these payments.
              </p>
            </div>
          </div>

          {!workPayments || workPayments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <Wallet size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p style={{ fontWeight: 600 }}>No unsettled production payments.</p>
              <p style={{ fontSize: '0.85rem' }}>Payments will appear here once garments reach the "Ready for Delivery" stage.</p>
            </div>
          ) : (
            <div className="table-responsive products-table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Project / Garment</th>
                    <th>Quantity</th>
                    <th>Amount Due</th>
                    <th>Ready Since</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {workPayments.map((job) => (
                    <tr key={job.id}>
                      <td data-label="Employee"><strong>{job.employeeName}</strong></td>
                      <td data-label="Project">{job.projectName}</td>
                      <td data-label="Quantity">{job.quantity}</td>
                      <td data-label="Amount Due" style={{ color: '#F59E0B', fontWeight: 800 }}>
                        {formatCurrency(job.agreedAmount, currency)}
                      </td>
                      <td data-label="Ready Since">{job.readyAt || '—'}</td>
                      <td data-label="Action">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => settleWorkPayment(job.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                          <CheckCircle2Icon size={13} /> Settle Payment
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 5: Monthly Performance-Based Salary & Payslips
      ---------------------------------------------------- */}
      {activeSubTab === 'payslips' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="var(--primary-color)" /> Monthly Performance-Based Salary Calculation & Payslips
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                Calculate monthly salary based on attendance, incentives, overtime, bonuses & deductions. All values default to 0.
              </p>
            </div>
          </div>

          {/* Month / Year Selector */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px', padding: '12px 16px', background: 'var(--bg-muted)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Select Period:</label>
            <select
              className="form-input"
              style={{ width: '150px' }}
              value={payslipMonth}
              onChange={(e) => setPayslipMonth(Number(e.target.value))}
            >
              {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <input
              type="number"
              className="form-input"
              style={{ width: '100px' }}
              value={payslipYear}
              min="2020"
              max="2099"
              onChange={(e) => setPayslipYear(Number(e.target.value))}
            />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing payslips for <strong>{['January','February','March','April','May','June','July','August','September','October','November','December'][payslipMonth - 1]} {payslipYear}</strong>
            </span>
          </div>

          {/* Employee Payslip Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {productionEmployees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No active employees found. Add employees first.
              </div>
            ) : productionEmployees.map((emp) => {
              const draft = payslipDrafts[emp.id] || {};
              const daysPresent    = Number(draft.daysPresent    ?? 0);
              const overtimeHours  = Number(draft.overtimeHours  ?? 0);
              const bonuses        = Number(draft.bonuses        ?? 0);
              const deductions     = Number(draft.deductions     ?? 0);
              const incentiveTotal = Number(draft.incentiveTotal ?? 0);

              const baseSalary        = Number(emp.baseSalary)        || 0;
              const overtimeRate      = Number(emp.overtimeRatePerHour) || 0;
              const advanceDeduction  = Number(emp.advanceLoanDeductionPerMonth) || 0;

              const perDaySalary    = daysPresent > 0 ? (baseSalary / 26) * daysPresent : 0;
              const overtimePay     = overtimeHours * overtimeRate;
              const grossSalary     = perDaySalary + overtimePay + bonuses + incentiveTotal;
              const totalDeductions = deductions + advanceDeduction;
              const netSalary       = Math.max(0, grossSalary - totalDeductions);

              const isExpanded = expandedEmp === emp.id;

              const updateDraft = (field, value) => {
                setPayslipDrafts(prev => ({
                  ...prev,
                  [emp.id]: { ...(prev[emp.id] || {}), [field]: value }
                }));
              };

              return (
                <div key={emp.id} style={{ border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden', background: 'var(--bg-surface)' }}>
                  {/* Employee Summary Row */}
                  <div
                    onClick={() => setExpandedEmp(isExpanded ? null : emp.id)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', cursor: 'pointer', background: isExpanded ? 'var(--primary-light, #eef2ff)' : 'var(--bg-surface)', flexWrap: 'wrap', gap: '8px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '1.6rem' }}>{emp.avatar || '👤'}</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem' }}>{emp.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{emp.role} • {emp.empId}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Net Salary</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: netSalary > 0 ? '#059669' : '#334155' }}>
                          ₹{netSalary.toFixed(2)}
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                    </div>
                  </div>

                  {/* Expanded Payslip Detail */}
                  {isExpanded && (
                    <div style={{ padding: '16px 18px', borderTop: '1px solid var(--border-color)', background: '#fafafa' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>

                        {/* Days Present */}
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                            Days Present (out of 26)
                          </label>
                          <input
                            type="number" min="0" max="31"
                            className="form-input"
                            value={daysPresent}
                            onChange={(e) => updateDraft('daysPresent', e.target.value)}
                            placeholder="0"
                          />
                        </div>

                        {/* Overtime Hours */}
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                            Overtime Hours
                          </label>
                          <input
                            type="number" min="0"
                            className="form-input"
                            value={overtimeHours}
                            onChange={(e) => updateDraft('overtimeHours', e.target.value)}
                            placeholder="0"
                          />
                        </div>

                        {/* Incentive Total */}
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                            Total Incentives Earned (₹)
                          </label>
                          <input
                            type="number" min="0"
                            className="form-input"
                            value={incentiveTotal}
                            onChange={(e) => updateDraft('incentiveTotal', e.target.value)}
                            placeholder="0"
                          />
                        </div>

                        {/* Bonuses */}
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                            Bonus / Festival Pay (₹)
                          </label>
                          <input
                            type="number" min="0"
                            className="form-input"
                            value={bonuses}
                            onChange={(e) => updateDraft('bonuses', e.target.value)}
                            placeholder="0"
                          />
                        </div>

                        {/* Extra Deductions */}
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                            Extra Deductions (₹)
                          </label>
                          <input
                            type="number" min="0"
                            className="form-input"
                            value={deductions}
                            onChange={(e) => updateDraft('deductions', e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Salary Breakdown Summary */}
                      <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px 16px', marginBottom: '12px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '10px', color: '#1e3a8a' }}>
                          📊 Salary Breakdown — {['January','February','March','April','May','June','July','August','September','October','November','December'][payslipMonth - 1]} {payslipYear}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px', fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #e2e8f0' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Base Salary (Full Month)</span>
                            <strong>₹{baseSalary.toFixed(2)}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #e2e8f0' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Days Worked Pay ({daysPresent}/26)</span>
                            <strong>₹{perDaySalary.toFixed(2)}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #e2e8f0' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Overtime Pay ({overtimeHours}h × ₹{overtimeRate})</span>
                            <strong>₹{overtimePay.toFixed(2)}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #e2e8f0' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Incentives Earned</span>
                            <strong style={{ color: '#059669' }}>₹{incentiveTotal.toFixed(2)}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #e2e8f0' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Bonus / Festival Pay</span>
                            <strong style={{ color: '#059669' }}>₹{bonuses.toFixed(2)}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #e2e8f0' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Advance Loan Deduction</span>
                            <strong style={{ color: '#ef4444' }}>-₹{advanceDeduction.toFixed(2)}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #e2e8f0' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Extra Deductions</span>
                            <strong style={{ color: '#ef4444' }}>-₹{deductions.toFixed(2)}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Total Deductions</span>
                            <strong style={{ color: '#ef4444' }}>-₹{totalDeductions.toFixed(2)}</strong>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '2px solid #1e3a8a', fontSize: '1rem', fontWeight: 800 }}>
                          <span>🏦 Net Pay (Take Home)</span>
                          <span style={{ color: netSalary > 0 ? '#059669' : '#64748b', fontSize: '1.15rem' }}>₹{netSalary.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Print Button */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => window.print()}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Printer size={15} /> Print Payslip
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 4: Purchase Orders
      ---------------------------------------------------- */}
      {activeSubTab === 'purchase_orders' && (
        <PurchaseView />
      )}

      {/* Modal 1: Add New Product */}
      <Modal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        title="Super Admin • Add New Product Name"
        maxWidth="500px"
      >
        <form onSubmit={handleCreateProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="form-label">Product Name</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="e.g. Royal Silk Sherwani, Tuxedo Suit, Silk Kurta"
              value={prodName}
              onChange={(e) => setProdName(e.target.value)}
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="form-label">Category</label>
              <select className="form-select" value={prodCategory} onChange={(e) => setProdCategory(e.target.value)}>
                <option value="Suits & Blazers">Suits & Blazers</option>
                <option value="Formal Shirts">Formal Shirts</option>
                <option value="Trousers & Chinos">Trousers & Chinos</option>
                <option value="Ethnic & Festive">Ethnic & Festive</option>
                <option value="Bespoke Custom">Bespoke Custom</option>
              </select>
            </div>

            <div>
              <label className="form-label">Default Base Stock</label>
              <input
                type="number" min="1"
                min="0"
                className="form-input font-mono"
                value={prodStock}
                onChange={(e) => setProdStock(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="form-label">Retail Sale Price (₹)</label>
              <input
                type="number" min="1"
                step="0.01"
                min="0"
                className="form-input font-mono"
                required
                placeholder="e.g. 15000"
                value={prodPrice}
                onChange={(e) => setProdPrice(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Manufacturing Cost (₹)</label>
              <input
                type="number" min="1"
                step="0.01"
                min="0"
                className="form-input font-mono"
                placeholder="e.g. 4500"
                value={prodCost}
                onChange={(e) => setProdCost(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Standard Base Manufacturing Incentive (₹)</label>
            <input
              type="number" min="1"
              step="10"
              min="0"
              className="form-input font-mono"
              required
              placeholder="e.g. 500"
              value={prodBaseIncentive}
              onChange={(e) => setProdBaseIncentive(e.target.value)}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
              Base amount an employee gets for making this product if no custom rate is set.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddProductOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} /> Save Product to Catalog
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Add New Raw Material */}
      <Modal
        isOpen={isAddRawOpen}
        onClose={() => setIsAddRawOpen(false)}
        title="Super Admin • Add New Raw Material"
        maxWidth="500px"
      >
        <form onSubmit={handleCreateRawSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="form-label">Raw Material Name</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="e.g. Italian Super 140s Wool Fabric, Gold Zari Thread, Bemberg Lining"
              value={rawName}
              onChange={(e) => setRawName(e.target.value)}
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="form-label">Category</label>
              <select className="form-select" value={rawCategory} onChange={(e) => setRawCategory(e.target.value)}>
                <option value="Raw Fabrics">Raw Fabrics</option>
                <option value="Lining">Lining</option>
                <option value="Threads & Trims">Threads & Trims</option>
                <option value="Trims & Accessories">Trims & Accessories</option>
                <option value="Raw Materials">Raw Materials</option>
              </select>
            </div>

            <div>
              <label className="form-label">Unit Type</label>
              <select className="form-select" value={rawUnit} onChange={(e) => setRawUnit(e.target.value)}>
                <option value="Meters">Meters</option>
                <option value="Yards">Yards</option>
                <option value="Rolls">Rolls</option>
                <option value="Spools">Spools</option>
                <option value="Pieces">Pieces</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="form-label">Unit Purchase Cost (₹)</label>
              <input
                type="number" min="1"
                step="0.01"
                min="0"
                className="form-input font-mono"
                required
                placeholder="e.g. 1200"
                value={rawCost}
                onChange={(e) => setRawCost(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Initial Stock Qty</label>
              <input
                type="number" min="1"
                min="0"
                className="form-input font-mono"
                value={rawStock}
                onChange={(e) => setRawStock(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddRawOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} /> Save Raw Material
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SuperAdminView;
