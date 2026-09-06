import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { SearchableSelect } from '../common/SearchableSelect';
import { CustomerModal } from '../common/CustomerModal';
import { NewEmployeeModal } from '../employee/NewEmployeeModal';
import { ProductModal } from '../common/ProductModal';
import { COMMON_GARMENT_TYPES } from '../../data/garmentTypes';
import { CalendarCheck, DollarSign, Minus, Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const NewBookingModal = ({ isOpen, onClose }) => {
  const { customers, createOrderBooking, employees, currency, products } = useApp();

  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [garmentType, setGarmentType] = useState('Italian Bespoke 3-Piece Suit');
  const [fabricDetails, setFabricDetails] = useState('Super 140s Merino Wool (Midnight Blue)');
  const [trialDate, setTrialDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [totalAmount, setTotalAmount] = useState('35000.00');
  const [advancePaid, setAdvancePaid] = useState('15000.00');
  const [assignedEmployees, setAssignedEmployees] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeRoleFilter, setEmployeeRoleFilter] = useState('All');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [newGarmentName, setNewGarmentName] = useState('');

  const productionEmployees = employees.filter((employee) => {
    if ((employee.status || 'Active').toLowerCase() !== 'active') return false;
    const searchableRole = `${employee.role || ''} ${employee.department || ''}`.toLowerCase();
    return ['production', 'manufactur', 'tailor', 'cutter', 'stitch', 'wash', 'finish', 'qc', 'quality'].some((term) => searchableRole.includes(term));
  });
  const activeAssignedEmployees = productionEmployees.filter((employee) => assignedEmployees.includes(employee.id));
  const productionRoles = ['All', ...new Set(productionEmployees.map((employee) => employee.role).filter(Boolean))];
  const normalizedSearch = employeeSearch.trim().toLowerCase();
  const filteredEmployees = productionEmployees.filter((employee) => {
    const matchesRole = employeeRoleFilter === 'All' || employee.role === employeeRoleFilter;
    const searchableText = `${employee.name || ''} ${employee.role || ''} ${employee.department || ''}`.toLowerCase();
    return matchesRole && (!normalizedSearch || searchableText.includes(normalizedSearch));
  });
  const availableEmployees = filteredEmployees.filter((employee) => !assignedEmployees.includes(employee.id));

  const garmentOptions = [
    ...COMMON_GARMENT_TYPES.map((name) => ({ value: name, label: name })),
    ...products.map((product) => ({ value: product.name, label: product.name })),
  ].filter((option, index, options) => options.findIndex((item) => item.value === option.value) === index);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === customerId);

    await createOrderBooking({
      customerId,
      customerName: cust ? cust.name : 'Bespoke Client',
      customerPhone: cust ? cust.phone : 'N/A',
      garmentType,
      fabricDetails,
      trialDate: trialDate || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      deliveryDate: deliveryDate || new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      totalAmount: Number(totalAmount) || 0,
      advancePaid: Number(advancePaid) || 0,
      assignedEmployees: assignedEmployees.map((employeeId) => ({ employeeId })),
      specialInstructions,
    });

    onClose();
  };

  const balanceDue = Math.max(0, (Number(totalAmount) || 0) - (Number(advancePaid) || 0));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Book Custom Bespoke Tailoring Order"
      maxWidth="620px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label className="form-label">Client Name</label>
            <SearchableSelect
              value={customerId}
              onChange={setCustomerId}
              options={customers.map((customer) => ({
                value: customer.id,
                label: `${customer.name} (${customer.phone})`,
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
            <label className="form-label">Garment Type</label>
            <SearchableSelect
              value={garmentType}
              onChange={setGarmentType}
              options={garmentOptions}
              placeholder="Search garment type or product..."
              addNewLabel="Add new garment / product"
              onAddNew={(name) => {
                setNewGarmentName(name);
                setIsProductModalOpen(true);
              }}
              required
            />
          </div>
        </div>

        <div>
          <label className="form-label">Selected Fabric & Trims Details</label>
          <input
            type="text"
            className="form-input"
            required
            placeholder="e.g. Italian Wool 140s + Gold Bemberg Lining + Horn Buttons"
            value={fabricDetails}
            onChange={(e) => setFabricDetails(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label className="form-label">Trial Fitting Date</label>
            <input
              type="date"
              className="form-input"
              required
              value={trialDate}
              onChange={(e) => setTrialDate(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Final Delivery Date</label>
            <input
              type="date"
              className="form-input"
              required
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
          </div>
        </div>

        {/* Pricing & Advance Deposit Collection */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', background: 'var(--bg-surface-elevated)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
          <div>
            <label className="form-label">Total Agreed Price</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-input font-mono"
              required
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Advance Paid Now</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-input font-mono"
              required
              value={advancePaid}
              onChange={(e) => setAdvancePaid(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Balance Due on Delivery</label>
            <div style={{ padding: '8px 12px', fontSize: '1rem', fontWeight: 800, color: balanceDue > 0 ? '#F43F5E' : '#10B981', fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(balanceDue, currency)}
            </div>
          </div>
        </div>

        <div>
          <label className="form-label">Assigned Employees</label>
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px', background: 'var(--bg-surface-elevated)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Active Assigned</div>
            {activeAssignedEmployees.length === 0 ? (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', padding: '8px 0' }}>No employees assigned yet.</div>
            ) : (
              activeAssignedEmployees.map((employee) => (
                <div key={employee.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{employee.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{employee.role}</div>
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAssignedEmployees((previous) => previous.filter((id) => id !== employee.id))} title={`Remove ${employee.name}`} aria-label={`Remove ${employee.name}`}>
                    <Minus size={14} />
                  </button>
                </div>
              ))
            )}

            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', margin: '12px 0 6px' }}>Production Employees</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: '8px', marginBottom: '8px' }}>
              <input
                type="search"
                className="form-input"
                placeholder="Search active employees..."
                value={employeeSearch}
                onChange={(event) => setEmployeeSearch(event.target.value)}
              />
              <select className="form-select" value={employeeRoleFilter} onChange={(event) => setEmployeeRoleFilter(event.target.value)}>
                {productionRoles.map((role) => <option key={role} value={role}>{role === 'All' ? 'All production roles' : role}</option>)}
              </select>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
              Filter by task role: choose Cutter for cutting work, Master Tailor for stitching, or another production role.
            </div>
            {availableEmployees.length === 0 ? (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', padding: '8px 0' }}>No matching active production employees.</div>
            ) : (
              availableEmployees.map((employee) => (
                <div key={employee.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{employee.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{employee.role}</div>
                  </div>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setAssignedEmployees((previous) => [...previous, employee.id])} title={`Assign ${employee.name}`} aria-label={`Assign ${employee.name}`}>
                    <Plus size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <label className="form-label">Special Styling & Custom Notes</label>
          <textarea
            className="form-textarea"
            placeholder="Monogramming initials on left cuff, peaked lapel width, inner pocket sizing..."
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-lg" style={{ marginTop: '6px' }}>
          <CalendarCheck size={18} /> Book Order, Collect Advance & Post to Ledger
        </button>
      </form>
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        initialName={newCustomerName}
        onCustomerCreated={(customer) => setCustomerId(customer.id)}
      />
      <NewEmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        initialName={newEmployeeName}
        onEmployeeCreated={(employee) => setAssignedEmployees((previous) => [...new Set([...previous, employee.id])])}
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
