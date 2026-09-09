from flask import Blueprint, request, jsonify
from backend.app.models.product import Product
from backend.app.extensions import db

products_bp = Blueprint('products', __name__)

@products_bp.route('', methods=['GET'])
def get_products():
    category = request.args.get('category')
    query = Product.query
    if category:
        query = query.filter_by(category=category)
    products = query.all()
    return jsonify([p.to_dict() for p in products]), 200

@products_bp.route('/<string:product_id>', methods=['GET'])
def get_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    return jsonify(product.to_dict()), 200

@products_bp.route('/barcode/<string:barcode>', methods=['GET'])
def get_by_barcode(barcode):
    product = Product.query.filter_by(barcode=barcode).first()
    if not product:
        return jsonify({'error': 'Barcode not found'}), 404
    return jsonify(product.to_dict()), 200

@products_bp.route('', methods=['POST'])
def create_product():
    data = request.get_json() or {}
    required = ['name', 'sku', 'price']
    for field in required:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400

    new_id = data.get('id') or f"PRD-{int(Product.query.count()) + 101}"
    product = Product(
        id=new_id,
        sku=data.get('sku'),
        barcode=data.get('barcode') or f"890100{Product.query.count() + 1000}",
        name=data.get('name'),
        category=data.get('category'),
        brand=data.get('brand'),
        fabric=data.get('fabric'),
        cost_price=data.get('costPrice', 0.0),
        price=data.get('price', 0.0),
        mrp=data.get('mrp', data.get('price', 0.0)),
        stock=data.get('stock', 0),
        min_stock=data.get('minStock', 5),
        sizes=data.get('sizes', []),
        colors=data.get('colors', []),
        fit=data.get('fit'),
        tax_rate=data.get('taxRate', 12.0),
        hsn=data.get('hsn'),
        assigned_employee=data.get('assignedEmployee', 'Not Assigned'),
        base_incentive=data.get('baseIncentive', 0.0),
        image=data.get('image', '👔')
    )
    db.session.add(product)
    db.session.commit()
    return jsonify(product.to_dict()), 201

@products_bp.route('/<string:product_id>', methods=['PUT', 'PATCH'])
def update_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    data = request.get_json() or {}

    if 'name' in data: product.name = data['name']
    if 'stock' in data: product.stock = data['stock']
    if 'price' in data: product.price = data['price']
    if 'costPrice' in data: product.cost_price = data['costPrice']
    if 'minStock' in data: product.min_stock = data['minStock']
    if 'sizes' in data: product.sizes = data['sizes']
    if 'assignedEmployee' in data: product.assigned_employee = data['assignedEmployee']
    if 'baseIncentive' in data: product.base_incentive = data['baseIncentive']
    if 'category' in data: product.category = data['category']

    db.session.commit()
    return jsonify(product.to_dict()), 200

@products_bp.route('/<string:product_id>', methods=['DELETE'])
def delete_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    db.session.delete(product)
    db.session.commit()
    return jsonify({'message': 'Product deleted successfully'}), 200
