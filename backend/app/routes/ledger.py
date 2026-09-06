from flask import Blueprint, request, jsonify
from backend.app.models.ledger import LedgerEntry, ProductStage
from backend.app.models.production import ProductionJob
from backend.app.models.employee import Employee
from datetime import datetime
from backend.app.extensions import db

ledger_bp = Blueprint('ledger', __name__)

WORKFLOW_STAGES = (
    'Fabric Sourcing & Inward',
    'Pattern Making & Cutting',
    'Stitching & Tailoring',
    'Embroidery & Detailing',
    'Washing & Finishing',
    'Quality Check (QC Inspection)',
    'Showroom / Ready Stock',
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
        current_stage=data.get('currentStage', 'Fabric Sourcing & Inward'),
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
        if stage.current_stage.lower() in {'ready for delivery', 'showroom / ready stock', 'ready'}:
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
        if requested_stage not in WORKFLOW_STAGES:
            return jsonify({'error': f'Invalid workflow stage. Choose one of: {", ".join(WORKFLOW_STAGES)}'}), 400
        current_index = WORKFLOW_STAGES.index(stage.current_stage) if stage.current_stage in WORKFLOW_STAGES else None
        requested_index = WORKFLOW_STAGES.index(requested_stage)
        if current_index is not None and requested_index not in {current_index - 1, current_index + 1}:
            return jsonify({'error': 'A product can only move to the immediately preceding or following workflow stage'}), 400
        stage.current_stage = requested_stage
    if 'progress' in data: stage.progress = data['progress']
    if 'history' in data: stage.history = data['history']
    if 'qcStatus' in data: stage.qc_status = data['qcStatus']
    if 'notes' in data: stage.notes = data['notes']
    if 'assignedTo' in data: stage.assigned_to = data['assignedTo']
    if 'targetDate' in data: stage.target_date = data['targetDate']
    if 'bookingId' in data: stage.booking_id = data['bookingId']

    if stage.current_stage.lower() in {'ready for delivery', 'showroom / ready stock', 'ready'}:
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
