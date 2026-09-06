import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Users, Plus } from 'lucide-react';

export const NewEmployeeModal = ({ isOpen, onClose, onEmployeeCreated, initialName = '' }) => {
  const { addEmployee } = useApp();

  const [name, setName] = useState('');
  const [role, setRole] = useState('Master Tailor');
  const [department, setDepartment] = useState('Production & Bespoke');
  const [phone, setPhone] = useState('');
  const [payType, setPayType] = useState('piece_rate'); // piece_rate, fixed, commission_fixed
  const [baseSalary, setBaseSalary] = useState('600.00');
  const [overtimeRatePerHour, setOvertimeRatePerHour] = useState('8.00');

  React.useEffect(() => {
    if (isOpen && initialName) setName(initialName);
  }, [isOpen, initialName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const createdEmployee = await addEmployee({
      name,
      role,
      department,
      phone,
      payType,
      baseSalary: Number(baseSalary) || 500,
      overtimeRatePerHour: Number(overtimeRatePerHour) || 8,
    });
    if (onEmployeeCreated) onEmployeeCreated(createdEmployee);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Garment Craftsman / Employee Profile"
      maxWidth="550px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label className="form-label">Employee Full Name</label>
          <input
            type="text"
            className="form-input"
            required
            placeholder="e.g. Master Harun, Suresh Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label className="form-label">Job Role / Designation</label>
            <select className="form-select" required value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="Cutter">Cutter</option>
              <option value="Master Tailor">Master Tailor</option>
              <option value="Stitching">Stitching</option>
              <option value="Washing">Washing</option>
              <option value="Finishing">Finishing</option>
            </select>
          </div>
          <div>
            <label className="form-label">Department</label>
            <select
              className="form-select"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="Production & Bespoke">Production & Bespoke Tailoring</option>
              <option value="Cutting & Sizing">Cutting & Sizing</option>
              <option value="Showroom Sales">Showroom Sales & POS</option>
              <option value="Quality & Finishing">Quality Control & Finishing</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label className="form-label">Phone Number</label>
            <input
              type="text"
              className="form-input"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Salary Compensation Model</label>
            <select
              className="form-select"
              value={payType}
              onChange={(e) => setPayType(e.target.value)}
            >
              <option value="piece_rate">Piece-Rate per Item + Retainer</option>
              <option value="commission_fixed">Fixed Base + Sales Commission</option>
              <option value="fixed">Fixed Monthly Salary</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label className="form-label">Base Guaranteed Salary (₹)</label>
            <input
              type="number"
              step="100"
              className="form-input"
              required
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Overtime Hourly Rate (₹/hr)</label>
            <input
              type="number"
              step="10"
              className="form-input"
              required
              value={overtimeRatePerHour}
              onChange={(e) => setOvertimeRatePerHour(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" style={{ marginTop: '8px' }}>
          <Users size={18} /> Save Employee Profile
        </button>
      </form>
    </Modal>
  );
};
