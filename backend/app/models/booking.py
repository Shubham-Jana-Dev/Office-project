from datetime import datetime
from backend.app.extensions import db

class OrderBooking(db.Model):
    __tablename__ = 'order_bookings'

    id = db.Column(db.String(50), primary_key=True)
    booking_no = db.Column(db.String(50), unique=True, nullable=False, index=True)
    customer_id = db.Column(db.String(50), db.ForeignKey('customers.id'), nullable=True)
    customer_name = db.Column(db.String(150), nullable=False)
    customer_phone = db.Column(db.String(50), nullable=True)
    garment_type = db.Column(db.String(150), nullable=False)
    fabric_details = db.Column(db.String(255), nullable=True)
    booking_date = db.Column(db.String(50), nullable=True)
    trial_date = db.Column(db.String(50), nullable=True)
    delivery_date = db.Column(db.String(50), nullable=True)
    total_amount = db.Column(db.Numeric(10, 2), default=0.00)
    advance_paid = db.Column(db.Numeric(10, 2), default=0.00)
    balance_due = db.Column(db.Numeric(10, 2), default=0.00)
    status = db.Column(db.String(50), default='In Production') # In Production, Ready for Trial, Trial Done, Delivered, Cancelled
    assigned_master = db.Column(db.String(150), nullable=True)
    assigned_employees = db.Column(db.JSON, nullable=True)
    special_instructions = db.Column(db.Text, nullable=True)
    measurement_id = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    job_assignments = db.relationship('MasterJobAssignment', backref='booking', cascade='all, delete-orphan', lazy=True)
    product_stages = db.relationship('ProductStage', back_populates='booking', lazy=True)

    def to_dict(self):
        current_stage = next(
            (stage.current_stage for stage in self.product_stages if stage.current_stage),
            None,
        )
        return {
            'id': self.id,
            'bookingNo': self.booking_no,
            'customerId': self.customer_id,
            'customerName': self.customer_name,
            'customerPhone': self.customer_phone,
            'garmentType': self.garment_type,
            'fabricDetails': self.fabric_details,
            'bookingDate': self.booking_date,
            'trialDate': self.trial_date,
            'deliveryDate': self.delivery_date,
            'totalAmount': float(self.total_amount) if self.total_amount is not None else 0.0,
            'advancePaid': float(self.advance_paid) if self.advance_paid is not None else 0.0,
            'balanceDue': float(self.balance_due) if self.balance_due is not None else 0.0,
            'status': self.status,
            'assignedMaster': self.assigned_master,
            'assignedEmployees': self.assigned_employees or [],
            'specialInstructions': self.special_instructions,
            'measurementId': self.measurement_id,
            'currentStage': current_stage,
        }

class MasterJobAssignment(db.Model):
    """
    Tracks jobs assigned to Master Tailors with Delivery & Settlement Linked Performance Pay.
    Incentive is only paid when work is completed AND the order is settled & delivered.
    """
    __tablename__ = 'master_job_assignments'

    id = db.Column(db.String(50), primary_key=True)
    booking_id = db.Column(db.String(50), db.ForeignKey('order_bookings.id'), nullable=False)
    order_id = db.Column(db.String(50), nullable=True) # Optional link to sales_orders
    master_id = db.Column(db.String(50), db.ForeignKey('employees.id'), nullable=True)
    master_name = db.Column(db.String(150), nullable=False)
    garment_type = db.Column(db.String(150), nullable=False)
    incentive_rate = db.Column(db.Numeric(10, 2), nullable=False, default=0.00) # e.g. 500.00 for 3-Piece Suit

    # Stage & Execution
    work_status = db.Column(db.String(50), default='ASSIGNED') # ASSIGNED, IN_PROGRESS, COMPLETED
    work_completed_at = db.Column(db.DateTime, nullable=True)

    # Settlement & Delivery
    is_payment_settled = db.Column(db.Boolean, default=False)
    is_delivered = db.Column(db.Boolean, default=False)
    delivered_at = db.Column(db.DateTime, nullable=True)

    # Payout Status: PENDING_DELIVERY -> READY_FOR_PAYROLL -> PAID -> VOID
    payout_status = db.Column(db.String(50), default='PENDING_DELIVERY', index=True)
    payroll_month = db.Column(db.String(30), nullable=True) # e.g. "September 2026"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'bookingId': self.booking_id,
            'orderId': self.order_id,
            'masterId': self.master_id,
            'masterName': self.master_name,
            'garmentType': self.garment_type,
            'incentiveRate': float(self.incentive_rate) if self.incentive_rate is not None else 0.0,
            'workStatus': self.work_status,
            'workCompletedAt': self.work_completed_at.strftime('%Y-%m-%d %H:%M') if self.work_completed_at else None,
            'isPaymentSettled': self.is_payment_settled,
            'isDelivered': self.is_delivered,
            'deliveredAt': self.delivered_at.strftime('%Y-%m-%d %H:%M') if self.delivered_at else None,
            'payoutStatus': self.payout_status,
            'payrollMonth': self.payroll_month,
        }
