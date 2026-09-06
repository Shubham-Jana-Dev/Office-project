from datetime import datetime
from flask import Blueprint, request, jsonify
from backend.app.models.order import SalesOrder, SalesOrderItem
from backend.app.models.product import Product
from backend.app.models.ledger import LedgerEntry
from backend.app.extensions import db

pos_bp = Blueprint('pos', __name__)

@pos_bp.route('/orders', methods=['GET'])
def get_orders():
    orders = SalesOrder.query.order_by(SalesOrder.created_at.desc()).all()
    return jsonify([o.to_dict() for o in orders]), 200

@pos_bp.route('/checkout', methods=['POST'])
def checkout():
    """
    Atomic transaction:
    1. Create SalesOrder and SalesOrderItems
    2. Deduct inventory from products
    3. Record income ledger entry
    If any step fails, roll back everything!
    """
    data = request.get_json() or {}
    items = data.get('items', [])
    if not items:
        return jsonify({'error': 'Cart is empty'}), 400

    order_id = data.get('id') or f"ORD-{int(datetime.utcnow().timestamp())}"
    order_no = data.get('orderNo') or f"INV-2026-{SalesOrder.query.count() + 1001}"
    customer_id = data.get('customerId')
    customer_name = data.get('customerName', 'Walk-in Customer')
    cashier_name = data.get('cashierName', 'Store Cashier')
    subtotal = data.get('subtotal', 0.0)
    discount = data.get('discount', 0.0)
    tax = data.get('tax', 0.0)
    total = data.get('total', 0.0)
    payment_method = data.get('paymentMethod', 'Cash')
    sale_type = data.get('saleType', 'finished_product')

    try:
        # 1. Create Sales Order
        order = SalesOrder(
            id=order_id,
            order_no=order_no,
            customer_id=customer_id,
            customer_name=customer_name,
            cashier_name=cashier_name,
            subtotal=subtotal,
            discount=discount,
            tax=tax,
            total=total,
            payment_method=payment_method,
            sale_type=sale_type,
            status='Completed',
            items_data=items,
        )
        db.session.add(order)

        # 2. Add Order Items & Deduct Stock
        for item in items:
            product_id = item.get('productId') or item.get('id')
            qty = int(item.get('quantity', 1))
            unit_price = float(item.get('price', 0.0))

            order_item = SalesOrderItem(
                id=f"{order_id}-{product_id}",
                order_id=order_id,
                product_id=product_id,
                product_name=item.get('name', 'Product'),
                sku=item.get('sku'),
                quantity=qty,
                unit_price=unit_price,
                total_price=qty * unit_price,
            )
            db.session.add(order_item)

            # Deduct Stock
            product = Product.query.get(product_id)
            if product:
                product.stock = max(0, product.stock - qty)

        # 3. Create Ledger Entry for Income
        last_entry = LedgerEntry.query.order_by(LedgerEntry.created_at.desc()).first()
        prev_balance = float(last_entry.balance_after) if last_entry else 15000.0
        new_balance = prev_balance + float(total)

        ledger_entry = LedgerEntry(
            id=f"LED-{int(datetime.utcnow().timestamp())}",
            date=datetime.utcnow().strftime('%Y-%m-%d'),
            type='CREDIT',
            category='POS Sales Revenue',
            description=f"POS Sale Receipt #{order_no} ({customer_name})",
            amount=total,
            balance_after=new_balance,
            reference=order_no,
        )
        db.session.add(ledger_entry)

        # Commit all atomically
        db.session.commit()
        return jsonify({
            'message': 'Checkout completed successfully',
            'order': order.to_dict(),
            'ledgerEntry': ledger_entry.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Checkout failed: {str(e)}'}), 500
