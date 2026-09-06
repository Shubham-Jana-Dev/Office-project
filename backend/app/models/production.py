from datetime import datetime
from backend.app.extensions import db


class ProductionJob(db.Model):
    __tablename__ = 'production_jobs'

    id = db.Column(db.String(50), primary_key=True)
    stage_id = db.Column(db.String(50), db.ForeignKey('product_stages.id', ondelete='CASCADE'), nullable=False, index=True)
    employee_id = db.Column(db.String(50), db.ForeignKey('employees.id', ondelete='SET NULL'), nullable=True, index=True)
    employee_name = db.Column(db.String(150), nullable=False)
    project_name = db.Column(db.String(255), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    agreed_amount = db.Column(db.Numeric(10, 2), nullable=False, default=0.00)
    status = db.Column(db.String(30), nullable=False, default='IN_PROGRESS', index=True)
    ready_at = db.Column(db.DateTime, nullable=True)
    paid_at = db.Column(db.DateTime, nullable=True)
    payment_method = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'stageId': self.stage_id,
            'employeeId': self.employee_id,
            'employeeName': self.employee_name,
            'projectName': self.project_name,
            'quantity': self.quantity,
            'agreedAmount': float(self.agreed_amount or 0),
            'status': self.status,
            'readyAt': self.ready_at.strftime('%Y-%m-%d %H:%M') if self.ready_at else None,
            'paidAt': self.paid_at.strftime('%Y-%m-%d %H:%M') if self.paid_at else None,
            'paymentMethod': self.payment_method,
            'createdAt': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None,
        }