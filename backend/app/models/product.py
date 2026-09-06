from datetime import datetime
from backend.app.extensions import db

class Product(db.Model):
    __tablename__ = 'products'

    id = db.Column(db.String(50), primary_key=True) # e.g. PRD-101
    sku = db.Column(db.String(80), unique=True, nullable=False, index=True)
    barcode = db.Column(db.String(80), unique=True, nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(100), nullable=True)
    brand = db.Column(db.String(100), nullable=True)
    fabric = db.Column(db.String(150), nullable=True)
    cost_price = db.Column(db.Numeric(10, 2), nullable=False, default=0.00)
    price = db.Column(db.Numeric(10, 2), nullable=False, default=0.00)
    mrp = db.Column(db.Numeric(10, 2), nullable=False, default=0.00)
    stock = db.Column(db.Integer, nullable=False, default=0)
    unit = db.Column(db.String(30), nullable=True, default='Piece')
    min_stock = db.Column(db.Integer, nullable=False, default=5)
    sizes = db.Column(db.JSON, nullable=True) # ['S', 'M', 'L']
    colors = db.Column(db.JSON, nullable=True) # ['Crisp White', 'Navy']
    fit = db.Column(db.String(50), nullable=True)
    tax_rate = db.Column(db.Numeric(5, 2), default=12.00)
    hsn = db.Column(db.String(30), nullable=True)
    image = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'sku': self.sku,
            'barcode': self.barcode,
            'name': self.name,
            'category': self.category,
            'brand': self.brand,
            'fabric': self.fabric,
            'costPrice': float(self.cost_price) if self.cost_price is not None else 0.0,
            'price': float(self.price) if self.price is not None else 0.0,
            'mrp': float(self.mrp) if self.mrp is not None else 0.0,
            'stock': self.stock,
            'unit': self.unit or 'Piece',
            'minStock': self.min_stock,
            'sizes': self.sizes or [],
            'colors': self.colors or [],
            'fit': self.fit,
            'taxRate': float(self.tax_rate) if self.tax_rate is not None else 12.0,
            'hsn': self.hsn,
            'image': self.image or '👔',
        }
