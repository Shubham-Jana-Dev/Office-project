import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Building2, Plus } from 'lucide-react';

export const VendorModal = ({ isOpen, onClose, onVendorCreated, initialName = '' }) => {
  const { addVendor } = useApp();
  const [formData, setFormData] = useState({
    customId: '',
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    city: '',
    gstin: '',
    category: 'Cotton & Linen Fabrics',
    balancePayable: 0,
    rating: 5.0,
  });

  React.useEffect(() => {
    if (isOpen && initialName) setFormData((previous) => ({ ...previous, name: initialName }));
  }, [isOpen, initialName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const vendor = await addVendor(formData);
    onVendorCreated?.(vendor);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Supplier / Textile Mill Partner"
      maxWidth="580px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
          <div>
            <label className="form-label">Vendor / Mill Company Name</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="e.g. Raymond Mills, Surat Zari & Textile"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Vendor Code / ID</label>
            <input
              type="text"
              className="form-input font-mono"
              placeholder="Auto (or e.g. VEN-04)"
              value={formData.customId}
              onChange={(e) => setFormData({ ...formData, customId: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label className="form-label">Contact Person</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="e.g. Rajesh Kumar"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Phone Number</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="+1 (555) 000-0000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="supplier@textiles.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">City / Hub</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Mumbai, New York"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label className="form-label">Supply Category</label>
            <select
              className="form-select"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="Cotton & Linen Fabrics">Cotton & Linen Fabrics</option>
              <option value="Merino Wool & Suiting">Merino Wool & Suiting</option>
              <option value="Raw Silk & Ethnic Textiles">Raw Silk & Ethnic Textiles</option>
              <option value="Buttons, Zippers & Haberdashery">Buttons, Zippers & Haberdashery</option>
              <option value="Ready Garments">Ready Garments</option>
            </select>
          </div>

          <div>
            <label className="form-label">GSTIN / Tax ID</label>
            <input
              type="text"
              className="form-input"
              placeholder="27AABCU9603R1ZM"
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" style={{ marginTop: '8px' }}>
          <Building2 size={18} /> Add Supplier to Registry
        </button>
      </form>
    </Modal>
  );
};
