from datetime import datetime

from flask import Blueprint, jsonify, request

from backend.app.extensions import db
from backend.app.models.ledger import LedgerEntry
from backend.app.models.order import PurchaseOrder, Vendor
from backend.app.models.product import Product

purchases_bp = Blueprint('purchases', __name__)


@purchases_bp.route('/vendors', methods=['GET'])
def get_vendors():
    return jsonify([vendor.to_dict() for vendor in Vendor.query.order_by(Vendor.created_at.desc()).all()]), 200


@purchases_bp.route('/vendors', methods=['POST'])
def create_vendor():
    data = request.get_json() or {}
    if not data.get('name'):
        return jsonify({'error': 'Vendor name is required'}), 400

    vendor = Vendor(
        id=data.get('id') or data.get('customId') or f"VEN-{Vendor.query.count() + 1:03d}",
        name=data['name'],
        category=data.get('category'),
        contact_person=data.get('contactPerson'),
        phone=data.get('phone'),
        email=data.get('email'),
        city=data.get('city'),
        rating=data.get('rating', 5.0),
        balance_due=data.get('balancePayable', data.get('balanceDue', 0.0)),
    )
    db.session.add(vendor)
    db.session.commit()
    return jsonify(vendor.to_dict()), 201


@purchases_bp.route('/vendors/<string:vendor_id>', methods=['DELETE'])
def delete_vendor(vendor_id):
    vendor = Vendor.query.get(vendor_id)
    if not vendor:
        return jsonify({'error': 'Vendor not found'}), 404
    if PurchaseOrder.query.filter_by(vendor_id=vendor_id).first():
        return jsonify({'error': 'Vendor cannot be deleted while purchase orders exist'}), 409
    db.session.delete(vendor)
    db.session.commit()
    return jsonify({'message': 'Vendor deleted'}), 200


@purchases_bp.route('/orders', methods=['GET'])
def get_purchase_orders():
    orders = PurchaseOrder.query.order_by(PurchaseOrder.created_at.desc()).all()
    return jsonify([order.to_dict() for order in orders]), 200


@purchases_bp.route('/orders', methods=['POST'])
def create_purchase_order():
    data = request.get_json() or {}
    vendor = Vendor.query.get(data.get('vendorId'))
    if not vendor:
        return jsonify({'error': 'Vendor not found'}), 404

    order_id = data.get('id') or f"PO-{int(datetime.utcnow().timestamp())}"

    # Standardize items_data to hold items list and metadata if needed
    raw_items = data.get('items', [])
    items_meta = {
        'items': raw_items,
        'supplierInvoiceNo': data.get('supplierInvoiceNo'),
        'supplierInvoiceDate': data.get('supplierInvoiceDate'),
        'supplierInvoiceFile': data.get('supplierInvoiceFile'),
        'supplierInvoiceName': data.get('supplierInvoiceName'),
    }

    order = PurchaseOrder(
        id=order_id,
        po_no=data.get('poNo') or f"PO-{PurchaseOrder.query.count() + 1001}",
        vendor_id=vendor.id,
        vendor_name=vendor.name,
        order_date=data.get('orderDate') or datetime.utcnow().strftime('%Y-%m-%d'),
        expected_delivery=data.get('expectedDate') or data.get('expectedDelivery'),
        total_amount=data.get('total', data.get('totalAmount', 0.0)),
        status='Ordered',
        items_data=items_meta,
        supplier_invoice_no=data.get('supplierInvoiceNo'),
        supplier_invoice_date=data.get('supplierInvoiceDate'),
        supplier_invoice_file=data.get('supplierInvoiceFile'),
        supplier_invoice_name=data.get('supplierInvoiceName'),
    )
    unpaid = max(0, float(data.get('total', 0)) - float(data.get('paidAmount', 0)))
    vendor.balance_due = float(vendor.balance_due or 0) + unpaid
    db.session.add(order)
    if order.total_amount:
        db.session.add(LedgerEntry(
            id=f"LED-PO-{int(datetime.utcnow().timestamp())}",
            date=order.order_date,
            type='DEBIT',
            category='Purchase Order',
            party_type='Supplier',
            party_name=vendor.name,
            description=f"Purchase Order {order.po_no}",
            amount=order.total_amount,
            balance_after=vendor.balance_due,
            reference=order.po_no,
        ))
    db.session.commit()
    return jsonify(order.to_dict()), 201


@purchases_bp.route('/orders/<string:order_id>/invoice', methods=['POST', 'PUT', 'PATCH'])
def upload_purchase_order_invoice(order_id):
    order = PurchaseOrder.query.get(order_id)
    if not order:
        return jsonify({'error': 'Purchase order not found'}), 404

    data = request.get_json() or {}
    order.supplier_invoice_no = data.get('supplierInvoiceNo') or order.supplier_invoice_no
    order.supplier_invoice_date = data.get('supplierInvoiceDate') or order.supplier_invoice_date
    if 'supplierInvoiceFile' in data:
        order.supplier_invoice_file = data.get('supplierInvoiceFile')
    if 'supplierInvoiceName' in data:
        order.supplier_invoice_name = data.get('supplierInvoiceName')

    # Update JSON snapshot
    items_meta = order.items_data if isinstance(order.items_data, dict) else {'items': order.items_data or []}
    items_meta['supplierInvoiceNo'] = order.supplier_invoice_no
    items_meta['supplierInvoiceDate'] = order.supplier_invoice_date
    items_meta['supplierInvoiceFile'] = order.supplier_invoice_file
    items_meta['supplierInvoiceName'] = order.supplier_invoice_name
    order.items_data = items_meta

    db.session.commit()
    return jsonify(order.to_dict()), 200


@purchases_bp.route('/orders/<string:order_id>/receive', methods=['POST'])
def receive_purchase_order(order_id):
    order = PurchaseOrder.query.get(order_id)
    if not order:
        return jsonify({'error': 'Purchase order not found'}), 404

    items_list = order.items_data.get('items', []) if isinstance(order.items_data, dict) else (order.items_data or [])
    for item in items_list:
        product_id = item.get('productId') or item.get('id')
        product = Product.query.get(product_id) if product_id else None
        if product:
            product.stock = int(product.stock or 0) + int(item.get('qty', item.get('quantity', 0)) or 0)
    order.status = 'Completed'
    db.session.commit()
    return jsonify(order.to_dict()), 200