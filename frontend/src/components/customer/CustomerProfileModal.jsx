import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import {
  Ruler,
  FileText,
  CalendarCheck,
  BookOpen,
  User,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Save,
  Download,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Scissors,
  Receipt,
  Clock,
  DollarSign,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportTailorJobCardPDF, exportInvoicePDF } from '../../utils/pdfGenerator';
import confetti from 'canvas-confetti';

// Standard Tailoring Baseline Presets (in inches)
const SIZE_PRESETS = {
  '38 (S - Slim)': {
    collar: '15.5',
    chest: '38.0',
    waist: '31.5',
    hip: '38.0',
    shoulder: '17.5',
    sleeveLength: '24.5',
    bicep: '13.5',
    wristCuff: '7.0',
    shirtLength: '29.0',
    trouserWaist: '31.0',
    trouserLength: '40.0',
    inseam: '31.0',
    thigh: '22.0',
    bottomHem: '14.0',
    fitPreference: 'Slim Tailored Fit',
  },
  '40 (M - Regular)': {
    collar: '16.5',
    chest: '40.5',
    waist: '34.0',
    hip: '40.5',
    shoulder: '18.5',
    sleeveLength: '25.0',
    bicep: '14.5',
    wristCuff: '7.5',
    shirtLength: '30.0',
    trouserWaist: '34.0',
    trouserLength: '41.5',
    inseam: '32.0',
    thigh: '23.5',
    bottomHem: '14.5',
    fitPreference: 'Tailored Regular Fit',
  },
  '42 (L - Comfort)': {
    collar: '17.0',
    chest: '42.5',
    waist: '36.5',
    hip: '43.0',
    shoulder: '19.0',
    sleeveLength: '25.5',
    bicep: '15.5',
    wristCuff: '8.0',
    shirtLength: '31.0',
    trouserWaist: '36.5',
    trouserLength: '42.0',
    inseam: '32.5',
    thigh: '25.0',
    bottomHem: '15.0',
    fitPreference: 'Tailored Regular Fit',
  },
  '44 (XL - Relaxed)': {
    collar: '17.5',
    chest: '45.0',
    waist: '39.5',
    hip: '45.5',
    shoulder: '19.8',
    sleeveLength: '26.0',
    bicep: '16.5',
    wristCuff: '8.5',
    shirtLength: '31.5',
    trouserWaist: '39.5',
    trouserLength: '42.5',
    inseam: '33.0',
    thigh: '26.5',
    bottomHem: '15.5',
    fitPreference: 'Comfort Relaxed Fit',
  },
  '46 (XXL - Husky)': {
    collar: '18.0',
    chest: '47.5',
    waist: '43.0',
    hip: '48.0',
    shoulder: '20.5',
    sleeveLength: '26.5',
    bicep: '17.5',
    wristCuff: '9.0',
    shirtLength: '32.0',
    trouserWaist: '43.0',
    trouserLength: '43.0',
    inseam: '33.0',
    thigh: '28.0',
    bottomHem: '16.0',
    fitPreference: 'Comfort Relaxed Fit',
  },
};

export const CustomerProfileModal = ({ isOpen, onClose, customer }) => {
  const {
    measurements,
    saveMeasurementProfile,
    salesOrders,
    orderBookings,
    ledgerEntries,
    updateBookingStatus,
    currency,
    openMeasurementHub,
  } = useApp();

  const [activeProfileTab, setActiveProfileTab] = useState('sizing'); // 'sizing' | 'bills' | 'bookings' | 'ledger'
  const [selectedGarmentType, setSelectedGarmentType] = useState('Bespoke Suit & Shirt');
  const [activeMeasurementField, setActiveMeasurementField] = useState('chest');
  const [isSizingBreakdownOpen, setIsSizingBreakdownOpen] = useState(false);

  // Sizing State
  const [sizingData, setSizingData] = useState({
    collar: '16.5',
    chest: '41.0',
    waist: '34.5',
    hip: '40.0',
    shoulder: '18.5',
    sleeveLength: '25.0',
    bicep: '14.5',
    wristCuff: '7.5',
    shirtLength: '30.0',
    trouserWaist: '34.0',
    trouserLength: '41.5',
    inseam: '32.0',
    thigh: '23.0',
    bottomHem: '14.5',
    fitPreference: 'Slim Tailored Fit',
    postureNotes: 'Slightly sloping right shoulder; prefers 0.5" shirt cuff show beyond jacket sleeve.',
  });

  // Load Customer's Existing Measurements if available
  useEffect(() => {
    if (customer) {
      const existing = measurements.find(
        (m) =>
          m.customerId === customer.id ||
          (m.customerName && m.customerName.toLowerCase() === customer.name.toLowerCase())
      );

      if (existing && existing.measurements) {
        setSizingData({
          collar: existing.measurements.collar || '16.0',
          chest: existing.measurements.chest || '40.0',
          waist: existing.measurements.waist || '34.0',
          hip: existing.measurements.hip || '40.0',
          shoulder: existing.measurements.shoulder || '18.0',
          sleeveLength: existing.measurements.sleeveLength || '25.0',
          bicep: existing.measurements.bicep || '14.0',
          wristCuff: existing.measurements.wristCuff || '7.5',
          shirtLength: existing.measurements.shirtLength || '30.0',
          trouserWaist: existing.measurements.trouserWaist || '34.0',
          trouserLength: existing.measurements.trouserLength || '41.0',
          inseam: existing.measurements.inseam || '32.0',
          thigh: existing.measurements.thigh || '23.0',
          bottomHem: existing.measurements.bottomHem || '14.5',
          fitPreference: existing.fitPreference || 'Tailored Regular Fit',
          postureNotes: existing.postureNotes || '',
        });
        if (existing.garmentType) {
          setSelectedGarmentType(existing.garmentType);
        }
      }
    }
  }, [customer, measurements]);

  if (!customer) return null;

  // Query Customer Cross-Module Data
  const customerSales = salesOrders.filter(
    (o) =>
      (o.customerId && o.customerId === customer.id) ||
      (o.customerName && o.customerName.toLowerCase() === customer.name.toLowerCase())
  );

  const customerBookings = orderBookings.filter(
    (b) =>
      (b.customerId && b.customerId === customer.id) ||
      (b.customerName && b.customerName.toLowerCase() === customer.name.toLowerCase())
  );

  const customerLedger = ledgerEntries.filter(
    (l) => l.partyName && l.partyName.toLowerCase().includes(customer.name.toLowerCase())
  );

  const totalSpent = customerSales.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalBalanceDue = customerBookings.reduce((sum, b) => sum + (b.balanceDue || 0), 0);
  const activeBookingsCount = customerBookings.filter((b) => b.status !== 'Delivered').length;

  // Nudge Measurement by +/- 0.5 inches
  const nudgeValue = (field, delta) => {
    const current = parseFloat(sizingData[field]) || 0;
    const nextVal = Math.max(0, current + delta).toFixed(1);
    setSizingData((prev) => ({ ...prev, [field]: nextVal }));
    setActiveMeasurementField(field);
  };

  // Apply Quick Preset
  const handleApplyPreset = (presetKey) => {
    const preset = SIZE_PRESETS[presetKey];
    if (preset) {
      setSizingData((prev) => ({
        ...prev,
        ...preset,
      }));
      confetti({
        particleCount: 25,
        spread: 40,
        origin: { y: 0.7 },
      });
    }
  };

  // Save Sizing to Central State
  const handleSaveSizing = (e) => {
    if (e) e.preventDefault();
    saveMeasurementProfile({
      customerId: customer.id,
      customerName: customer.name,
      garmentType: selectedGarmentType,
      fitPreference: sizingData.fitPreference,
      postureNotes: sizingData.postureNotes,
      measurements: {
        collar: sizingData.collar,
        chest: sizingData.chest,
        waist: sizingData.waist,
        hip: sizingData.hip,
        shoulder: sizingData.shoulder,
        sleeveLength: sizingData.sleeveLength,
        bicep: sizingData.bicep,
        wristCuff: sizingData.wristCuff,
        shirtLength: sizingData.shirtLength,
        trouserWaist: sizingData.trouserWaist,
        trouserLength: sizingData.trouserLength,
        inseam: sizingData.inseam,
        thigh: sizingData.thigh,
        bottomHem: sizingData.bottomHem,
      },
    });
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.8 },
    });
  };

  // Export Tailor Job Card PDF Ali brothers
  const handleExportJobCard = () => {
    const mockBooking = {
      bookingNo: `JOB-${customer.id}`,
      customerName: customer.name,
      customerPhone: customer.phone,
      garmentType: selectedGarmentType,
      fabricDetails: 'Customer Standard Sizing Spec Sheet',
      deliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      assignedMaster: 'Master Tailor Lead',
      specialInstructions: sizingData.postureNotes || 'Standard cutting pattern',
      advancePaid: 0,
      balanceDue: 0,
      totalAmount: 0,
    };
    exportTailorJobCardPDF(mockBooking, sizingData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Customer 360° Profile • ${customer.name}`}
      maxWidth="1020px"
    >
      <div className="profile-modal-content">
        {/* ----------------------------------------------------
            1. Customer Header & Lifetime Summary Card
        ---------------------------------------------------- */}
        <div className="profile-header-card">
          {/* User Info Left */}
          <div className="profile-user-left">
            <div className="profile-avatar-box">👤</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{customer.name}</h2>
                <span className="badge badge-primary font-mono" style={{ fontSize: '0.68rem' }}>
                  {customer.id}
                </span>
                <span className={`badge ${(customer.type || 'Standard Client').includes('VIP') ? 'badge-warning' : 'badge-cyan'}`}>
                  {customer.type || 'Standard Client'}
                </span>
              </div>
              <div className="profile-contact-row">
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={13} color="var(--primary)" /> {customer.phone}
                </span>
                {customer.email && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Mail size={13} color="var(--primary)" /> {customer.email}
                  </span>
                )}
                {customer.city && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={13} color="var(--primary)" /> {customer.city}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick KPI Stats Right */}
          <div className="profile-kpi-grid">
            <div className="profile-kpi-item">
              <div className="profile-kpi-label">Lifetime Spend</div>
              <strong className="profile-kpi-value" style={{ color: '#10B981' }}>
                {formatCurrency(totalSpent, currency)}
              </strong>
            </div>

            <div className="profile-kpi-item">
              <div className="profile-kpi-label">Balance Due</div>
              <strong
                className="profile-kpi-value"
                style={{ color: totalBalanceDue > 0 ? '#F43F5E' : '#10B981' }}
              >
                {formatCurrency(totalBalanceDue, currency)}
              </strong>
            </div>

            <div className="profile-kpi-item">
              <div className="profile-kpi-label">Loyalty Points</div>
              <strong className="profile-kpi-value" style={{ color: '#F59E0B' }}>
                {customer.loyaltyPoints || 0} pts
              </strong>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------
            2. Main Navigation Tabs for Customer 360
        ---------------------------------------------------- */}
        <div className="pos-category-pills profile-nav-tabs">
          <button
            className={`category-pill ${activeProfileTab === 'sizing' ? 'active' : ''}`}
            onClick={() => setActiveProfileTab('sizing')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Scissors size={14} />
            <span>Body Sizing & Specs</span>
          </button>

          <button
            className={`category-pill ${activeProfileTab === 'bills' ? 'active' : ''}`}
            onClick={() => setActiveProfileTab('bills')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Receipt size={14} />
            <span>Sales Bills ({customerSales.length})</span>
          </button>

          <button
            className={`category-pill ${activeProfileTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveProfileTab('bookings')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <CalendarCheck size={14} />
            <span>Custom Orders ({customerBookings.length})</span>
          </button>

          <button
            className={`category-pill ${activeProfileTab === 'ledger' ? 'active' : ''}`}
            onClick={() => setActiveProfileTab('ledger')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <BookOpen size={14} />
            <span>Account Ledger ({customerLedger.length})</span>
          </button>
        </div>

        {/* ----------------------------------------------------
            TAB 1: SIMPLIFIED BODY SIZING & TAILORING SPECS
        ---------------------------------------------------- */}
        {activeProfileTab === 'sizing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 1-Click Quick Sizing Presets Bar */}
            <div className="profile-presets-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} color="var(--primary)" />
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Quick Presets:
                </span>
              </div>
              <div className="profile-presets-list">
                {Object.keys(SIZE_PRESETS).map((presetKey) => (
                  <button
                    key={presetKey}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleApplyPreset(presetKey)}
                    title={`Auto-fill standard measurements for ${presetKey}`}
                    style={{ fontSize: '0.74rem', padding: '4px 8px', fontWeight: 600 }}
                  >
                    {presetKey}
                  </button>
                ))}
              </div>
            </div>

            {/* Garment Template Selector */}
            <div className="pos-category-pills profile-garment-pills">
              {[
                'Bespoke Suit & Shirt',
                'Formal 2-Piece Blazer',
                'Formal Shirt Only',
                'Trouser / Chinos',
                'Silk Sherwani & Kurta',
                'Waistcoat & Vest',
              ].map((garment) => (
                <button
                  key={garment}
                  type="button"
                  className={`category-pill ${selectedGarmentType === garment ? 'active' : ''}`}
                  onClick={() => setSelectedGarmentType(garment)}
                  style={{ fontSize: '0.78rem', padding: '5px 12px' }}
                >
                  {garment}
                </button>
              ))}
            </div>

            {/* 2-Column Sizing Layout: Inputs Left + Live Interactive Silhouette Right */}
            <div className="profile-sizing-layout">
              {/* Sizing Input Groups */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* 1. Upper Body */}
                <div className="card" style={{ padding: '14px' }}>
                  <h4
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: 'var(--primary)',
                      marginBottom: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    1. Upper Body Measurements (Inches)
                  </h4>
                  <div className="profile-specs-grid">
                    {[
                      { key: 'collar', label: 'Collar / Neck' },
                      { key: 'chest', label: 'Chest / Bust' },
                      { key: 'waist', label: 'Stomach / Waist' },
                      { key: 'hip', label: 'Seat / Hip' },
                      { key: 'shoulder', label: 'Shoulder Width' },
                      { key: 'sleeveLength', label: 'Sleeve Length' },
                      { key: 'bicep', label: 'Bicep / Armhole' },
                      { key: 'wristCuff', label: 'Wrist Cuff' },
                      { key: 'shirtLength', label: 'Jacket/Shirt Length' },
                    ].map((item) => (
                      <div
                        key={item.key}
                        onClick={() => setActiveMeasurementField(item.key)}
                        className={`profile-nudge-card ${
                          activeMeasurementField === item.key ? 'active' : 'inactive'
                        }`}
                      >
                        <label
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            display: 'block',
                            marginBottom: '2px',
                          }}
                        >
                          {item.label}
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            className="profile-nudge-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              nudgeValue(item.key, -0.5);
                            }}
                          >
                            <Minus size={11} />
                          </button>
                          <input
                            type="number"
                            step="0.1"
                            className="profile-spec-input font-mono"
                            value={sizingData[item.key] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSizingData((prev) => ({ ...prev, [item.key]: val }));
                            }}
                          />
                          <button
                            type="button"
                            className="profile-nudge-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              nudgeValue(item.key, 0.5);
                            }}
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Lower Body */}
                <div className="card" style={{ padding: '14px' }}>
                  <h4
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: 'var(--accent-emerald)',
                      marginBottom: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    2. Lower Body & Trouser Specs (Inches)
                  </h4>
                  <div className="profile-specs-grid">
                    {[
                      { key: 'trouserWaist', label: 'Trouser Waist' },
                      { key: 'trouserLength', label: 'Outseam Length' },
                      { key: 'inseam', label: 'Inseam / Crotch' },
                      { key: 'thigh', label: 'Thigh Width' },
                      { key: 'bottomHem', label: 'Ankle / Bottom Hem' },
                    ].map((item) => (
                      <div
                        key={item.key}
                        onClick={() => setActiveMeasurementField(item.key)}
                        className={`profile-nudge-card ${
                          activeMeasurementField === item.key ? 'active' : 'inactive'
                        }`}
                      >
                        <label
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            display: 'block',
                            marginBottom: '2px',
                          }}
                        >
                          {item.label}
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            className="profile-nudge-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              nudgeValue(item.key, -0.5);
                            }}
                          >
                            <Minus size={11} />
                          </button>
                          <input
                            type="number"
                            step="0.1"
                            className="profile-spec-input font-mono"
                            value={sizingData[item.key] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSizingData((prev) => ({ ...prev, [item.key]: val }));
                            }}
                          />
                          <button
                            type="button"
                            className="profile-nudge-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              nudgeValue(item.key, 0.5);
                            }}
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Fit Style Preference & Notes */}
                <div className="card" style={{ padding: '14px' }}>
                  <div className="profile-form-grid-2">
                    <div>
                      <label className="form-label">Fit Preference</label>
                      <select
                        className="form-select"
                        value={sizingData.fitPreference}
                        onChange={(e) =>
                          setSizingData({ ...sizingData, fitPreference: e.target.value })
                        }
                      >
                        <option value="Slim Tailored Fit">Slim Tailored Fit (Modern Cut)</option>
                        <option value="Tailored Regular Fit">Tailored Regular Fit (Classic)</option>
                        <option value="Comfort Relaxed Fit">Comfort Relaxed Fit (Generous)</option>
                        <option value="Italian Draped Fit">Italian Draped Fit (Soft Shoulder)</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Posture Quirks & Tailor Notes</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Sloping right shoulder; 0.5 in cuff show"
                        value={sizingData.postureNotes}
                        onChange={(e) =>
                          setSizingData({ ...sizingData, postureNotes: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive SVG Silhouette Guide Right */}
              <div className="silhouette-canvas-container profile-silhouette-box">
                <div className="profile-silhouette-header">
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Silhouette Blueprint
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsSizingBreakdownOpen((previous) => !previous)}
                    aria-expanded={isSizingBreakdownOpen}
                  >
                    <Ruler size={14} /> {isSizingBreakdownOpen ? 'Summary' : 'View Full Sizing'}
                  </button>
                </div>

                {/* SVG Silhouette with Interactive Measurement Pins */}
                <div className="profile-blueprint-canvas" style={{ position: 'relative' }}>
                  <svg viewBox="0 0 200 400" width="100%" height="100%" style={{ opacity: 0.85 }}>
                    {/* Head */}
                    <circle
                      cx="100"
                      cy="35"
                      r="20"
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="2"
                      strokeDasharray="3 3"
                    />
                    {/* Neck */}
                    <rect
                      x="92"
                      y="55"
                      width="16"
                      height="15"
                      fill="rgba(99, 102, 241, 0.15)"
                      stroke="var(--primary)"
                      strokeWidth="1.5"
                    />
                    {/* Torso */}
                    <path
                      d="M 60 70 L 140 70 L 130 180 L 70 180 Z"
                      fill="rgba(99, 102, 241, 0.1)"
                      stroke="var(--primary)"
                      strokeWidth="2"
                    />
                    {/* Arms */}
                    <path
                      d="M 60 70 L 40 180 L 50 185 L 68 85 Z"
                      fill="rgba(99, 102, 241, 0.08)"
                      stroke="var(--primary)"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M 140 70 L 160 180 L 150 185 L 132 85 Z"
                      fill="rgba(99, 102, 241, 0.08)"
                      stroke="var(--primary)"
                      strokeWidth="1.5"
                    />
                    {/* Legs */}
                    <path
                      d="M 70 180 L 65 370 L 92 370 L 98 220 L 102 220 L 108 370 L 135 370 L 130 180 Z"
                      fill="rgba(16, 185, 129, 0.08)"
                      stroke="#10B981"
                      strokeWidth="2"
                    />
                  </svg>

                  {/* Measurement Pins */}
                  <div
                    onClick={() => setActiveMeasurementField('chest')}
                    style={{
                      position: 'absolute',
                      top: '80px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background:
                        activeMeasurementField === 'chest' ? 'var(--accent-gold)' : 'var(--primary)',
                      color: '#000',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Chest {sizingData.chest}"
                  </div>

                  <div
                    onClick={() => setActiveMeasurementField('waist')}
                    style={{
                      position: 'absolute',
                      top: '120px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background:
                        activeMeasurementField === 'waist' ? 'var(--accent-gold)' : 'var(--primary)',
                      color: '#000',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Waist {sizingData.waist}"
                  </div>

                  <div
                    onClick={() => setActiveMeasurementField('trouserLength')}
                    style={{
                      position: 'absolute',
                      top: '240px',
                      right: '10px',
                      background:
                        activeMeasurementField === 'trouserLength'
                          ? 'var(--accent-gold)'
                          : '#10B981',
                      color: '#000',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Length {sizingData.trouserLength}"
                  </div>

                  {[
                    { key: 'collar', label: 'Collar', top: '42px', left: '50%' },
                    { key: 'bicep', label: 'Bicep', top: '132px', left: '0' },
                    { key: 'wristCuff', label: 'Cuff', top: '184px', left: '0' },
                    { key: 'thigh', label: 'Thigh', top: '218px', left: '50%' },
                    { key: 'bottomHem', label: 'Hem', top: '332px', left: '50%' },
                  ].map((pin) => (
                    <div
                      key={pin.key}
                      onClick={() => setActiveMeasurementField(pin.key)}
                      style={{
                        position: 'absolute',
                        top: pin.top,
                        left: pin.left,
                        transform: pin.left === '50%' ? 'translateX(-50%)' : undefined,
                        background: activeMeasurementField === pin.key ? 'var(--accent-gold)' : 'var(--primary)',
                        color: '#000',
                        padding: '2px 5px',
                        borderRadius: '10px',
                        fontSize: '0.6rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {pin.label} {sizingData[pin.key]}"
                    </div>
                  ))}
                </div>

                {isSizingBreakdownOpen && (
                  <div style={{ width: '100%', marginTop: '14px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Complete Upper & Body Specifications
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px' }}>
                      {[
                        ['collar', 'Collar / Neck'],
                        ['chest', 'Chest / Bust'],
                        ['waist', 'Stomach / Waist'],
                        ['hip', 'Seat / Hip'],
                        ['shoulder', 'Shoulder Width'],
                        ['sleeveLength', 'Sleeve Length'],
                        ['bicep', 'Bicep / Armhole'],
                        ['wristCuff', 'Wrist Cuff'],
                        ['shirtLength', 'Jacket/Shirt Length'],
                        ['trouserWaist', 'Trouser Waist'],
                        ['trouserLength', 'Outseam Length'],
                        ['inseam', 'Inseam / Crotch'],
                        ['thigh', 'Thigh Width'],
                        ['bottomHem', 'Ankle / Bottom Hem'],
                      ].map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          className={`btn btn-sm ${activeMeasurementField === key ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => {
                            setActiveMeasurementField(key);
                            openMeasurementHub(customer.id, key);
                            onClose();
                          }}
                          style={{ minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', textAlign: 'left', fontSize: '0.68rem', padding: '6px 8px', overflow: 'hidden' }}
                        >
                          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                          <strong className="font-mono" style={{ flexShrink: 0 }}>{sizingData[key]}&quot;</strong>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-dim)',
                    textAlign: 'center',
                    marginTop: '10px',
                  }}
                >
                  Click pins or fields on the left to edit.
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="profile-actions-bar">
              <button type="button" className="btn btn-secondary" onClick={handleExportJobCard}>
                <Download size={16} /> Export Tailor Job Card (PDF)
              </button>
              <button type="button" className="btn btn-primary btn-lg" onClick={handleSaveSizing}>
                <Save size={18} /> Save Customer Sizing Profile
              </button>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB 2: PAST SALES BILLS & INVOICES
        ---------------------------------------------------- */}
        {activeProfileTab === 'bills' && (
          <div>
            {/* Desktop Table View */}
            <div className="card table-responsive desktop-only-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Date</th>
                    <th>Purchased Items</th>
                    <th>Payment Method</th>
                    <th>Total Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customerSales.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No retail POS bills found for this customer yet.
                      </td>
                    </tr>
                  ) : (
                    customerSales.map((sale) => (
                      <tr key={sale.id}>
                        <td>
                          <strong className="font-mono" style={{ color: 'var(--primary)' }}>
                            {sale.invoiceNo || sale.id}
                          </strong>
                        </td>
                        <td>{formatDate(sale.date)}</td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                            {sale.items?.map((item) => `${item.name} (x${item.quantity})`).join(', ')}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-cyan" style={{ textTransform: 'uppercase' }}>
                            {sale.paymentMethod || 'Cash'}
                          </span>
                        </td>
                        <td>
                          <strong className="font-mono" style={{ color: '#10B981', fontSize: '0.95rem' }}>
                            {formatCurrency(sale.total, currency)}
                          </strong>
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => exportInvoicePDF(sale, currency)}
                            title="Download GST Invoice PDF"
                          >
                            <Download size={13} /> Invoice PDF
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards Format */}
            <div className="mobile-only-cards">
              {customerSales.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No retail POS bills found for this customer yet.
                </div>
              ) : (
                customerSales.map((sale) => (
                  <div key={sale.id} className="mobile-data-card">
                    {/* Top Row: Icon + Invoice No (Left) and Payment Mode + PDF Action (Right) */}
                    <div className="mobile-card-top">
                      <div className="mobile-card-badge-group">
                        <div className="mobile-card-icon-box">
                          <Receipt size={18} color="var(--primary)" />
                        </div>
                        <span className="badge badge-primary font-mono">{sale.invoiceNo || sale.id}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="badge badge-cyan" style={{ textTransform: 'uppercase' }}>
                          {sale.paymentMethod || 'Cash'}
                        </span>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px' }}
                          onClick={() => exportInvoicePDF(sale, currency)}
                          title="Download GST Invoice PDF"
                        >
                          <Download size={13} /> PDF
                        </button>
                      </div>
                    </div>

                    {/* Title & Subtitle */}
                    <div>
                      <h3 className="mobile-card-title">Retail POS Invoice</h3>
                      <div className="mobile-card-subtitle">
                        Date: {formatDate(sale.date)} • Paid via {sale.paymentMethod || 'Cash'}
                      </div>
                    </div>

                    {/* Details: Purchased Items */}
                    <div className="mobile-card-details">
                      <div>
                        Items: <strong style={{ color: 'var(--text-main)' }}>{sale.items?.map((item) => `${item.name} (x${item.quantity})`).join(', ') || 'None'}</strong>
                      </div>
                    </div>

                    {/* Dashed Separator */}
                    <div className="mobile-card-divider" />

                    {/* Footer Row */}
                    <div className="mobile-card-footer">
                      <span className="mobile-card-footer-label">Total Amount Paid:</span>
                      <span className="mobile-card-footer-value" style={{ color: '#10B981' }}>
                        {formatCurrency(sale.total, currency)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB 3: BESPOKE CUSTOM ORDERS & BOOKINGS
        ---------------------------------------------------- */}
        {activeProfileTab === 'bookings' && (
          <div>
            {/* Desktop Table View */}
            <div className="card table-responsive desktop-only-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Booking Ref</th>
                    <th>Garment & Fabric Specs</th>
                    <th>Trial Date</th>
                    <th>Delivery Date</th>
                    <th>Total Agreed</th>
                    <th>Advance Paid</th>
                    <th>Balance Due</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customerBookings.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No custom bespoke tailoring orders recorded for this customer.
                      </td>
                    </tr>
                  ) : (
                    customerBookings.map((bkg) => (
                      <tr key={bkg.id}>
                        <td>
                          <strong className="font-mono" style={{ color: 'var(--primary)' }}>
                            {bkg.bookingNo || bkg.id}
                          </strong>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{bkg.garmentType}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{bkg.fabricDetails}</div>
                        </td>
                        <td>
                          <span style={{ color: '#F59E0B', fontWeight: 600 }}>{formatDate(bkg.trialDate)}</span>
                        </td>
                        <td>
                          <strong>{formatDate(bkg.deliveryDate)}</strong>
                        </td>
                        <td>
                          <span className="font-mono">{formatCurrency(bkg.totalAmount, currency)}</span>
                        </td>
                        <td>
                          <span className="font-mono" style={{ color: '#10B981', fontWeight: 700 }}>
                            {formatCurrency(bkg.advancePaid, currency)}
                          </span>
                        </td>
                        <td>
                          <span
                            className="font-mono"
                            style={{
                              color: bkg.balanceDue > 0 ? '#F43F5E' : '#10B981',
                              fontWeight: 700,
                            }}
                          >
                            {formatCurrency(bkg.balanceDue, currency)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              bkg.status === 'Delivered'
                                ? 'badge-success'
                                : bkg.status === 'Ready for Trial'
                                ? 'badge-cyan'
                                : 'badge-primary'
                            }`}
                          >
                            {bkg.status}
                          </span>
                        </td>
                        <td>
                          {bkg.status !== 'Delivered' && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Collect remaining ${formatCurrency(bkg.balanceDue, currency)} and deliver?`
                                  )
                                ) {
                                  updateBookingStatus(bkg.id, 'Delivered', bkg.balanceDue);
                                }
                              }}
                            >
                              <CheckCircle2 size={13} /> Settle & Deliver
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards Format */}
            <div className="mobile-only-cards">
              {customerBookings.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No custom bespoke tailoring orders recorded for this customer.
                </div>
              ) : (
                customerBookings.map((bkg) => (
                  <div key={bkg.id} className="mobile-data-card">
                    {/* Top Row: Icon + Booking ID (Left) and Status (Right) */}
                    <div className="mobile-card-top">
                      <div className="mobile-card-badge-group">
                        <div className="mobile-card-icon-box">
                          <CalendarCheck size={18} color="#60A5FA" />
                        </div>
                        <span className="badge badge-primary font-mono">{bkg.bookingNo || bkg.id}</span>
                      </div>
                      <span
                        className={`badge ${
                          bkg.status === 'Delivered'
                            ? 'badge-success'
                            : bkg.status === 'Ready for Trial'
                            ? 'badge-cyan'
                            : 'badge-primary'
                        }`}
                      >
                        {bkg.status}
                      </span>
                    </div>

                    {/* Title & Subtitle */}
                    <div>
                      <h3 className="mobile-card-title">{bkg.garmentType}</h3>
                      <div className="mobile-card-subtitle">
                        Trial: {formatDate(bkg.trialDate)} • Delivery: {formatDate(bkg.deliveryDate)}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="mobile-card-details">
                      <div>
                        Fabric Specs: <strong style={{ color: 'var(--text-main)' }}>{bkg.fabricDetails || 'Standard'}</strong>
                      </div>
                      <div className="mobile-card-details-row">
                        <span>Total Agreed:</span>
                        <span className="font-mono" style={{ fontWeight: 600 }}>{formatCurrency(bkg.totalAmount, currency)}</span>
                      </div>
                      <div className="mobile-card-details-row">
                        <span>Advance Paid:</span>
                        <span className="font-mono" style={{ color: '#10B981', fontWeight: 700 }}>{formatCurrency(bkg.advancePaid, currency)}</span>
                      </div>
                    </div>

                    {bkg.status !== 'Delivered' && (
                      <div style={{ marginTop: '2px' }}>
                        <button
                          className="btn btn-success btn-sm"
                          style={{ width: '100%', justifyContent: 'center' }}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Collect remaining ${formatCurrency(bkg.balanceDue, currency)} and deliver?`
                              )
                            ) {
                              updateBookingStatus(bkg.id, 'Delivered', bkg.balanceDue);
                            }
                          }}
                        >
                          <CheckCircle2 size={13} /> Settle & Deliver
                        </button>
                      </div>
                    )}

                    {/* Dashed Separator */}
                    <div className="mobile-card-divider" />

                    {/* Footer Row */}
                    <div className="mobile-card-footer">
                      <span className="mobile-card-footer-label">Balance Due:</span>
                      <span
                        className="mobile-card-footer-value"
                        style={{ color: bkg.balanceDue > 0 ? '#F43F5E' : '#10B981' }}
                      >
                        {formatCurrency(bkg.balanceDue, currency)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB 4: ACCOUNT LEDGER & TRANSACTIONS
        ---------------------------------------------------- */}
        {activeProfileTab === 'ledger' && (
          <div>
            {/* Desktop Table View */}
            <div className="card table-responsive desktop-only-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Ref No</th>
                    <th>Transaction Description</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Balance Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {customerLedger.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No direct ledger journal entries found for this customer.
                      </td>
                    </tr>
                  ) : (
                    customerLedger.map((entry) => (
                      <tr key={entry.id}>
                        <td>{formatDate(entry.date)}</td>
                        <td>
                          <span className="badge badge-primary font-mono">{entry.refNo || entry.id}</span>
                        </td>
                        <td>{entry.description}</td>
                        <td>
                          <span className={`badge ${entry.type === 'Debit' ? 'badge-danger' : 'badge-success'}`}>
                            {entry.type}
                          </span>
                        </td>
                        <td>
                          <strong className="font-mono">{formatCurrency(entry.amount, currency)}</strong>
                        </td>
                        <td>
                          <span className="font-mono" style={{ color: entry.balance > 0 ? '#F43F5E' : '#10B981' }}>
                            {formatCurrency(entry.balance || 0, currency)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards Format */}
            <div className="mobile-only-cards">
              {customerLedger.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No direct ledger journal entries found for this customer.
                </div>
              ) : (
                customerLedger.map((entry) => (
                  <div key={entry.id} className="mobile-data-card">
                    {/* Top Row: Icon + Ref No (Left) and Dr/Cr Type (Right) */}
                    <div className="mobile-card-top">
                      <div className="mobile-card-badge-group">
                        <div className="mobile-card-icon-box">
                          <BookOpen size={18} color="#A78BFA" />
                        </div>
                        <span className="badge badge-primary font-mono">{entry.refNo || entry.id}</span>
                      </div>
                      <span className={`badge ${entry.type === 'Debit' ? 'badge-danger' : 'badge-success'}`}>
                        {entry.type}
                      </span>
                    </div>

                    {/* Title & Subtitle */}
                    <div>
                      <h3 className="mobile-card-title">{entry.description || 'Ledger Entry'}</h3>
                      <div className="mobile-card-subtitle">
                        Date: {formatDate(entry.date)}
                      </div>
                    </div>

                    {/* Details: Amount */}
                    <div className="mobile-card-details">
                      <div className="mobile-card-details-row">
                        <span>Voucher Amount:</span>
                        <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                          {formatCurrency(entry.amount, currency)}
                        </span>
                      </div>
                    </div>

                    {/* Dashed Separator */}
                    <div className="mobile-card-divider" />

                    {/* Footer Row */}
                    <div className="mobile-card-footer">
                      <span className="mobile-card-footer-label">Balance Remaining:</span>
                      <span
                        className="mobile-card-footer-value"
                        style={{ color: entry.balance > 0 ? '#F43F5E' : '#10B981' }}
                      >
                        {formatCurrency(entry.balance || 0, currency)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
