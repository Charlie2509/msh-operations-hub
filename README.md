# MSH Operations Hub

MSH's internal operations system. The first production module is **Macron delivery receiving and order sorting**.

## Current workflow

1. Admin imports Macron order CSV exports from a desktop PC.
2. A DHL delivery arrives. It may contain boxes from several Macron shipments.
3. Staff starts one receiving session on a phone.
4. Scan/paste the square Macron/DataDea QR URL from any box. The backend downloads and validates the shipment packing-list PDF.
5. Scan the linear barcode on the physical Macron box to make that box active.
6. Rapid-scan garment EANs with a Bluetooth scanner paired to the phone.
7. The app uses **active box + shipment packing list + imported order CSV + remaining quantity** to tell staff which MSH order the garment belongs to.
8. Every scan is audited. Wrong-box scans and over-scans are rejected rather than silently allocated.

## Why the data model is split

The system deliberately treats these as different things:

- **Order** — what MSH ordered from Macron.
- **Macron shipment** — what Macron says it shipped.
- **Shipment box** — a physical carton within a Macron shipment.
- **Receiving session** — what DHL physically dropped at MSH on one occasion; this may contain multiple Macron shipments.
- **Scan event** — what MSH physically verified.

That separation is intended to support later stock, production, purchasing and inventory modules without rebuilding receiving.

## Reliability rules already implemented

- Packing-list PDFs are rejected if parsed piece totals or box totals do not reconcile with the totals printed in the PDF.
- A garment scan is not allocated without an active physical box.
- Product allocation is constrained to items Macron says are in that box.
- Over-scans are blocked once the shipped quantity for a packing-list line has been reached.
- Every scan event is logged.
- The application does not require Macron shipment boundaries to match a physical DHL arrival.

## Local development

### Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL (normally `http://localhost:5173`).

## Hosting direction

The code is intentionally platform-neutral. For the first hosted version the likely low-maintenance setup is:

- static React/Vite frontend;
- small hosted FastAPI service;
- managed Postgres once the receiving workflow is proven.

SQLite is development-only and is excluded from Git.

## Next build targets

- undo/correction flow with supervisor audit reason;
- box progress and outstanding box list per receiving session;
- automatic session summary across multiple Macron shipments;
- better handling for DataDea links that have expired;
- user authentication and permissions;
- Postgres migration and production deployment;
- offline/retry queue for poor signal in the car park;
- automated tests using synthetic fixtures (no customer/shipment data committed to this public repository).
