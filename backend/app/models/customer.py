from datetime import datetime
from backend.app.extensions import db

class Customer(db.Model):
    __tablename__ = 'customers'

    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    phone = db.Column(db.String(50), nullable=False, index=True)
    email = db.Column(db.String(120), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    gstin = db.Column(db.String(50), nullable=True)
    credit_limit = db.Column(db.Numeric(10, 2), default=0.00)
    balance = db.Column(db.Numeric(10, 2), default=0.00)
    buyer_type = db.Column(db.String(40), default='finished_product') # raw_material, finished_product, both
    customer_segment = db.Column(db.String(40), default='retail') # retail, family, wholesale
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    measurements = db.relationship('Measurement', backref='customer', cascade='all, delete-orphan', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'phone': self.phone,
            'email': self.email or '',
            'city': self.city or '',
            'gstin': self.gstin or '',
            'creditLimit': float(self.credit_limit) if self.credit_limit is not None else 0.0,
            'balance': float(self.balance) if self.balance is not None else 0.0,
            'buyerType': self.buyer_type or 'finished_product',
            'customerSegment': self.customer_segment or 'retail',
            'type': 'Wholesale Buyer' if self.customer_segment == 'wholesale' else 'Family Buyer' if self.customer_segment == 'family' else 'Raw Material Buyer' if self.buyer_type == 'raw_material' else 'Both Buyer' if self.buyer_type == 'both' else 'Finished Product Buyer',
        }

class Measurement(db.Model):
    __tablename__ = 'measurements'

    id = db.Column(db.String(50), primary_key=True)
    customer_id = db.Column(db.String(50), db.ForeignKey('customers.id'), nullable=False)
    customer_name = db.Column(db.String(150), nullable=True)
    customer_phone = db.Column(db.String(50), nullable=True)
    suit_type = db.Column(db.String(100), default='Bespoke Suit')
    measurements = db.Column(db.JSON, nullable=False) # JSON dictionary of neck, chest, waist, etc.
    fit_preference = db.Column(db.String(100), nullable=True)
    posture_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'customerId': self.customer_id,
            'customerName': self.customer_name or (self.customer.name if self.customer else ''),
            'customerPhone': self.customer_phone or (self.customer.phone if self.customer else ''),
            'suitType': self.suit_type,
            'measurements': self.measurements or {},
            'fitPreference': self.fit_preference or '',
            'postureNotes': self.posture_notes or '',
        }
