# ThreadCraft Luxe POS & ERP

ThreadCraft Luxe is a garment business management system for purchasing raw materials, selling raw materials directly, manufacturing finished garments, selling finished products, tracking bespoke orders, and paying production employees.

It includes a React/Vite frontend, Flask REST API, MySQL persistence, SQLAlchemy models, JWT authentication, role-based module permissions, and development seed data.

## Business Workflow

```text
Supplier / Mill -> Purchase Orders -> Receive Materials -> Inventory
																												|
												 +------------------------------+------------------------------+
												 |                                                             |
												 v                                                             v
								 Raw Material POS                                      Production Stages
								 Sell fabric, wool,                                    Assign employees and
								 lining, trims, etc.                                   manufacture garments
												 |                                                             |
												 v                                                             v
									Raw-material buyer                                    Ready for Delivery
																																											 |
																																											 v
																																						Employee payment due
																																											 |
																																											 v
																																							Admin settles payment
```

The POS has two separate modes:

1. **Finished Product Sales**: shirts, suits, trousers, denim, ethnic garments, and accessories.
2. **Raw Material Sales**: fabrics, wool, silk, lining, canvas, trims, and similar materials.

Raw-material buyers can be family or individual buyers with multiple measurement profiles, or wholesale buyers such as schools and colleges purchasing uniform materials in bulk.

## Repository Structure

```text
backend/
	app/models/       SQLAlchemy models
	app/routes/       Flask API blueprints
	app/services/     Backend business services
	run.py            Flask entry point
	requirements.txt  Python dependencies
	seed_data.json    Development sample data
	seed_db.py        Recreate and populate MySQL
frontend/
	src/components/   UI modules and modals
	src/context/      Shared application state
	src/pages/        Page-level wrappers
	src/services/     Frontend services
	src/api/          API client and endpoint definitions
	src/styles/       Application and POS styles
mysql/
	init.sql           MySQL schema and direct SQL seed data
```

## Requirements

- Python 3.11 or newer.
- Node.js and npm.
- MySQL 8 or compatible MySQL server.
- A database named `garment_erp`.

The default database URL is:

```text
mysql+pymysql://root:@localhost:3306/garment_erp?charset=utf8mb4
```

Override it in `backend/.env`:

```env
DATABASE_URL=mysql+pymysql://USER:PASSWORD@localhost:3306/garment_erp?charset=utf8mb4
SECRET_KEY=change-this-session-secret
JWT_SECRET_KEY=change-this-jwt-secret
PORT=5001
```

## Installation and Startup

### Backend

```bash
cd backend
python3 -m venv .venv
./.venv/bin/python -m pip install -r requirements.txt
SEED_DB_ALLOW_DESTRUCTIVE=1 ./.venv/bin/python seed_db.py
./.venv/bin/python run.py
```

The API runs at `http://127.0.0.1:5001`.
The startup command verifies the `garment_erp` MySQL connection first and prints a short recovery message if MySQL is unavailable.

Warning: `seed_db.py` drops and recreates all SQLAlchemy tables. Use it only for development data.

### Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`. Vite proxies `/api` requests to Flask on port `5001`.

Build the frontend with:

```bash
npm --prefix frontend run build
```

## Demo Accounts

The seed data uses the default password `password123` for these accounts:

| Username | Role | Typical access |
| --- | --- | --- |
| `admin` | Store Owner & Managing Director | All modules and administration |
| `cashier` | Head Sales Cashier | POS and sales operations |
| `tailor` | Master Tailor & Production Lead | Production and assigned work |
| `manager` | Operations & Accounts Manager | Operations, accounting, and reports |

Visible modules are filtered by the authenticated user’s permissions.

## Global UI

### Login

- **Username** and **Password** authenticate through Flask.
- **Show/hide password** reveals or conceals the password field.
- **Theme toggle** switches the application theme.
- **Quick login buttons** select available demo accounts.

### Header

- **Mobile menu** opens and closes the sidebar on small screens.
- **Global barcode scanner** opens barcode search from any authenticated view.
- **Theme control** changes the theme.
- **Logout** clears the local session and returns to login.

### Sidebar

- **POS & Sales Counter**: billing, barcode scanning, and checkout.
- **Purchase Orders**: suppliers, purchase orders, and material receiving.
- **Profit & Analytics**: revenue, costs, margins, and reports.
- **Account Ledger**: debit/credit entries, balances, and vouchers.
- **Product Stages**: manufacturing, stage progression, and QC.
- **Item Measurement**: garment sizing profiles and job cards.
- **Order Booking**: bespoke orders, advances, delivery, and settlement.
- **Employee & Payroll**: salaries, attendance, work, and production payments.

The sidebar also shows the active cart item count and active production booking count.

## POS & Sales Counter

Changing POS mode clears the active cart so raw materials and finished goods are never mixed accidentally.

### Finished Products mode

Use for finished shirts, suits, trousers, denim, ethnic garments, and accessories.

### Raw Materials mode

Use for raw fabrics, wool, silk, lining, canvas, shoulder pads, threads, and trims. Meter-based and set-based units are stored with each product.

### POS buttons and controls

- **Finished Products**: show finished-goods inventory.
- **Raw Materials**: show raw-material inventory.
- **Hardware Barcode Scanner**: open the scanner modal.
- **Search**: search by name, SKU, barcode, brand, or fabric.
- **Category pills**: filter the visible catalog.
- **Size/Color selectors**: choose variants where available.
- **Add**: add one unit to the cart.
- **Plus/Minus quantity**: change the line quantity.
- **Line discount**: apply a percentage discount to one item.
- **Overall discount**: discount the full ticket.
- **Remove item**: delete a cart line.
- **Clear cart**: empty the cart and selected customer.
- **View Ticket**: scroll to the cart on mobile.
- **Proceed to Tender**: open checkout.

Checkout supports saved or new customers, customer profiles, measurements, cash/card/UPI/split payment, cashier selection, tax, discount, cost, profit, and change due.

**Complete Sale** creates the sales order and items, stores `saleType`, reduces stock, and records a revenue ledger entry.

### Barcode scanner

Enter or scan a barcode, search the matching product, add it to the cart, or close the modal without changing the ticket.

## Purchase Orders

Purchase Orders handles raw materials bought from mills and suppliers.

- **Add Vendor**: create a supplier record.
- **New Purchase Order**: add multiple material lines, quantities, prices, tax, dates, payment, and notes.
- **Purchase Orders tab**: view pending, ordered, received, and completed orders.
- **Vendors tab**: view supplier contact, category, rating, and payable balance.
- **Receive Stock**: mark material received and add quantities to inventory.
- **Delete Vendor**: remove a vendor when allowed.

Workflow: create/select vendor, add materials, save the purchase order, receive the delivery, then verify inventory and ledger changes.

## Profit & Analytics

This module combines sales, product cost, expenses, payroll estimates, and ledger entries.

- Review revenue, expense, gross profit, and net profit.
- Review sales composition and category performance.
- Use available filters to narrow the report.
- **Export CSV** downloads the visible analytics data.

## Account Ledger

The ledger records sales, purchases, customer payments, supplier payments, expenses, advances, and employee payments.

- **Post Ledger Voucher Entry**: create a manual voucher.
- **Party filters**: show all, customer, supplier, or expense entries.
- **Debit/Credit views**: inspect inflows and outflows.
- **Save voucher**: persist date, party, amount, description, and reference.

Automatic ledger events are created by POS checkout, purchase settlement, bespoke delivery settlement, and employee payment settlement.

## Product Stages

Product Stages tracks production from material inward to delivery-ready stock:

1. Fabric Sourcing & Inward.
2. Pattern Making & Cutting.
3. Stitching & Tailoring.
4. Embroidery & Detailing.
5. Washing & Finishing.
6. Quality Check.
7. Ready for Delivery / Showroom Stock.

Controls:

- **Initiate Production Batch**: create a manufacturing lot.
- **Search**: search by lot, customer, garment, employee, fabric code, or booking.
- **Stage pills**: filter the kanban board.
- **Next Stage**: advance the batch and append history.
- **QC Check**: record pass/rework status and remarks.
- **Add another employee**: assign multiple employees to one project.
- **Agreed employee amount**: set each employee’s project payment.

When a batch reaches `Ready for Delivery`, `Ready`, or `Showroom / Ready Stock`, linked production jobs become `READY_FOR_PAYMENT`.

## Item Measurement

Measurement profiles store reusable sizing data for bespoke garments and family buyers.

- **New measurement profile**: create a customer profile.
- **Customer selector**: choose a buyer or family account.
- **Garment type selector**: keep different measurements for different garments.
- **Preset buttons**: apply available common templates.
- **Measurement fields**: enter chest, waist, shoulder, sleeve, trouser, and garment-specific values.
- **Fit preference**: record slim, regular, comfort, or custom fit.
- **Posture notes**: record construction and alteration instructions.
- **Save profile**: create or update the profile.
- **Export job card**: download a production-ready job card.

One customer can have several profiles, which supports different family members and different garments.

## Order Booking

Order Booking manages advance-paid bespoke orders.

- **New Customer**: register a customer without leaving bookings.
- **New Booking**: create a bespoke order with garment, fabric, measurements, assigned master, price, advance, and delivery date.
- **Bookings tab**: view active and completed bookings.
- **Clients tab**: search and manage customer records.
- **Status filters**: filter bookings by status.
- **Record payment**: add a customer payment and reduce balance due.
- **Deliver & Settle**: mark the booking delivered, settle the customer balance, unlock linked legacy job payouts, and record the ledger event.
- **Customer profile**: view bills, bookings, measurements, and ledger activity.

## Employee & Payroll

### Employee tabs

- **Performance & Piece-Rate Salary Engine**: calculate base salary, pieces, commissions, overtime, bonuses, deductions, and net pay.
- **Ready Employee Payments**: show only production jobs released by a ready-for-delivery stage.
- **Employee Profiles**: view employee data, loans, project history, paid amounts, and unpaid amounts.
- **Daily Attendance Logs**: manage attendance, clock-in/out, status, overtime, and notes.
- **Assigned Work**: view legacy booking work and mark it complete.

### Employee buttons

- **Add Employee**: create a staff profile.
- **Attendance Punch**: create attendance.
- **Guide**: open the compensation guide.
- **Edit Pay**: update salary, rates, overtime, bonuses, and deductions.
- **Advance Loan**: record an employee advance and monthly deduction.
- **Payslip / PDF**: generate a salary slip.
- **Settle Payment**: pay a ready production job and move it to paid history.
- **Mark Complete**: complete a legacy assigned booking job.
- **Check In / Check Out**: timestamp attendance.
- **Present / Absent / Half Day / Leave**: update attendance status.

Each production project records employee, quantity, agreed amount, ready status, paid status, payment method, and timestamps.

## Buyer Types

Customers use two independent classifications:

### Buyer type

- `finished_product`: primarily buys ready garments.
- `raw_material`: buys fabrics, trims, lining, and other materials.
- `both`: can buy both catalog types.

### Customer segment

- `retail`: individual finished-product buyer.
- `family`: buyer with several people or measurement profiles.
- `wholesale`: institution, school, college, company, or uniform procurement buyer.

## Backend API Overview

| Area | Main endpoints |
| --- | --- |
| Health | `GET /api/health` |
| Auth | `POST /api/auth/login`, `GET /api/auth/me`, `GET /api/auth/users` |
| Products | `GET /api/products`, `POST /api/products`, `PUT /api/products/:id` |
| POS | `GET /api/pos/orders`, `POST /api/pos/checkout` |
| Customers | `GET/POST /api/customers`, `PUT/PATCH /api/customers/:id` |
| Measurements | `GET /api/customers/measurements`, `POST/PUT /api/customers/measurements` |
| Purchases | `/api/purchases/vendors`, `/api/purchases/orders` |
| Bookings | `/api/bookings`, `/api/bookings/:id/deliver-and-settle` |
| Stages | `/api/ledger/stages`, `/api/ledger/stages/:id` |
| Ledger | `GET/POST /api/ledger` |
| Employees | `/api/employees`, `/api/employees/attendance` |
| Work payments | `GET /api/employees/work-payments`, `POST /api/employees/work-payments/:id/settle` |
| Production jobs | `GET /api/ledger/production-jobs` |

## Data Model

- `Product`: finished goods and raw materials, stock, unit, prices, category, SKU, barcode, variants, and tax.
- `Customer`: buyer type, segment, balance, credit limit, and contact details.
- `Measurement`: multiple garment-specific sizing profiles per customer.
- `Vendor`: mill or supplier information and payable balance.
- `PurchaseOrder`: raw-material purchasing and receiving.
- `SalesOrder` and `SalesOrderItem`: POS invoices and lines with `saleType`.
- `OrderBooking`: bespoke order, advance, balance, delivery, and master.
- `ProductStage`: production batch and stage history.
- `ProductionJob`: employee assignment, agreed amount, readiness, and payment history.
- `Employee`: salary, piece rate, overtime, loan, attendance, and project history.
- `LedgerEntry`: financial audit trail.

## Troubleshooting

### Frontend cannot load data

Run both services from their own directories:

```bash
cd backend && .venv/bin/python run.py
cd frontend && npm run dev
```

### Database column or table errors

Recreate the development schema and sample data:

```bash
cd backend
SEED_DB_ALLOW_DESTRUCTIVE=1 ./.venv/bin/python seed_db.py
```

This deletes existing data in the configured database.

### Health check

```bash
curl http://localhost:5001/api/health
```

### Verify seeded records

```bash
curl http://localhost:5001/api/products
curl http://localhost:5001/api/customers
curl http://localhost:5001/api/employees/work-payments
```

## Validation Commands

```bash
python3 -m compileall -q backend/app backend/seed_db.py
python3 -m json.tool backend/seed_data.json >/dev/null
npm --prefix frontend run build
git diff --check
```

## Production Notes

- Never run `seed_db.py` against production because it drops all tables.
- Replace default secrets and demo passwords.
- Run Flask behind a production WSGI server instead of debug mode.
- Use migrations for deployed schema changes.
- Restrict CORS from `*` to the real frontend domain.
- Back up MySQL before schema or data changes.
