from datetime import datetime
from backend.app.extensions import db

class SalesOrder(db.Model):
    __tablename__ = 'sales_orders'

    id = db.Column(db.String(50), primary_key=True)
    order_no = db.Column(db.String(50), unique=True, nullable=False, index=True)
    customer_id = db.Column(db.String(50), db.ForeignKey('customers.id'), nullable=True)
    customer_name = db.Column(db.String(150), nullable=True)
    cashier_name = db.Column(db.String(120), nullable=True)
    subtotal = db.Column(db.Numeric(10, 2), nullable=False, default=0.00)
    discount = db.Column(db.Numeric(10, 2), nullable=False, default=0.00)
    tax = db.Column(db.Numeric(10, 2), nullable=False, default=0.00)
    total = db.Column(db.Numeric(10, 2), nullable=False, default=0.00)
    payment_method = db.Column(db.String(50), default='Cash') # Cash, Card, UPI, Split
    sale_type = db.Column(db.String(30), default='finished_product') # raw_material, finished_product
    status = db.Column(db.String(50), default='Completed') # Completed, Refunded, Cancelled
    items_data = db.Column(db.JSON, nullable=True) # Stored snapshot of items
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    items = db.relationship('SalesOrderItem', backref='order', cascade='all, delete-orphan', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'orderNo': self.order_no,
            'customerId': self.customer_id,
            'customerName': self.customer_name,
            'cashierName': self.cashier_name,
            'subtotal': float(self.subtotal) if self.subtotal is not None else 0.0,
            'discount': float(self.discount) if self.discount is not None else 0.0,
            'tax': float(self.tax) if self.tax is not None else 0.0,
            'total': float(self.total) if self.total is not None else 0.0,
            'paymentMethod': self.payment_method,
            'saleType': self.sale_type,
            'status': self.status,
            'items': self.items_data or [item.to_dict() for item in self.items],
            'createdAt': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else '',
        }

class SalesOrderItem(db.Model):
    __tablename__ = 'sales_order_items'

    id = db.Column(db.String(50), primary_key=True)
    order_id = db.Column(db.String(50), db.ForeignKey('sales_orders.id'), nullable=False)
    product_id = db.Column(db.String(50), db.ForeignKey('products.id'), nullable=True)
    product_name = db.Column(db.String(255), nullable=False)
    sku = db.Column(db.String(80), nullable=True)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False, default=0.00)
    total_price = db.Column(db.Numeric(10, 2), nullable=False, default=0.00)

    def to_dict(self):
        return {
            'id': self.id,
            'productId': self.product_id,
            'name': self.product_name,
            'sku': self.sku,
            'quantity': self.quantity,
            'price': float(self.unit_price) if self.unit_price is not None else 0.0,
            'total': float(self.total_price) if self.total_price is not None else 0.0,
        }

class Vendor(db.Model):
    __tablename__ = 'vendors'

    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(100), nullable=True)
    contact_person = db.Column(db.String(120), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    rating = db.Column(db.Numeric(3, 1), default=4.5)
    balance_due = db.Column(db.Numeric(10, 2), default=0.00)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'contactPerson': self.contact_person,
            'phone': self.phone,
            'email': self.email,
            'city': self.city,
            'rating': float(self.rating) if self.rating is not None else 4.5,
            'balanceDue': float(self.balance_due) if self.balance_due is not None else 0.0,
        }

class PurchaseOrder(db.Model):
    __tablename__ = 'purchase_orders'

    id = db.Column(db.String(50), primary_key=True)
    po_no = db.Column(db.String(50), unique=True, nullable=False, index=True)
    vendor_id = db.Column(db.String(50), db.ForeignKey('vendors.id'), nullable=False)
    vendor_name = db.Column(db.String(150), nullable=True)
    order_date = db.Column(db.String(50), nullable=True)
    expected_delivery = db.Column(db.String(50), nullable=True)
    total_amount = db.Column(db.Numeric(10, 2), default=0.00)
    status = db.Column(db.String(50), default='Pending') # Received, Pending, Partially Received
    items_data = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'poNo': self.po_no,
            'vendorId': self.vendor_id,
            'vendorName': self.vendor_name,
            'orderDate': self.order_date,
            'expectedDelivery': self.expected_delivery,
            'totalAmount': float(self.total_amount) if self.total_amount is not None else 0.0,
            'status': self.status,
            'items': self.items_data or [],
        }
