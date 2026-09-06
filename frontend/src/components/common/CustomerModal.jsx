import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from './Modal';
import { UserCheck, UserPlus, Crown, Phone, Mail, MapPin } from 'lucide-react';

export const CustomerModal = ({ isOpen, onClose, onCustomerCreated, initialName = '' }) => {
  const { addCustomer, customers } = useApp();
  const [formData, setFormData] = useState({
    customId: '',
    name: '',
    phone: '',
    email: '',
    city: '',
    type: 'VIP Bespoke', // 'VIP Bespoke', 'Regular Retail', 'Wholesale Buyer'
    loyaltyPoints: 100,
    balanceReceivable: 0,
  });

  useEffect(() => {
    if (isOpen && initialName) setFormData((previous) => ({ ...previous, name: initialName }));
  }, [isOpen, initialName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const createdCust = await addCustomer(formData);
    if (onCustomerCreated) {
      onCustomerCreated(createdCust);
    }
    setFormData({
      customId: '',
      name: '',
      phone: '',
      email: '',
      city: '',
      type: 'VIP Bespoke',
      loyaltyPoints: 100,
      balanceReceivable: 0,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Client / VIP Customer Profile"
      maxWidth="580px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
          <div>
            <label className="form-label">Client Full Name</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="e.g. Jonathan Sterling, Priya Sharma"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Client Code / ID</label>
            <input
              type="text"
              className="form-input font-mono"
              placeholder="Auto (or e.g. CUST-04)"
              value={formData.customId}
              onChange={(e) => setFormData({ ...formData, customId: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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

          <div>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="client@luxury.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label className="form-label">Customer Classification</label>
            <select
              className="form-select"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="VIP Bespoke">VIP Bespoke Tailoring Client</option>
              <option value="Regular Retail">Regular Retail Customer</option>
              <option value="Wholesale Buyer">Wholesale / Corporate Buyer</option>
              <option value="Celebrity & Bridal">Celebrity & Bridal Couture</option>
            </select>
          </div>

          <div>
            <label className="form-label">City / Address</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Beverly Hills, Manhattan"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label className="form-label">Welcome Loyalty Points</label>
            <input
              type="number"
              className="form-input font-mono"
              value={formData.loyaltyPoints}
              onChange={(e) => setFormData({ ...formData, loyaltyPoints: Number(e.target.value) || 0 })}
            />
          </div>

          <div>
            <label className="form-label">Opening Balance Receivable (₹)</label>
            <input
              type="number"
              step="100"
              className="form-input font-mono"
              placeholder="0.00"
              value={formData.balanceReceivable}
              onChange={(e) => setFormData({ ...formData, balanceReceivable: Number(e.target.value) || 0 })}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" style={{ marginTop: '8px' }}>
          <UserPlus size={18} /> Register Client Profile & Save to Directory
        </button>
      </form>
    </Modal>
  );
};
