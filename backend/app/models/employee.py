from datetime import datetime
from backend.app.extensions import db
from sqlalchemy.orm import validates

EMPLOYEE_ROLES = (
    'Cutter',
    'Master Tailor',
    'Stitching',
    'Washing',
    'Finishing',
)

class Employee(db.Model):
    __tablename__ = 'employees'

    id = db.Column(db.String(50), primary_key=True) # e.g. EMP-01
    emp_id = db.Column(db.String(50), unique=True, nullable=False, index=True) # e.g. TC-EMP-01
    name = db.Column(db.String(150), nullable=False)
    role = db.Column(db.String(120), nullable=False)
    department = db.Column(db.String(100), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    join_date = db.Column(db.String(50), nullable=True)
    pay_type = db.Column(db.String(50), default='piece_rate') # piece_rate, commission_fixed, fixed
    base_salary = db.Column(db.Numeric(10, 2), default=500.00)
    piece_rate_unit = db.Column(db.Numeric(10, 2), default=28.50)
    piece_rate_per_item = db.Column(db.JSON, nullable=True)
    advance_loan_total = db.Column(db.Numeric(10, 2), default=0.00)
    advance_loan_deduction_per_month = db.Column(db.Numeric(10, 2), default=0.00)
    advance_loan_remaining = db.Column(db.Numeric(10, 2), default=0.00)
    performance_score = db.Column(db.Numeric(3, 2), default=4.8)
    pieces_completed_this_month = db.Column(db.Integer, default=0)
    sales_achieved_this_month = db.Column(db.Numeric(10, 2), default=0.00)
    sales_commission_rate = db.Column(db.Numeric(5, 2), default=2.5)
    overtime_rate_per_hour = db.Column(db.Numeric(10, 2), default=8.00)
    avatar = db.Column(db.String(10), default='👤')
    status = db.Column(db.String(50), default='Active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship to master job cards
    jobs = db.relationship('MasterJobAssignment', backref='master', lazy=True)

    @validates('role')
    def validate_role(self, key, value):
        if value not in EMPLOYEE_ROLES:
            raise ValueError(f'Role must be one of: {", ".join(EMPLOYEE_ROLES)}')
        return value

    def to_dict(self):
        return {
            'id': self.id,
            'empId': self.emp_id,
            'name': self.name,
            'role': self.role,
            'department': self.department,
            'phone': self.phone,
            'joinDate': self.join_date,
            'payType': self.pay_type,
            'baseSalary': float(self.base_salary) if self.base_salary is not None else 500.0,
            'pieceRateUnit': float(self.piece_rate_unit) if self.piece_rate_unit is not None else 28.50,
            'pieceRatePerItem': self.piece_rate_per_item or {},
            'advanceLoanTotal': float(self.advance_loan_total) if self.advance_loan_total is not None else 0.0,
            'advanceLoanDeductionPerMonth': float(self.advance_loan_deduction_per_month) if self.advance_loan_deduction_per_month is not None else 0.0,
            'advanceLoanRemaining': float(self.advance_loan_remaining) if self.advance_loan_remaining is not None else 0.0,
            'performanceScore': float(self.performance_score) if self.performance_score is not None else 4.8,
            'piecesCompletedThisMonth': self.pieces_completed_this_month,
            'salesAchievedThisMonth': float(self.sales_achieved_this_month) if self.sales_achieved_this_month is not None else 0.0,
            'salesCommissionRate': float(self.sales_commission_rate) if self.sales_commission_rate is not None else 2.5,
            'overtimeRatePerHour': float(self.overtime_rate_per_hour) if self.overtime_rate_per_hour is not None else 8.0,
            'avatar': self.avatar,
            'status': self.status,
        }

class Attendance(db.Model):
    __tablename__ = 'attendance'

    id = db.Column(db.String(50), primary_key=True)
    emp_id = db.Column(db.String(50), nullable=False, index=True)
    emp_name = db.Column(db.String(150), nullable=False)
    date = db.Column(db.String(50), nullable=False)
    in_time = db.Column(db.String(30), default='09:00 AM')
    out_time = db.Column(db.String(30), default='06:00 PM')
    status = db.Column(db.String(30), default='Present') # Present, Absent, Half Day, Leave
    ot_hours = db.Column(db.Numeric(4, 1), default=0.0)
    notes = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'empId': self.emp_id,
            'empName': self.emp_name,
            'date': self.date,
            'inTime': self.in_time,
            'outTime': self.out_time,
            'status': self.status,
            'otHours': float(self.ot_hours) if self.ot_hours is not None else 0.0,
            'notes': self.notes or '',
        }
