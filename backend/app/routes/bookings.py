from datetime import datetime
from flask import Blueprint, request, jsonify
from backend.app.models.booking import OrderBooking, MasterJobAssignment
from backend.app.models.employee import Employee
from backend.app.models.ledger import LedgerEntry, ProductStage
from backend.app.models.production import ProductionJob
from backend.app.extensions import db

bookings_bp = Blueprint('bookings', __name__)


def _assigned_employees(data):
    """Normalize legacy assignedMaster and new assignedEmployees payloads."""
    raw_assignments = data.get('assignedEmployees')
    if raw_assignments is None:
        raw_assignments = data.get('assigned_employees')
    if raw_assignments is None and data.get('assignedMaster'):
        raw_assignments = [data['assignedMaster']]

    assignments = []
    for assignment in raw_assignments or []:
        if isinstance(assignment, str):
            employee = Employee.query.filter(Employee.name == assignment).first()
            assignments.append({
                'employeeId': employee.id if employee else None,
                'employeeName': employee.name if employee else assignment,
                'role': employee.role if employee else None,
            })
            continue

        employee_key = assignment.get('employeeId') or assignment.get('id') or assignment.get('empId')
        employee = Employee.query.filter(
            (Employee.id == employee_key) | (Employee.emp_id == employee_key)
        ).first() if employee_key else None
        employee_name = assignment.get('employeeName') or assignment.get('name')
        if not employee and employee_name:
            employee = Employee.query.filter(Employee.name == employee_name).first()
        if not employee_name and employee:
            employee_name = employee.name
        if employee_name:
            assignments.append({
                'employeeId': employee.id if employee else employee_key,
                'employeeName': employee_name,
                'role': assignment.get('role') or (employee.role if employee else None),
            })
    return assignments


def _replace_booking_jobs(booking, assignments):
    MasterJobAssignment.query.filter_by(booking_id=booking.id).delete(synchronize_session='fetch')
    garment = booking.garment_type.lower()
    incentive = 500.00 if 'suit' in garment else 400.00 if 'sherwani' in garment else 200.00
    for index, assignment in enumerate(assignments):
        db.session.add(MasterJobAssignment(
            id=f"JOB-{booking.id}-{index + 1}",
            booking_id=booking.id,
            master_id=assignment.get('employeeId'),
            master_name=assignment['employeeName'],
            garment_type=booking.garment_type,
            incentive_rate=assignment.get('incentiveRate', incentive),
            work_status='ASSIGNED',
            payout_status='PENDING_DELIVERY',
        ))

@bookings_bp.route('', methods=['GET'])
def get_bookings():
    bookings = OrderBooking.query.order_by(OrderBooking.created_at.desc()).all()
    return jsonify([b.to_dict() for b in bookings]), 200

@bookings_bp.route('/<string:booking_id>', methods=['GET'])
def get_booking(booking_id):
    booking = OrderBooking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    return jsonify(booking.to_dict()), 200

@bookings_bp.route('/<string:booking_id>', methods=['PATCH'])
def update_booking(booking_id):
    booking = OrderBooking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404

    data = request.get_json() or {}
    if 'status' in data: booking.status = data['status']
    if 'assignedEmployees' in data or 'assigned_employees' in data or 'assignedMaster' in data:
        assignments = _assigned_employees(data)
        booking.assigned_employees = assignments
        booking.assigned_master = assignments[0]['employeeName'] if assignments else None
        _replace_booking_jobs(booking, assignments)
    if data.get('balancePaidNow'):
        amount = float(data['balancePaidNow'])
        booking.advance_paid = float(booking.advance_paid or 0) + amount
        booking.balance_due = max(0, float(booking.balance_due or 0) - amount)

    db.session.commit()
    return jsonify(booking.to_dict()), 200

@bookings_bp.route('', methods=['POST'])
def create_booking():
    data = request.get_json() or {}
    new_id = data.get('id') or f"BKG-2026-{OrderBooking.query.count() + 101}"
    booking_no = data.get('bookingNo') or f"BK-{OrderBooking.query.count() + 101}"
    
    assignments = _assigned_employees(data)
    booking = OrderBooking(
        id=new_id,
        booking_no=booking_no,
        customer_id=data.get('customerId'),
        customer_name=data.get('customerName', 'Guest Client'),
        customer_phone=data.get('customerPhone'),
        garment_type=data.get('garmentType', 'Custom Tailoring'),
        fabric_details=data.get('fabricDetails'),
        booking_date=data.get('bookingDate', datetime.utcnow().strftime('%Y-%m-%d')),
        trial_date=data.get('trialDate'),
        delivery_date=data.get('deliveryDate'),
        total_amount=data.get('totalAmount', 0.0),
        advance_paid=data.get('advancePaid', 0.0),
        balance_due=data.get('balanceDue', 0.0),
        status=data.get('status', 'In Production'),
        assigned_master=assignments[0]['employeeName'] if assignments else data.get('assignedMaster'),
        assigned_employees=assignments,
        special_instructions=data.get('specialInstructions'),
        measurement_id=data.get('measurementId'),
    )
    db.session.add(booking)

    initial_stage = data.get('initialStage', 'Fabric Sourcing & Inward')
    db.session.add(ProductStage(
        id=f"STG-{new_id}",
        batch_no=f"LOT-{booking_no}",
        booking_id=new_id,
        client_name=data.get('customerName', 'Guest Client'),
        garment_type=data.get('garmentType', 'Custom Tailoring'),
        quantity=1,
        current_stage=initial_stage,
        assigned_to=assignments[0]['employeeName'] if assignments else None,
        start_date=data.get('bookingDate', datetime.utcnow().strftime('%Y-%m-%d')),
        target_date=data.get('deliveryDate'),
        progress=15,
        qc_status='In Progress',
        notes=data.get('specialInstructions', ''),
        history=[{
            'stage': initial_stage,
            'date': datetime.utcnow().strftime('%Y-%m-%d'),
            'status': 'Active',
            'by': assignments[0]['employeeName'] if assignments else 'Supervisor',
        }],
    ))

    # Automatically create a MasterJobAssignment tracking delivery-linked bonus
    _replace_booking_jobs(booking, assignments)

    # FIX 1: Create ProductionJob (IN_PROGRESS) for each assigned employee so
    # their Production & Earnings History is populated from the moment of booking.
    garment_lower = data.get('garmentType', '').lower()
    piece_rate = 500.00 if 'suit' in garment_lower else 400.00 if 'sherwani' in garment_lower else 200.00
    booking_stage_id = f"STG-{new_id}"
    for idx, assignment in enumerate(assignments):
        db.session.add(ProductionJob(
            id=f"PJOB-{new_id}-{idx + 1}",
            stage_id=booking_stage_id,
            employee_id=assignment.get('employeeId'),
            employee_name=assignment['employeeName'],
            project_name=data.get('garmentType', 'Custom Tailoring'),
            quantity=1,
            agreed_amount=piece_rate,
            status='IN_PROGRESS',
        ))

    db.session.commit()
    return jsonify(booking.to_dict()), 201

@bookings_bp.route('/<string:booking_id>/deliver-and-settle', methods=['POST'])
def deliver_and_settle(booking_id):
    """
    CRITICAL BUSINESS TRIGGER:
    Order is marked as DELIVERED and balance payment is SETTLED.
    This unlocks the Master Tailor's performance incentive for the current payroll month!
    """
    booking = OrderBooking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404

    booking.status = 'Delivered'
    prev_balance = float(booking.balance_due)
    booking.advance_paid = float(booking.total_amount)
    booking.balance_due = 0.0

    current_month = datetime.utcnow().strftime('%B %Y') # e.g. "September 2026"

    # Unlock linked master jobs
    jobs = MasterJobAssignment.query.filter_by(booking_id=booking_id).all()
    unlocked_jobs = []
    for job in jobs:
        job.work_status = 'COMPLETED'
        job.is_delivered = True
        job.is_payment_settled = True
        job.delivered_at = datetime.utcnow()
        job.payout_status = 'READY_FOR_PAYROLL'
        job.payroll_month = current_month
        unlocked_jobs.append(job.to_dict())

        # If employee exists, increment their delivered pieces count
        if job.master_id:
            emp = Employee.query.get(job.master_id)
            if emp:
                emp.pieces_completed_this_month = (emp.pieces_completed_this_month or 0) + 1

    linked_stages = ProductStage.query.filter_by(booking_id=booking_id).all()
    stage_ids = [s.id for s in linked_stages]
    for stage in linked_stages:
        stage.current_stage = 'Showroom / Ready Stock'
        stage.progress = 100
        stage.history = [
            *(stage.history or []),
            {
                'stage': 'Showroom / Ready Stock',
                'date': datetime.utcnow().strftime('%Y-%m-%d'),
                'status': 'Completed',
                'by': 'Delivery Settlement',
            },
        ]

    # FIX 2: Flip all IN_PROGRESS ProductionJobs for this booking's stages to
    # READY_FOR_PAYMENT so the employee's earnings history shows a pending balance.
    if stage_ids:
        ready_at = datetime.utcnow()
        for pjob in ProductionJob.query.filter(
            ProductionJob.stage_id.in_(stage_ids),
            ProductionJob.status == 'IN_PROGRESS',
        ).all():
            pjob.status = 'READY_FOR_PAYMENT'
            pjob.ready_at = ready_at

    # Record ledger entry for the settled balance
    if prev_balance > 0:
        last_entry = LedgerEntry.query.order_by(LedgerEntry.created_at.desc()).first()
        prev_ledger_bal = float(last_entry.balance_after or 0) if last_entry else 0.0
        ledger = LedgerEntry(
            id=f"LED-SETTLE-{int(datetime.utcnow().timestamp())}",
            date=datetime.utcnow().strftime('%Y-%m-%d'),
            type='CREDIT',
            category='Custom Tailoring Final Settlement',
            description=f"Delivery & Balance Settlement for Booking #{booking.booking_no} ({booking.customer_name})",
            amount=prev_balance,
            balance_after=prev_ledger_bal + prev_balance,
            reference=booking.booking_no,
        )
        db.session.add(ledger)

    db.session.commit()
    return jsonify({
        'message': f'Order {booking.booking_no} settled and delivered! Master incentive unlocked.',
        'booking': booking.to_dict(),
        'unlockedJobs': unlocked_jobs
    }), 200

@bookings_bp.route('/master-jobs', methods=['GET'])
def get_master_jobs():
    master_name = request.args.get('master')
    month = request.args.get('month')
    query = MasterJobAssignment.query
    if master_name:
        query = query.filter_by(master_name=master_name)
    if month:
        query = query.filter_by(payroll_month=month)
    jobs = query.order_by(MasterJobAssignment.created_at.desc()).all()
    return jsonify([j.to_dict() for j in jobs]), 200

@bookings_bp.route('/master-jobs/<string:job_id>/complete', methods=['POST'])
def complete_master_job(job_id):
    job = MasterJobAssignment.query.get(job_id)
    if not job:
        return jsonify({'error': 'Master job not found'}), 404
    if job.work_status != 'COMPLETED':
        job.work_status = 'COMPLETED'
        job.work_completed_at = datetime.utcnow()
        if job.master_id:
            employee = Employee.query.get(job.master_id)
            if employee:
                employee.pieces_completed_this_month = (employee.pieces_completed_this_month or 0) + 1

        # FIX 3: Flip the employee's linked ProductionJob for this booking to
        # READY_FOR_PAYMENT so their earnings history shows the pending balance.
        booking_stage_ids = [
            s.id for s in ProductStage.query.filter_by(booking_id=job.booking_id).all()
        ]
        if booking_stage_ids and job.master_id:
            ready_at = datetime.utcnow()
            for pjob in ProductionJob.query.filter(
                ProductionJob.stage_id.in_(booking_stage_ids),
                ProductionJob.employee_id == job.master_id,
                ProductionJob.status == 'IN_PROGRESS',
            ).all():
                pjob.status = 'READY_FOR_PAYMENT'
                pjob.ready_at = ready_at

    db.session.commit()
    return jsonify(job.to_dict()), 200
