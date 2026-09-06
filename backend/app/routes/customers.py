from flask import Blueprint, request, jsonify
from backend.app.models.customer import Customer, Measurement
from backend.app.extensions import db

customers_bp = Blueprint('customers', __name__)

@customers_bp.route('', methods=['GET'])
def get_customers():
    customers = Customer.query.all()
    return jsonify([c.to_dict() for c in customers]), 200

@customers_bp.route('/<string:customer_id>', methods=['GET'])
def get_customer(customer_id):
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({'error': 'Customer not found'}), 404
    return jsonify(customer.to_dict()), 200

@customers_bp.route('/<string:customer_id>', methods=['PUT', 'PATCH'])
def update_customer(customer_id):
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({'error': 'Customer not found'}), 404

    data = request.get_json() or {}
    if 'name' in data: customer.name = data['name']
    if 'phone' in data: customer.phone = data['phone']
    if 'email' in data: customer.email = data['email']
    if 'city' in data: customer.city = data['city']
    if 'gstin' in data: customer.gstin = data['gstin']
    if 'creditLimit' in data: customer.credit_limit = data['creditLimit']
    if 'balance' in data: customer.balance = data['balance']
    if 'buyerType' in data: customer.buyer_type = data['buyerType']
    if 'customerSegment' in data: customer.customer_segment = data['customerSegment']

    db.session.commit()
    return jsonify(customer.to_dict()), 200

@customers_bp.route('/<string:customer_id>', methods=['DELETE'])
def delete_customer(customer_id):
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({'error': 'Customer not found'}), 404
    db.session.delete(customer)
    db.session.commit()
    return jsonify({'message': 'Customer deleted'}), 200

@customers_bp.route('', methods=['POST'])
def create_customer():
    data = request.get_json() or {}
    new_id = data.get('id') or f"CUST-{Customer.query.count() + 101}"
    customer = Customer(
        id=new_id,
        name=data.get('name'),
        phone=data.get('phone'),
        email=data.get('email'),
        city=data.get('city'),
        gstin=data.get('gstin'),
        credit_limit=data.get('creditLimit', 0.0),
        balance=data.get('balance', 0.0),
        buyer_type=data.get('buyerType', 'finished_product'),
        customer_segment=data.get('customerSegment', 'retail'),
    )
    db.session.add(customer)
    db.session.commit()
    return jsonify(customer.to_dict()), 201

@customers_bp.route('/measurements', methods=['GET'])
def get_measurements():
    customer_id = request.args.get('customerId')
    query = Measurement.query
    if customer_id:
        query = query.filter_by(customer_id=customer_id)
    measurements = query.all()
    return jsonify([m.to_dict() for m in measurements]), 200

@customers_bp.route('/measurements', methods=['POST', 'PUT'])
def save_measurement():
    data = request.get_json() or {}
    measurement = Measurement.query.get(data.get('id')) if data.get('id') else None
    if measurement:
        measurement.customer_id = data.get('customerId', measurement.customer_id)
        measurement.customer_name = data.get('customerName', measurement.customer_name)
        measurement.customer_phone = data.get('customerPhone', measurement.customer_phone)
        measurement.suit_type = data.get('suitType', measurement.suit_type)
        measurement.measurements = data.get('measurements', measurement.measurements)
        measurement.fit_preference = data.get('fitPreference', measurement.fit_preference)
        measurement.posture_notes = data.get('postureNotes', measurement.posture_notes)
    else:
        measurement = Measurement(
            id=data.get('id') or f"MSR-{Measurement.query.count() + 101}",
            customer_id=data.get('customerId'),
            customer_name=data.get('customerName'),
            customer_phone=data.get('customerPhone'),
            suit_type=data.get('suitType', 'Bespoke Suit'),
            measurements=data.get('measurements', {}),
            fit_preference=data.get('fitPreference'),
            posture_notes=data.get('postureNotes'),
        )
        db.session.add(measurement)
    db.session.commit()
    return jsonify(measurement.to_dict()), 200 if data.get('id') else 201
