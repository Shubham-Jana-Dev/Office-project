import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Ruler,
  Save,
  FileText,
  UserCheck,
  Download,
  Scissors,
  Sparkles,
  Info,
  User,
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { exportTailorJobCardPDF } from '../../utils/pdfGenerator';
import { CustomerProfileModal } from '../customer/CustomerProfileModal';
import { CustomerModal } from '../common/CustomerModal';
import { SearchableSelect } from '../common/SearchableSelect';

export const MeasurementView = () => {
  const { customers, measurements, saveMeasurementProfile, measurementHubCustomerId, measurementHubField, setMeasurementHubCustomerId, setMeasurementHubField } = useApp();

  const [selectedCustId, setSelectedCustId] = useState(customers[0]?.id || '');
  const [garmentType, setGarmentType] = useState('Bespoke Suit & Shirt');
  const [activeMeasurementPoint, setActiveMeasurementPoint] = useState(null);
  const [is360ModalOpen, setIs360ModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');

  const selectedCustomerObj = customers.find((c) => c.id === selectedCustId) || customers[0];

  // Form Specs State (in inches)
  const [specs, setSpecs] = useState({
    collar: '16.5',
    chest: '40.5',
    waist: '34.0',
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
  });

  const [fitPreference, setFitPreference] = useState('Slim Tailored Fit');
  const [postureNotes, setPostureNotes] = useState(
    'Slightly sloping right shoulder; prefers 0.5" shirt cuff show beyond jacket sleeve.'
  );

  useEffect(() => {
    if (!measurementHubCustomerId) return;
    setSelectedCustId(measurementHubCustomerId);
    if (measurementHubField) setActiveMeasurementPoint(measurementHubField);
    const existing = measurements.find((measurement) => measurement.customerId === measurementHubCustomerId);
    if (existing) {
      setGarmentType(existing.garmentType || existing.suitType || 'Bespoke Suit & Shirt');
      setSpecs(existing.measurements || {});
      setFitPreference(existing.fitPreference || 'Slim Tailored Fit');
      setPostureNotes(existing.postureNotes || '');
    }
    setMeasurementHubCustomerId(null);
    setMeasurementHubField(null);
  }, [measurementHubCustomerId, measurementHubField, measurements, setMeasurementHubCustomerId, setMeasurementHubField]);

  // Load existing measurements when customer changes
  const handleCustomerChange = (custId) => {
    setSelectedCustId(custId);
    const existing = measurements.find((m) => m.customerId === custId);
    if (existing) {
      setGarmentType(existing.garmentType || 'Bespoke Suit & Shirt');
      setSpecs(existing.measurements || specs);
      setFitPreference(existing.fitPreference || 'Slim Tailored Fit');
      setPostureNotes(existing.postureNotes || '');
    }
  };

  const handleSpecChange = (key, value) => {
    setSpecs((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === selectedCustId);
    await saveMeasurementProfile({
      customerId: selectedCustId,
      customerName: cust ? cust.name : 'Client',
      garmentType,
      measurements: specs,
      fitPreference,
      postureNotes,
    });
  };

  const handleExportJobCard = () => {
    const cust = customers.find((c) => c.id === selectedCustId);
    const dummyBooking = {
      bookingNo: `MSR-JOB-${Math.floor(100 + Math.random() * 900)}`,
      garmentType,
      customerName: cust ? cust.name : 'Valued Client',
      customerPhone: cust ? cust.phone : 'N/A',
      trialDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      assignedMaster: 'Master Harun (Suit Specialist)',
      fabricDetails: 'Customer Selection Fabric',
      specialInstructions: `Fit: ${fitPreference}\nPosture Notes: ${postureNotes}`,
    };
    exportTailorJobCardPDF(dummyBooking, specs);
  };

  // Pins for visual mannequin
  const measurementPins = [
    { key: 'collar', label: 'Collar', top: '16%', left: '46%' },
    { key: 'shoulder', label: 'Shoulder', top: '22%', left: '72%' },
    { key: 'chest', label: 'Chest / Bust', top: '30%', left: '48%' },
    { key: 'sleeveLength', label: 'Sleeve', top: '38%', left: '84%' },
    { key: 'waist', label: 'Waist', top: '44%', left: '48%' },
    { key: 'hip', label: 'Hip', top: '54%', left: '48%' },
    { key: 'thigh', label: 'Thigh', top: '64%', left: '58%' },
    { key: 'inseam', label: 'Inseam', top: '74%', left: '52%' },
    { key: 'bottomHem', label: 'Hem Opening', top: '88%', left: '60%' },
  ];

  return (
    <div className="view-container">
      {/* Top Header */}
      <div className="responsive-header-row">
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Item Measurement & Tailoring Specs Hub</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Precision anthropometric measurement cards, visual body silhouette mapping, and Master Tailor Job Cards
          </p>
        </div>
        <div className="responsive-header-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setIs360ModalOpen(true)}
            style={{ color: 'var(--primary)', borderColor: 'var(--primary-border)' }}
          >
            <User size={15} /> Client 360° Hub
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportJobCard}>
            <Download size={15} /> Job Card (PDF)
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleSave}>
            <Save size={15} /> Save Profile
          </button>
        </div>
      </div>

      <div className="measurement-grid-layout">
        {/* Left: Interactive Mannequin / Visual Silhouette */}
        <div className="silhouette-canvas-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
            <Ruler size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Interactive Garment Silhouette</h3>
          </div>

          <div className="mannequin-wrapper">
            {/* SVG Mannequin Outline */}
            <svg
              viewBox="0 0 200 400"
              style={{ width: '100%', height: '100%', stroke: 'rgba(99, 102, 241, 0.4)', fill: 'rgba(99, 102, 241, 0.05)', strokeWidth: 2 }}
            >
              {/* Head & Neck */}
              <circle cx="100" cy="40" r="22" />
              <path d="M92 62 L92 78 L108 78 L108 62" />
              {/* Torso & Shoulders */}
              <path d="M92 78 L45 92 L30 160 L46 164 L58 115 L62 200 L138 200 L142 115 L154 164 L170 160 L155 92 L108 78 Z" />
              {/* Waist & Pelvis */}
              <path d="M62 200 L56 240 L144 240 L138 200 Z" />
              {/* Legs */}
              <path d="M56 240 L48 375 L80 375 L94 250 L106 250 L120 375 L152 375 L144 240 Z" />
            </svg>

            {/* Interactive Measurement Pins */}
            {measurementPins.map((pin) => (
              <div
                key={pin.key}
                className="measurement-pin"
                style={{
                  top: pin.top,
                  left: pin.left,
                  background: activeMeasurementPoint === pin.key ? '#F59E0B' : 'rgba(99, 102, 241, 0.9)',
                  color: activeMeasurementPoint === pin.key ? '#000' : '#FFF',
                  transform: activeMeasurementPoint === pin.key ? 'scale(1.2)' : 'none',
                }}
                onMouseEnter={() => setActiveMeasurementPoint(pin.key)}
                onMouseLeave={() => setActiveMeasurementPoint(null)}
              >
                {pin.label}: {specs[pin.key] || '—'}"
              </div>
            ))}
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '12px' }}>
            <Info size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            Hover over measurement pins to highlight body cutting points.
          </div>
        </div>

        {/* Right: Detailed Measurement Specs Form */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Scissors size={18} color="var(--primary)" />
              Client Profile & Measurement Specifications (Inches)
            </h3>
            <span className="badge badge-primary">{garmentType}</span>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Customer & Garment Selector */}
            <div className="form-grid-2">
              <div>
                <label className="form-label">Client Name</label>
                <SearchableSelect
                  value={selectedCustId}
                  onChange={handleCustomerChange}
                  options={customers.map((customer) => ({
                    value: customer.id,
                    label: `${customer.name} (${customer.type} - ${customer.phone})`,
                  }))}
                  placeholder="Search client name or phone..."
                  addNewLabel="Add new client"
                  onAddNew={(name) => {
                    setNewCustomerName(name);
                    setIsCustomerModalOpen(true);
                  }}
                  required
                />
              </div>

              <div>
                <label className="form-label">Garment Category Template</label>
                <select
                  className="form-select"
                  value={garmentType}
                  onChange={(e) => setGarmentType(e.target.value)}
                >
                  <option value="Bespoke Suit & Shirt">Bespoke 2-Piece / 3-Piece Suit & Shirt</option>
                  <option value="Formal Dress Shirt">Formal Dress Shirt</option>
                  <option value="Trousers & Chinos">Trousers & Chinos</option>
                  <option value="Silk Sherwani & Kurta">Silk Sherwani & Kurta Pajama</option>
                  <option value="Blazer / Tuxedo">Blazer / Tuxedo</option>
                  <option value="Custom Dress / Blouse">Custom Dress / Blouse</option>
                </select>
              </div>
            </div>

            {/* Upper Body Specs */}
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Upper Body Specifications
              </span>
              <div className="specs-input-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginTop: '8px' }}>
                {[
                  { key: 'collar', label: 'Collar (Neck)' },
                  { key: 'chest', label: 'Chest' },
                  { key: 'shoulder', label: 'Shoulder' },
                  { key: 'sleeveLength', label: 'Sleeve Length' },
                  { key: 'bicep', label: 'Bicep / Armhole' },
                  { key: 'wristCuff', label: 'Cuff / Wrist' },
                  { key: 'shirtLength', label: 'Shirt / Coat Length' },
                ].map((item) => (
                  <div
                    key={item.key}
                    style={{
                      background: activeMeasurementPoint === item.key ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-surface-elevated)',
                      padding: '8px',
                      borderRadius: 'var(--radius-md)',
                      border: activeMeasurementPoint === item.key ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    }}
                    onMouseEnter={() => setActiveMeasurementPoint(item.key)}
                    onMouseLeave={() => setActiveMeasurementPoint(null)}
                  >
                    <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: '2px' }}>
                      {item.label}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input font-mono"
                      style={{ padding: '6px', fontSize: '0.9rem', fontWeight: 700, textAlign: 'center' }}
                      value={specs[item.key] || ''}
                      onChange={(e) => handleSpecChange(item.key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Lower Body Specs */}
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Lower Body Specifications
              </span>
              <div className="specs-input-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginTop: '8px' }}>
                {[
                  { key: 'waist', label: 'Waist' },
                  { key: 'hip', label: 'Hip' },
                  { key: 'trouserLength', label: 'Outseam Length' },
                  { key: 'inseam', label: 'Inseam Length' },
                  { key: 'thigh', label: 'Thigh Circumference' },
                  { key: 'bottomHem', label: 'Bottom Hem Opening' },
                ].map((item) => (
                  <div
                    key={item.key}
                    style={{
                      background: activeMeasurementPoint === item.key ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-surface-elevated)',
                      padding: '8px',
                      borderRadius: 'var(--radius-md)',
                      border: activeMeasurementPoint === item.key ? '1px solid #10B981' : '1px solid var(--border-color)',
                    }}
                    onMouseEnter={() => setActiveMeasurementPoint(item.key)}
                    onMouseLeave={() => setActiveMeasurementPoint(null)}
                  >
                    <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: '2px' }}>
                      {item.label}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input font-mono"
                      style={{ padding: '6px', fontSize: '0.9rem', fontWeight: 700, textAlign: 'center' }}
                      value={specs[item.key] || ''}
                      onChange={(e) => handleSpecChange(item.key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Fit Preference & Tailor Notes */}
            <div className="form-grid-2">
              <div>
                <label className="form-label">Client Fit Preference</label>
                <select
                  className="form-select"
                  value={fitPreference}
                  onChange={(e) => setFitPreference(e.target.value)}
                >
                  <option value="Extra Slim Fit">Extra Slim Fit</option>
                  <option value="Slim Tailored Fit">Slim Tailored Fit</option>
                  <option value="Regular Classic Fit">Regular Classic Fit</option>
                  <option value="Relaxed Comfort Fit">Relaxed Comfort Fit</option>
                </select>
              </div>

              <div>
                <label className="form-label">Posture & Alteration Instructions</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Shoulder slope, chest dart preference, jacket vent styling..."
                  value={postureNotes}
                  onChange={(e) => setPostureNotes(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg">
              <Save size={18} /> Update & Save Customer Sizing Card
            </button>
          </form>
        </div>
      </div>

      {/* Customer 360° Profile & Sizing Hub Modal */}
      <CustomerProfileModal
        isOpen={is360ModalOpen}
        onClose={() => setIs360ModalOpen(false)}
        customer={selectedCustomerObj}
      />
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        initialName={newCustomerName}
        onCustomerCreated={(customer) => setSelectedCustId(customer.id)}
      />
    </div>
  );
};

