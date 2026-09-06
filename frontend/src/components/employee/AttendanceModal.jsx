import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { SearchableSelect } from '../common/SearchableSelect';
import { NewEmployeeModal } from './NewEmployeeModal';
import { Clock, CheckCircle2 } from 'lucide-react';

export const AttendanceModal = ({ isOpen, onClose }) => {
  const { employees, logDailyAttendance } = useApp();

  const [empId, setEmpId] = useState(employees[0]?.empId || '');
  const [inTime, setInTime] = useState('09:00 AM');
  const [outTime, setOutTime] = useState('06:30 PM');
  const [status, setStatus] = useState('Present'); // Present, Absent, Half Day, Leave
  const [otHours, setOtHours] = useState('0.0');
  const [notes, setNotes] = useState('');
  const [isNewEmployeeModalOpen, setIsNewEmployeeModalOpen] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const emp = employees.find((e) => e.empId === empId || e.id === empId);

    logDailyAttendance({
      empId,
      empName: emp ? emp.name : 'Staff Member',
      inTime,
      outTime,
      status,
      otHours: Number(otHours) || 0,
      notes,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Clock-In & Attendance Logging"
      maxWidth="500px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label className="form-label">Employee</label>
          <SearchableSelect
            value={empId}
            onChange={setEmpId}
            options={employees.map((employee) => ({
              value: employee.empId,
              label: `${employee.name} (${employee.role})`,
            }))}
            placeholder="Search employee name..."
            addNewLabel="Add new employee"
            onAddNew={(name) => {
              setNewEmployeeName(name);
              setIsNewEmployeeModalOpen(true);
            }}
            required
          />
        </div>

        <div>
          <label className="form-label">Attendance Status</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {['Present', 'Half Day', 'Leave', 'Absent'].map((st) => (
              <button
                key={st}
                type="button"
                className={`btn ${status === st ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setStatus(st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label className="form-label">Clock-In Time</label>
            <input
              type="text"
              className="form-input"
              value={inTime}
              onChange={(e) => setInTime(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Clock-Out Time</label>
            <input
              type="text"
              className="form-input"
              value={outTime}
              onChange={(e) => setOutTime(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="form-label">Overtime Hours (OT)</label>
          <input
            type="number"
            step="0.5"
            min="0"
            className="form-input font-mono"
            value={otHours}
            onChange={(e) => setOtHours(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label">Shift Notes / Tasks Handled</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Suit fitting trial overtime, lot cutting"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-lg" style={{ marginTop: '8px' }}>
          <Clock size={18} /> Record Attendance Punch
        </button>
      </form>
      <NewEmployeeModal
        isOpen={isNewEmployeeModalOpen}
        onClose={() => setIsNewEmployeeModalOpen(false)}
        initialName={newEmployeeName}
        onEmployeeCreated={(employee) => setEmpId(employee.empId)}
      />
    </Modal>
  );
};
