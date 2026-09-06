import json
import os
import sys


def _validate_seed_environment():
    environment = os.getenv('FLASK_ENV') or os.getenv('APP_ENV') or os.getenv('ENV') or ''
    normalized_environment = environment.strip().lower()
    if normalized_environment in {'production', 'prod'}:
        print(
            '!!! REFUSING TO RUN seed_db.py: production environment detected. '
            'This script drops and recreates every database table.',
            file=sys.stderr,
        )
        raise SystemExit(1)

    if os.getenv('SEED_DB_ALLOW_DESTRUCTIVE') != '1':
        print(
            '!!! REFUSING TO RUN seed_db.py: destructive seed confirmation is missing. '
            'Set SEED_DB_ALLOW_DESTRUCTIVE=1 only for an intentional non-production reset.',
            file=sys.stderr,
        )
        raise SystemExit(1)


_validate_seed_environment()

# Ensure backend root is in python path
backend_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, os.path.dirname(backend_dir))

from backend.app import create_app
from backend.app.extensions import db
from backend.app.models import (
    User,
    Product,
    Customer,
    Measurement,
    SalesOrder,
    SalesOrderItem,
    Vendor,
    PurchaseOrder,
    OrderBooking,
    MasterJobAssignment,
    Employee,
    Attendance,
    LedgerEntry,
    ProductStage,
    ProductionJob,
)
from backend.app.models.employee import EMPLOYEE_ROLES

LEGACY_ROLE_MAP = {
    'Master Tailor (Suit Specialist)': 'Master Tailor',
    'Senior Pattern Maker & Cutter': 'Cutter',
    'Head Sales Executive & POS Cashier': 'Finishing',
    'Quality Control Lead & Finisher': 'Finishing',
}

app = create_app()

def seed_database():
    with app.app_context():
        print("🛠️ Re-creating all tables cleanly in MySQL 'garment_erp'...")
        db.drop_all()
        db.create_all()
        print("✅ Database tables created successfully!")

        json_path = os.path.join(backend_dir, 'seed_data.json')
        if not os.path.exists(json_path):
            print(f"❌ seed_data.json not found at {json_path}")
            return

        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # 1. Seed Users
        if User.query.count() == 0:
            print("👤 Seeding Users...")
            for u in data.get('INITIAL_USERS', []):
                user = User(
                    id=u.get('id'),
                    username=u.get('username'),
                    name=u.get('name'),
                    role=u.get('role'),
                    role_key=u.get('roleKey', 'admin'),
                    avatar=u.get('avatar', '👤'),
                    email=f"{u.get('username')}@threadcraft.com",
                )
                user.set_password(u.get('password', 'password123'))
                db.session.add(user)
            db.session.commit()

        # 2. Seed Products
        if Product.query.count() == 0:
            print("👔 Seeding Products...")
            for p in data.get('INITIAL_PRODUCTS', []):
                product = Product(
                    id=p.get('id'),
                    sku=p.get('sku'),
                    barcode=p.get('barcode'),
                    name=p.get('name'),
                    category=p.get('category'),
                    brand=p.get('brand'),
                    fabric=p.get('fabric'),
                    cost_price=p.get('costPrice', 0.0),
                    price=p.get('price', 0.0),
                    mrp=p.get('mrp', p.get('price', 0.0)),
                    stock=p.get('stock', 0),
                    unit=p.get('unit', 'Piece'),
                    min_stock=p.get('minStock', 5),
                    sizes=p.get('sizes', []),
                    colors=p.get('colors', []),
                    fit=p.get('fit'),
                    tax_rate=p.get('taxRate', 12.0),
                    hsn=p.get('hsn'),
                    image=p.get('image', '👔'),
                )
                db.session.add(product)
            db.session.commit()

        # 3. Seed Vendors
        if Vendor.query.count() == 0:
            print("🏭 Seeding Vendors...")
            for v in data.get('INITIAL_VENDORS', []):
                vendor = Vendor(
                    id=v.get('id'),
                    name=v.get('name'),
                    category=v.get('category'),
                    contact_person=v.get('contactPerson'),
                    phone=v.get('phone'),
                    email=v.get('email'),
                    city=v.get('city'),
                    rating=v.get('rating', 4.5),
                    balance_due=v.get('balanceDue', 0.0),
                )
                db.session.add(vendor)
            db.session.commit()

        # 4. Seed Customers
        if Customer.query.count() == 0:
            print("👥 Seeding Customers...")
            for c in data.get('INITIAL_CUSTOMERS', []):
                customer = Customer(
                    id=c.get('id'),
                    name=c.get('name'),
                    phone=c.get('phone'),
                    email=c.get('email'),
                    city=c.get('city'),
                    gstin=c.get('gstin'),
                    credit_limit=c.get('creditLimit', 0.0),
                    balance=c.get('balance', 0.0),
                    buyer_type=c.get('buyerType', 'finished_product'),
                    customer_segment=c.get('customerSegment', 'retail'),
                )
                db.session.add(customer)
            db.session.commit()

        # 5. Seed Measurements
        if Measurement.query.count() == 0:
            print("📏 Seeding Measurements...")
            for m in data.get('INITIAL_MEASUREMENTS', []):
                measurement = Measurement(
                    id=m.get('id'),
                    customer_id=m.get('customerId'),
                    customer_name=m.get('customerName'),
                    customer_phone=m.get('customerPhone'),
                    suit_type=m.get('suitType', 'Bespoke Suit'),
                    measurements=m.get('measurements', {}),
                    fit_preference=m.get('fitPreference'),
                    posture_notes=m.get('postureNotes'),
                )
                db.session.add(measurement)
            db.session.commit()

        # 6. Seed Employees
        if Employee.query.count() == 0:
            print("🧵 Seeding Employees...")
            for e in data.get('INITIAL_EMPLOYEES', []):
                emp = Employee(
                    id=e.get('id'),
                    emp_id=e.get('empId'),
                    name=e.get('name'),
                    role=LEGACY_ROLE_MAP.get(e.get('role'), e.get('role') if e.get('role') in EMPLOYEE_ROLES else 'Master Tailor'),
                    department=e.get('department'),
                    phone=e.get('phone'),
                    join_date=e.get('joinDate'),
                    pay_type=e.get('payType', 'piece_rate'),
                    base_salary=e.get('baseSalary', 500.0),
                    piece_rate_unit=e.get('pieceRateUnit', 28.5),
                    piece_rate_per_item=e.get('pieceRatePerItem', {}),
                    advance_loan_total=e.get('advanceLoanTotal', 0.0),
                    advance_loan_deduction_per_month=e.get('advanceLoanDeductionPerMonth', 0.0),
                    advance_loan_remaining=e.get('advanceLoanRemaining', 0.0),
                    performance_score=e.get('performanceScore', 4.8),
                    pieces_completed_this_month=e.get('piecesCompletedThisMonth', 0),
                    sales_achieved_this_month=e.get('salesAchievedThisMonth', 0.0),
                    sales_commission_rate=e.get('salesCommissionRate', 2.5),
                    overtime_rate_per_hour=e.get('overtimeRatePerHour', 8.0),
                    avatar=e.get('avatar', '👤'),
                    status=e.get('status', 'Active'),
                )
                db.session.add(emp)
            db.session.commit()

        # 7. Seed Attendance
        if Attendance.query.count() == 0:
            print("📅 Seeding Attendance...")
            for a in data.get('INITIAL_ATTENDANCE', []):
                att = Attendance(
                    id=a.get('id'),
                    emp_id=a.get('empId'),
                    emp_name=a.get('empName'),
                    date=a.get('date'),
                    in_time=a.get('inTime'),
                    out_time=a.get('outTime'),
                    status=a.get('status'),
                    ot_hours=a.get('otHours', 0.0),
                    notes=a.get('notes'),
                )
                db.session.add(att)
            db.session.commit()

        # 8. Seed Order Bookings & Master Job Assignments
        if OrderBooking.query.count() == 0:
            print("📋 Seeding Order Bookings & Master Job Cards...")
            for b in data.get('INITIAL_ORDER_BOOKINGS', []):
                booking = OrderBooking(
                    id=b.get('id'),
                    booking_no=b.get('bookingNo'),
                    customer_id=b.get('customerId'),
                    customer_name=b.get('customerName'),
                    customer_phone=b.get('customerPhone'),
                    garment_type=b.get('garmentType'),
                    fabric_details=b.get('fabricDetails'),
                    booking_date=b.get('bookingDate'),
                    trial_date=b.get('trialDate'),
                    delivery_date=b.get('deliveryDate'),
                    total_amount=b.get('totalAmount', 0.0),
                    advance_paid=b.get('advancePaid', 0.0),
                    balance_due=b.get('balanceDue', 0.0),
                    status=b.get('status', 'In Production'),
                    assigned_master=b.get('assignedMaster'),
                    special_instructions=b.get('specialInstructions'),
                    measurement_id=b.get('measurementId'),
                )
                db.session.add(booking)

                # Auto-create master job assignment for this booking
                assigned_master = b.get('assignedMaster', '')
                incentive = 500.0 if 'suit' in b.get('garmentType', '').lower() else 250.0
                job = MasterJobAssignment(
                    id=f"JOB-{b.get('bookingNo')}",
                    booking_id=b.get('id'),
                    master_name=assigned_master or 'Master Tailor',
                    garment_type=b.get('garmentType'),
                    incentive_rate=incentive,
                    work_status='COMPLETED' if b.get('status') == 'Ready for Trial' else 'IN_PROGRESS',
                    payout_status='READY_FOR_PAYROLL' if b.get('status') == 'Delivered' else 'PENDING_DELIVERY',
                    is_delivered=b.get('status') == 'Delivered',
                    is_payment_settled=b.get('balanceDue', 0.0) == 0.0,
                )
                db.session.add(job)
            db.session.commit()

        # 9. Seed Ledger Entries
        if LedgerEntry.query.count() == 0:
            print("💰 Seeding Ledger Entries...")
            for l in data.get('INITIAL_LEDGER_ENTRIES', []):
                ledger = LedgerEntry(
                    id=l.get('id'),
                    date=l.get('date'),
                    type=l.get('type'),
                    category=l.get('partyType') or l.get('category', 'General'),
                    party_type=l.get('partyType'),
                    party_name=l.get('partyName'),
                    description=l.get('description'),
                    amount=l.get('amount', 0.0),
                    balance_after=l.get('balance') or l.get('balanceAfter', 0.0),
                    reference=l.get('refNo') or l.get('reference'),
                )
                db.session.add(ledger)
            db.session.commit()

        # 10. Seed Product Stages
        if ProductStage.query.count() == 0:
            print("⚙️ Seeding Product Stages...")
            for s in data.get('INITIAL_PRODUCT_STAGES', []):
                stage = ProductStage(
                    id=s.get('id'),
                    batch_no=s.get('batchNo'),
                    client_name=s.get('clientName') or s.get('client', 'Client'),
                    garment_type=s.get('garmentType'),
                    quantity=s.get('quantity', 1),
                    current_stage=s.get('currentStage'),
                    assigned_to=s.get('assignedTo'),
                    start_date=s.get('startDate'),
                    target_date=s.get('targetDate') or s.get('deliveryDate'),
                    progress=s.get('progress', 0),
                    priority=s.get('priority', 'Medium'),
                    fabric_code=s.get('fabricCode'),
                    qc_status=s.get('qcStatus'),
                    notes=s.get('notes'),
                    history=s.get('history', []),
                )
                db.session.add(stage)
            db.session.commit()

        # 10b. Seed employee production jobs after their stages and employees exist
        if ProductionJob.query.count() == 0:
            print("🧾 Seeding Production Work Payments...")
            for job_data in data.get('INITIAL_PRODUCTION_JOBS', []):
                employee = Employee.query.filter((Employee.id == job_data.get('employeeId')) | (Employee.emp_id == job_data.get('employeeId'))).first()
                job = ProductionJob(
                    id=job_data.get('id'),
                    stage_id=job_data.get('stageId'),
                    employee_id=employee.id if employee else job_data.get('employeeId'),
                    employee_name=job_data.get('employeeName') or (employee.name if employee else 'Unassigned'),
                    project_name=job_data.get('projectName'),
                    quantity=job_data.get('quantity', 1),
                    agreed_amount=job_data.get('agreedAmount', 0),
                    status=job_data.get('status', 'IN_PROGRESS'),
                )
                db.session.add(job)
            db.session.commit()

        # 11. Seed Sales Orders
        if SalesOrder.query.count() == 0:
            print("🧾 Seeding Sales Orders...")
            for o in data.get('INITIAL_SALES_ORDERS', []):
                order = SalesOrder(
                    id=o.get('id'),
                    order_no=o.get('orderNo') or o.get('invoiceNo') or o.get('id'),
                    customer_id=o.get('customerId'),
                    customer_name=o.get('customerName') or 'Customer',
                    cashier_name=o.get('cashierName') or o.get('cashier') or 'Head Cashier',
                    subtotal=o.get('subtotal', 0.0),
                    discount=o.get('discount', 0.0),
                    tax=o.get('tax', 0.0),
                    total=o.get('total', 0.0),
                    payment_method=o.get('paymentMethod', 'Cash'),
                    sale_type=o.get('saleType', 'finished_product'),
                    status=o.get('status', 'Completed'),
                    items_data=o.get('items', []),
                )
                db.session.add(order)
            db.session.commit()

        print("\n🎉 All MySQL tables and seed records successfully seeded!")
        print(f"Products: {Product.query.count()}")
        print(f"Customers: {Customer.query.count()}")
        print(f"Employees: {Employee.query.count()}")
        print(f"Order Bookings: {OrderBooking.query.count()}")
        print(f"Master Job Cards: {MasterJobAssignment.query.count()}")
        print(f"Ledger Entries: {LedgerEntry.query.count()}")

if __name__ == '__main__':
    seed_database()
