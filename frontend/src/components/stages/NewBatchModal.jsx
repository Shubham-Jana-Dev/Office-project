import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { SearchableSelect } from '../common/SearchableSelect';
import { NewEmployeeModal } from '../employee/NewEmployeeModal';
import { ProductModal } from '../common/ProductModal';
import { GitBranch, Layers } from 'lucide-react';
import { STAGES_LIST } from '../../data/seedData';
import { COMMON_GARMENT_TYPES } from '../../data/garmentTypes';

export const NewBatchModal = ({ isOpen, onClose }) => {
  const { createProductBatch, employees, orderBookings, products } = useApp();

  const [garmentType, setGarmentType] = useState('Italian Bespoke 3-Piece Suit');
  const [clientName, setClientName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [targetDate, setTargetDate] = useState('');
  const [assignedTo, setAssignedTo] = useState(employees[0]?.name || 'Master Tailor');
  const [employeeAssignments, setEmployeeAssignments] = useState([
    { employeeId: employees[0]?.id || '', employeeName: employees[0]?.name || '', amount: 0 },
  ]);
  const [fabricCode, setFabricCode] = useState('FAB-WOOL-ITA');
  const [notes, setNotes] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [isNewEmployeeModalOpen, setIsNewEmployeeModalOpen] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [newGarmentName, setNewGarmentName] = useState('');

  const garmentOptions = [
    ...COMMON_GARMENT_TYPES.map((name) => ({ value: name, label: name })),
    ...products.map((product) => ({ value: product.name, label: product.name })),
  ].filter((option, index, options) => options.findIndex((item) => item.value === option.value) === index);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createProductBatch({
      garmentType,
      clientName: clientName.trim() || 'Showroom Stock Batch',
      quantity: Number(quantity) || 1,
      targetDate: targetDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      assignedTo,
      employees: employeeAssignments.filter((assignment) => assignment.employeeId || assignment.employeeName),
      fabricCode,
      notes,
      bookingId: bookingId || null,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Initiate Garment Production Batch / Job Lot"
      maxWidth="600px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label className="form-label">Garment Type / Product Description</label>
          <SearchableSelect
            value={garmentType}
            onChange={setGarmentType}
            options={garmentOptions}
            placeholder="Search garment or product name..."
            addNewLabel="Add new garment / product"
            onAddNew={(name) => {
              setNewGarmentName(name);
              setIsProductModalOpen(true);
            }}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label className="form-label">Client Name / Destination</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. VIP Alexander Wright or Showroom Stock"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Batch Quantity (Pieces)</label>
            <input
              type="number"
              min="1"
              className="form-input"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="form-label">Link to Order Booking (Optional)</label>
          <SearchableSelect
            value={bookingId}
            onChange={setBookingId}
            options={[
              { value: '', label: 'Standalone showroom / inventory batch' },
              ...orderBookings.filter((booking) => booking.status !== 'Delivered').map((booking) => ({
                value: booking.id,
                label: `${booking.bookingNo} - ${booking.customerName} - ${booking.garmentType}`,
              })),
            ]}
            placeholder="Search booking or client name..."
            addNewLabel="Add new booking"
            onAddNew={() => {}}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label className="form-label">Assigned Employees & Piece Pay</label>
            {employeeAssignments.map((assignment, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '6px', marginBottom: '6px' }}>
                <select className="form-select" value={assignment.employeeId} onChange={(e) => {
                  const employee = employees.find((item) => item.id === e.target.value);
                  setEmployeeAssignments((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, employeeId: e.target.value, employeeName: employee?.name || '' } : item));
                  if (index === 0) setAssignedTo(employee?.name || '');
                }}>
                  <option value="">Select employee</option>
                  {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} ({employee.role})</option>)}
                </select>
                <input className="form-input" type="number" min="0" placeholder="₹ pay" value={assignment.amount} onChange={(e) => setEmployeeAssignments((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, amount: Number(e.target.value) || 0 } : item))} />
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEmployeeAssignments((prev) => [...prev, { employeeId: '', employeeName: '', amount: 0 }])}>+ Add another employee</button>
          </div>

          <div>
            <label className="form-label">Target Completion Date</label>
            <input
              type="date"
              className="form-input"
              required
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="form-label">Fabric Batch & Material Specs</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Super 140s Wool (Navy), Silk Lining 2.5m"
            value={fabricCode}
            onChange={(e) => setFabricCode(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label">Styling & Cutting Instructions</label>
          <textarea
            className="form-textarea"
            placeholder="Special lapel canvas, buttonhole thread shade, cuff styling..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-lg" style={{ marginTop: '6px' }}>
          <Layers size={18} /> Launch Manufacturing Lot in Sourcing Stage
        </button>
      </form>
      <NewEmployeeModal
        isOpen={isNewEmployeeModalOpen}
        onClose={() => setIsNewEmployeeModalOpen(false)}
        initialName={newEmployeeName}
        onEmployeeCreated={(employee) => setAssignedTo(employee.name)}
      />
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        initialName={newGarmentName}
        onProductCreated={(product) => setGarmentType(product.name)}
      />
    </Modal>
  );
};
