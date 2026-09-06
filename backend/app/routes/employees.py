from datetime import datetime
from flask import Blueprint, request, jsonify
from backend.app.models.employee import Employee, Attendance, EMPLOYEE_ROLES
from backend.app.models.booking import MasterJobAssignment
from backend.app.models.production import ProductionJob
from backend.app.models.ledger import LedgerEntry
from backend.app.extensions import db

employees_bp = Blueprint('employees', __name__)

@employees_bp.route('', methods=['POST'])
def create_employee():
    data = request.get_json() or {}
    role = data.get('role', 'Master Tailor')
    if role not in EMPLOYEE_ROLES:
        return jsonify({'error': f'Invalid role. Choose one of: {", ".join(EMPLOYEE_ROLES)}'}), 400
    employee = Employee(
        id=data.get('id') or f"EMP-{Employee.query.count() + 1:02d}",
        emp_id=data.get('empId') or f"TC-EMP-{Employee.query.count() + 1:02d}",
        name=data.get('name'),
        role=role,
        department=data.get('department'),
        phone=data.get('phone'),
        join_date=data.get('joinDate'),
        pay_type=data.get('payType', 'piece_rate'),
        base_salary=data.get('baseSalary', 500),
        piece_rate_unit=data.get('pieceRateUnit', 28.5),
        overtime_rate_per_hour=data.get('overtimeRatePerHour', 8),
        avatar=data.get('avatar', '👤'),
        status=data.get('status', 'Active'),
    )
    db.session.add(employee)
    db.session.commit()
    return jsonify(employee.to_dict()), 201

@employees_bp.route('', methods=['GET'])
def get_employees():
    employees = Employee.query.all()
    return jsonify([e.to_dict() for e in employees]), 200

@employees_bp.route('/<string:emp_id>', methods=['GET'])
def get_employee(emp_id):
    emp = Employee.query.filter((Employee.id == emp_id) | (Employee.emp_id == emp_id)).first()
    if not emp:
        return jsonify({'error': 'Employee not found'}), 404
    result = emp.to_dict()
    result['productionJobs'] = [job.to_dict() for job in ProductionJob.query.filter_by(employee_id=emp.id).order_by(ProductionJob.created_at.desc()).all()]
    return jsonify(result), 200


@employees_bp.route('/work-payments', methods=['GET'])
def get_work_payments():
    status = request.args.get('status', 'READY_FOR_PAYMENT')
    query = ProductionJob.query
    if status != 'all':
        query = query.filter_by(status=status)
    return jsonify([job.to_dict() for job in query.order_by(ProductionJob.ready_at.desc()).all()]), 200


@employees_bp.route('/work-payments/<string:job_id>/settle', methods=['POST'])
def settle_work_payment(job_id):
    job = ProductionJob.query.get(job_id)
    if not job:
        return jsonify({'error': 'Production job not found'}), 404
    if job.status != 'READY_FOR_PAYMENT':
        return jsonify({'error': 'Only ready-for-payment jobs can be settled'}), 400
    data = request.get_json() or {}
    job.status = 'PAID'
    job.paid_at = datetime.utcnow()
    job.payment_method = data.get('paymentMethod', 'Cash')
    db.session.commit()
    return jsonify(job.to_dict()), 200


@employees_bp.route('/<string:emp_id>/production-payout', methods=['POST'])
def settle_employee_production_balance(emp_id):
    employee = Employee.query.filter((Employee.id == emp_id) | (Employee.emp_id == emp_id)).first()
    if not employee:
        return jsonify({'error': 'Employee not found'}), 404

    data = request.get_json() or {}
    jobs = ProductionJob.query.filter_by(employee_id=employee.id, status='READY_FOR_PAYMENT').all()
    if not jobs:
        return jsonify({'error': 'This employee has no pending production balance'}), 400

    total_amount = sum(float(job.agreed_amount or 0) for job in jobs)
    payment_method = data.get('paymentMethod', 'Cash')
    paid_at = datetime.utcnow()
    for job in jobs:
        job.status = 'PAID'
        job.paid_at = paid_at
        job.payment_method = payment_method

    last_entry = LedgerEntry.query.order_by(LedgerEntry.created_at.desc()).first()
    previous_balance = float(last_entry.balance_after or 0) if last_entry else 0.0
    ledger_entry = LedgerEntry(
        id=f"LED-PAY-{int(paid_at.timestamp())}-{employee.id}",
        date=paid_at.strftime('%Y-%m-%d'),
        type='DEBIT',
        category='Production Employee Payout',
        party_type='Staff',
        party_name=employee.name,
        description=f'Production balance settled for {len(jobs)} completed task(s)',
        amount=total_amount,
        balance_after=previous_balance - total_amount,
        reference=f'PAY-{employee.emp_id}-{paid_at.strftime("%Y%m%d%H%M%S")}',
    )
    db.session.add(ledger_entry)

    # FIX 4: Also cash out any delivery-linked MasterJobAssignment incentives
    # that are waiting in READY_FOR_PAYROLL so they don't accumulate indefinitely.
    master_jobs = MasterJobAssignment.query.filter_by(
        master_id=employee.id, payout_status='READY_FOR_PAYROLL'
    ).all()
    for mj in master_jobs:
        mj.payout_status = 'PAID'
        mj.is_payment_settled = True

    db.session.commit()
    return jsonify({
        'employee': employee.to_dict(),
        'jobs': [job.to_dict() for job in jobs],
        'totalPaid': total_amount,
        'ledgerEntry': ledger_entry.to_dict(),
    }), 200

@employees_bp.route('/<string:emp_id>/salary', methods=['PUT', 'PATCH'])
def update_salary(emp_id):
    emp = Employee.query.filter((Employee.id == emp_id) | (Employee.emp_id == emp_id)).first()
    if not emp:
        return jsonify({'error': 'Employee not found'}), 404

    data = request.get_json() or {}
    if 'baseSalary' in data: emp.base_salary = data['baseSalary']
    if 'pieceRateUnit' in data: emp.piece_rate_unit = data['pieceRateUnit']
    if 'piecesCompletedThisMonth' in data: emp.pieces_completed_this_month = data['piecesCompletedThisMonth']
    if 'salesAchievedThisMonth' in data: emp.sales_achieved_this_month = data['salesAchievedThisMonth']
    if 'salesCommissionRate' in data: emp.sales_commission_rate = data['salesCommissionRate']
    if 'overtimeRatePerHour' in data: emp.overtime_rate_per_hour = data['overtimeRatePerHour']
    if 'performanceScore' in data: emp.performance_score = data['performanceScore']
    if 'advanceLoanDeductionPerMonth' in data: emp.advance_loan_deduction_per_month = data['advanceLoanDeductionPerMonth']

    db.session.commit()
    return jsonify(emp.to_dict()), 200

@employees_bp.route('/<string:emp_id>', methods=['PATCH'])
def update_employee(emp_id):
    emp = Employee.query.filter((Employee.id == emp_id) | (Employee.emp_id == emp_id)).first()
    if not emp:
        return jsonify({'error': 'Employee not found'}), 404
    data = request.get_json() or {}
    fields = {
        'name': 'name', 'role': 'role', 'department': 'department', 'phone': 'phone',
        'joinDate': 'join_date', 'payType': 'pay_type', 'status': 'status', 'avatar': 'avatar',
    }
    for source, target in fields.items():
        if source in data:
            if source == 'role' and data[source] not in EMPLOYEE_ROLES:
                return jsonify({'error': f'Invalid role. Choose one of: {", ".join(EMPLOYEE_ROLES)}'}), 400
            setattr(emp, target, data[source])
    db.session.commit()
    return jsonify(emp.to_dict()), 200

@employees_bp.route('/<string:emp_id>/advance-loan', methods=['POST'])
def grant_advance_loan(emp_id):
    emp = Employee.query.filter((Employee.id == emp_id) | (Employee.emp_id == emp_id)).first()
    if not emp:
        return jsonify({'error': 'Employee not found'}), 404

    data = request.get_json() or {}
    amount = float(data.get('amount', 0))
    deduction = float(data.get('monthlyDeduction', 50))

    emp.advance_loan_total = float(emp.advance_loan_total or 0) + amount
    emp.advance_loan_remaining = float(emp.advance_loan_remaining or 0) + amount
    emp.advance_loan_deduction_per_month = deduction

    db.session.commit()
    return jsonify(emp.to_dict()), 200

@employees_bp.route('/attendance', methods=['GET'])
def get_attendance():
    records = Attendance.query.order_by(Attendance.date.desc()).all()
    return jsonify([a.to_dict() for a in records]), 200

@employees_bp.route('/attendance', methods=['POST'])
def log_attendance():
    data = request.get_json() or {}
    record = Attendance(
        id=f"ATT-{Attendance.query.count() + 101}",
        emp_id=data.get('empId'),
        emp_name=data.get('empName'),
        date=data.get('date'),
        in_time=data.get('inTime', ''),
        out_time=data.get('outTime', ''),
        status=data.get('status', 'Present'),
        ot_hours=data.get('otHours', 0.0),
        notes=data.get('notes', ''),
    )
    db.session.add(record)
    db.session.commit()
    return jsonify(record.to_dict()), 201

@employees_bp.route('/attendance/<string:attendance_id>', methods=['PATCH'])
def update_attendance(attendance_id):
    record = Attendance.query.get(attendance_id)
    if not record:
        return jsonify({'error': 'Attendance record not found'}), 404

    data = request.get_json() or {}
    if data.get('action') == 'checkIn':
        record.in_time = datetime.now().strftime('%I:%M %p')
    elif data.get('action') == 'checkOut':
        record.out_time = datetime.now().strftime('%I:%M %p')

    if 'status' in data: record.status = data['status']
    if 'inTime' in data: record.in_time = data['inTime']
    if 'outTime' in data: record.out_time = data['outTime']
    if 'otHours' in data: record.ot_hours = data['otHours']
    if 'notes' in data: record.notes = data['notes']

    db.session.commit()
    return jsonify(record.to_dict()), 200
