import json

with open('seed_data.json', 'r') as f:
    data = json.load(f)

tasks = ['Ari', 'Salma', 'Chumki', 'Gujrati', 'Ripu', 'P. Ko', 'Falls', 'Polish', 'Fabrick', 'Khatha', 'Embrodory', 'Dry']

base_id = 200
for i, task in enumerate(tasks):
    data['INITIAL_PRODUCTS'].append({
        "id": f"PRD-{base_id + i}",
        "sku": f"FIN-TSK-{base_id + i}",
        "barcode": f"890100{base_id + i}",
        "name": task,
        "category": "Finishing Task",
        "brand": "ThreadCraft",
        "fabric": "N/A",
        "costPrice": 0.0,
        "price": 0.0,
        "mrp": 0.0,
        "stock": 1,
        "minStock": 1,
        "unit": "Task",
        "sizes": [],
        "colors": [],
        "fit": "N/A",
        "taxRate": 0.0,
        "hsn": "0000",
        "image": "🪡",
        "assignedEmployee": "Not Assigned",
        "baseIncentive": 30.0
    })

with open('seed_data.json', 'w') as f:
    json.dump(data, f, indent=2)
