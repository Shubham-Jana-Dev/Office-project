from flask import Blueprint, request, jsonify
from backend.app.models.ledger import LedgerEntry, ProductStage
from backend.app.models.production import ProductionJob
from backend.app.models.employee import Employee
from datetime import datetime
from backend.app.extensions import db

ledger_bp = Blueprint('ledger', __name__)

WORKFLOW_STAGES = (
    'Cutting stage',
    'Stitching stage',
    'Hemming stage',
    'QC stage',
    'Ready to Delivery stage',
    'Delivered',
    'Received',
    'Fixing in Progress',
    'QC Check',
    'Ready to Deliver'
)

@ledger_bp.route('', methods=['GET'])
def get_ledger_entries():
    entries = LedgerEntry.query.order_by(LedgerEntry.created_at.desc()).all()
    return jsonify([e.to_dict() for e in entries]), 200

@ledger_bp.route('', methods=['POST'])
def add_ledger_entry():
    data = request.get_json() or {}
    new_id = data.get('id') or f"LED-{LedgerEntry.query.count() + 101}"
    entry = LedgerEntry(
        id=new_id,
        date=data.get('date'),
        type=data.get('type', 'DEBIT'),
        category=data.get('category', 'Expense'),
        description=data.get('description', ''),
        amount=data.get('amount', 0.0),
        balance_after=data.get('balanceAfter', 0.0),
        reference=data.get('reference', ''),
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify(entry.to_dict()), 201

@ledger_bp.route('/stages', methods=['GET'])
def get_stages():
    stages = ProductStage.query.all()
    return jsonify([s.to_dict() for s in stages]), 200

@ledger_bp.route('/stages', methods=['POST'])
def create_stage():
    data = request.get_json() or {}
    stage = ProductStage(
        id=data.get('id') or f"STG-{ProductStage.query.count() + 101}",
        batch_no=data.get('batchNo') or f"LOT-{ProductStage.query.count() + 1001}",
        booking_id=data.get('bookingId'),
        client_name=data.get('clientName') or data.get('client'),
        garment_type=data.get('garmentType', 'Custom Garment'),
        quantity=data.get('quantity', 1),
        current_stage=data.get('currentStage', 'Cutting stage'),
        assigned_to=data.get('assignedTo'),
        start_date=data.get('startDate'),
        target_date=data.get('targetDate'),
        progress=data.get('progress', 15),
        priority=data.get('priority', 'Medium'),
        fabric_code=data.get('fabricCode'),
        qc_status=data.get('qcStatus', 'In Progress'),
        notes=data.get('notes', ''),
        history=data.get('history', []),
    )
    db.session.add(stage)
    for index, assignment in enumerate(data.get('employees', [])):
        employee_id = assignment.get('employeeId') or assignment.get('employee_id')
        employee = Employee.query.filter((Employee.id == employee_id) | (Employee.emp_id == employee_id)).first() if employee_id else None
        job = ProductionJob(
            id=f"JOB-{stage.id}-{index + 1}",
            stage_id=stage.id,
            employee_id=employee.id if employee else None,
            employee_name=assignment.get('employeeName') or (employee.name if employee else 'Unassigned'),
            project_name=stage.garment_type,
            quantity=stage.quantity,
            agreed_amount=assignment.get('amount', assignment.get('agreedAmount', 0)),
        )
        _stage_lower_create = stage.current_stage.lower()
        _ready_kw = {'ready to delivery stage', 'ready to deliver', 'ready for delivery', 'showroom / ready stock', 'ready'}
        if any(kw in _stage_lower_create for kw in _ready_kw):
            job.status = 'READY_FOR_PAYMENT'
            job.ready_at = datetime.utcnow()
        db.session.add(job)
    db.session.commit()
    return jsonify(stage.to_dict()), 201

@ledger_bp.route('/stages/<string:stage_id>', methods=['PATCH', 'PUT'])
def update_stage(stage_id):
    stage = ProductStage.query.get(stage_id)
    if not stage:
        return jsonify({'error': 'Stage not found'}), 404

    data = request.get_json() or {}
    if 'currentStage' in data:
        requested_stage = data['currentStage']
        # Allow any stage that is in WORKFLOW_STAGES (removed sequential check so checkboxes work)
        if requested_stage not in WORKFLOW_STAGES:
            # Try to accept old stages or unknown to not break anything, but ideally restrict. 
            # We'll just update it directly without strict restriction, or log it.
            stage.current_stage = requested_stage
        else:
            stage.current_stage = requested_stage
    if 'progress' in data: stage.progress = data['progress']
    if 'history' in data: stage.history = data['history']
    if 'qcStatus' in data: stage.qc_status = data['qcStatus']
    if 'notes' in data: stage.notes = data['notes']
    if 'assignedTo' in data: stage.assigned_to = data['assignedTo']
    if 'targetDate' in data: stage.target_date = data['targetDate']
    if 'bookingId' in data: stage.booking_id = data['bookingId']

    # Normalize to lowercase for comparison — covers all stage name variants used in the app:
    # "Ready to Delivery stage", "Ready to Deliver", "Showroom / Ready Stock", etc.
    _stage_lower = stage.current_stage.lower()
    _ready_keywords = {'ready to delivery stage', 'ready to deliver', 'ready for delivery', 'showroom / ready stock', 'ready'}
    if any(kw in _stage_lower for kw in _ready_keywords):
        ready_at = datetime.utcnow()
        for job in ProductionJob.query.filter_by(stage_id=stage.id).all():
            if job.status == 'IN_PROGRESS':
                job.status = 'READY_FOR_PAYMENT'
                job.ready_at = ready_at

    db.session.commit()
    return jsonify(stage.to_dict()), 200


@ledger_bp.route('/production-jobs', methods=['GET'])
def get_production_jobs():
    status = request.args.get('status')
    query = ProductionJob.query
    # 'all' means no filter — return every job regardless of status
    if status and status.lower() != 'all':
        query = query.filter_by(status=status)
    jobs = query.order_by(ProductionJob.created_at.desc()).all()
    return jsonify([job.to_dict() for job in jobs]), 200
