import os
from typing import Any

import httpx
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .database import connect, init_db
from .importers import (
    box_code_from_linear_barcode,
    import_order_csv,
    is_datadea_pdf_url,
    product_code_matches_barcode,
)
from .shipment_parser import parse_packing_list

app = FastAPI(title='MSH Ops API', version='0.2.0')

allowed_origins = [x.strip() for x in os.getenv('MSH_ALLOWED_ORIGINS', 'http://localhost:5173').split(',') if x.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

@app.on_event('startup')
def startup():
    init_db()

@app.get('/api/health')
def health():
    return {'ok': True, 'version': '0.2.0'}

@app.post('/api/orders/import-csv')
async def upload_order_csv(file: UploadFile = File(...)):
    content = await file.read()
    try:
        with connect() as conn:
            return import_order_csv(conn, content, file.filename or 'upload.csv')
    except (ValueError, UnicodeDecodeError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@app.post('/api/shipments/import-pdf')
async def upload_shipment_pdf(file: UploadFile = File(...)):
    content = await file.read()
    try:
        return _save_parsed_shipment(parse_packing_list(content), source_url=None)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

class UrlImport(BaseModel):
    url: str

@app.post('/api/shipments/import-url')
async def import_shipment_url(body: UrlImport):
    if not is_datadea_pdf_url(body.url):
        raise HTTPException(status_code=400, detail='Only Macron/DataDea PDF URLs are accepted')
    try:
        async with httpx.AsyncClient(timeout=25, follow_redirects=True) as client:
            response = await client.get(body.url)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail='Could not reach the Macron packing-list service') from exc
    if response.status_code != 200 or 'pdf' not in response.headers.get('content-type', '').lower():
        raise HTTPException(status_code=502, detail=f'Could not retrieve packing-list PDF (HTTP {response.status_code})')
    try:
        return _save_parsed_shipment(parse_packing_list(response.content), source_url=body.url)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

def _save_parsed_shipment(parsed, source_url: str | None):
    with connect() as conn:
        conn.execute(
            '''INSERT INTO shipments(delivery_number, source_url, total_pieces, total_boxes)
               VALUES (?, ?, ?, ?)
               ON CONFLICT(delivery_number) DO UPDATE SET
                 source_url=COALESCE(excluded.source_url, shipments.source_url),
                 total_pieces=COALESCE(excluded.total_pieces, shipments.total_pieces),
                 total_boxes=COALESCE(excluded.total_boxes, shipments.total_boxes)''',
            (parsed.delivery_number, source_url, parsed.total_pieces, parsed.total_boxes),
        )
        shipment_id = conn.execute('SELECT id FROM shipments WHERE delivery_number=?', (parsed.delivery_number,)).fetchone()['id']
        conn.execute('DELETE FROM shipment_lines WHERE shipment_id=?', (shipment_id,))
        box_ids: dict[str, int] = {}
        for row in parsed.lines:
            box = row['box_code']
            conn.execute('INSERT OR IGNORE INTO shipment_boxes(shipment_id, box_code) VALUES (?,?)', (shipment_id, box))
            boxrow = conn.execute('SELECT id FROM shipment_boxes WHERE shipment_id=? AND box_code=?', (shipment_id, box)).fetchone()
            box_ids[box] = boxrow['id']
            conn.execute(
                '''INSERT INTO shipment_lines(shipment_id, box_id, macron_order_id, product_code, description, size, quantity_shipped)
                   VALUES (?,?,?,?,?,?,?)''',
                (shipment_id, boxrow['id'], row['macron_order_id'], row['product_code'], row['description'], row['size'], row['quantity']),
            )
        conn.commit()
    return {'delivery_number': parsed.delivery_number, 'total_pieces': parsed.total_pieces, 'total_boxes': parsed.total_boxes, 'boxes_parsed': len(box_ids), 'lines_parsed': len(parsed.lines)}

class SessionCreate(BaseModel):
    opened_by: str | None = None

@app.post('/api/receiving-sessions')
def create_receiving_session(body: SessionCreate):
    with connect() as conn:
        cur = conn.execute('INSERT INTO receiving_sessions(opened_by) VALUES (?)', (body.opened_by,))
        conn.commit()
        return {'id': cur.lastrowid, 'opened_by': body.opened_by}

@app.get('/api/receiving-sessions/{session_id}')
def get_receiving_session(session_id: int):
    with connect() as conn:
        session = conn.execute(
            '''SELECT rs.*, sb.box_code AS active_box_code, s.delivery_number AS active_delivery_number
               FROM receiving_sessions rs
               LEFT JOIN shipment_boxes sb ON sb.id=rs.active_box_id
               LEFT JOIN shipments s ON s.id=sb.shipment_id
               WHERE rs.id=?''',
            (session_id,),
        ).fetchone()
        if not session:
            raise HTTPException(status_code=404, detail='Receiving session not found')
        return dict(session)

@app.post('/api/receiving-sessions/{session_id}/close')
def close_receiving_session(session_id: int):
    with connect() as conn:
        cur = conn.execute('UPDATE receiving_sessions SET closed_at=CURRENT_TIMESTAMP WHERE id=? AND closed_at IS NULL', (session_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail='Open receiving session not found')
        conn.commit()
        return {'closed': True, 'id': session_id}

class ScanRequest(BaseModel):
    value: str
    session_id: int | None = None

def _require_open_session(conn, session_id: int | None):
    if session_id is None:
        return None
    session = conn.execute('SELECT * FROM receiving_sessions WHERE id=? AND closed_at IS NULL', (session_id,)).fetchone()
    if not session:
        raise HTTPException(status_code=409, detail='Receiving session is missing or closed')
    return session

def _log_scan(conn, **values: Any):
    conn.execute(
        '''INSERT INTO scan_events(session_id, scan_type, raw_value, matched_order_id, matched_order_line_id, matched_box_id, matched_shipment_line_id, result)
           VALUES (?,?,?,?,?,?,?,?)''',
        (values.get('session_id'), values['scan_type'], values['raw_value'], values.get('matched_order_id'), values.get('matched_order_line_id'), values.get('matched_box_id'), values.get('matched_shipment_line_id'), values['result']),
    )

@app.post('/api/scan')
def scan(req: ScanRequest):
    raw = req.value.strip()
    if not raw:
        raise HTTPException(status_code=400, detail='Empty scan')
    if is_datadea_pdf_url(raw):
        return {'kind': 'shipment_url', 'action': 'import_shipment', 'value': raw}
    with connect() as conn:
        session = _require_open_session(conn, req.session_id)
        maybe_box = box_code_from_linear_barcode(raw)
        if maybe_box:
            box = conn.execute(
                '''SELECT sb.id, sb.box_code, s.delivery_number, s.total_boxes, s.total_pieces
                   FROM shipment_boxes sb JOIN shipments s ON s.id=sb.shipment_id
                   WHERE replace(sb.box_code, ' ', '') LIKE ? LIMIT 1''',
                (f'%{maybe_box[-10:]}%',),
            ).fetchone()
            if not box:
                _log_scan(conn, session_id=req.session_id, scan_type='box', raw_value=raw, result='unmatched')
                conn.commit()
                return {'kind': 'box', 'matched': False, 'derived_box_code': maybe_box}
            conn.execute(
                '''UPDATE shipment_boxes SET first_received_at=COALESCE(first_received_at, CURRENT_TIMESTAMP), last_received_at=CURRENT_TIMESTAMP, barcode_value=COALESCE(barcode_value, ?) WHERE id=?''',
                (raw, box['id']),
            )
            if session:
                conn.execute('UPDATE receiving_sessions SET active_box_id=? WHERE id=?', (box['id'], req.session_id))
            _log_scan(conn, session_id=req.session_id, scan_type='box', raw_value=raw, matched_box_id=box['id'], result='matched')
            conn.commit()
            return {'kind': 'box', 'matched': True, **dict(box)}
        if session and session['active_box_id']:
            allocation = _allocate_product_in_active_box(conn, req.session_id, session['active_box_id'], raw)
            conn.commit()
            return allocation
        matches = conn.execute(
            '''SELECT ol.id FROM order_lines ol JOIN orders o ON o.id=ol.order_id WHERE ol.barcode=?''',
            (raw,),
        ).fetchall()
        if matches:
            _log_scan(conn, session_id=req.session_id, scan_type='product', raw_value=raw, result='needs_box')
            conn.commit()
            return {'kind': 'product', 'matched': True, 'needs_box': True, 'message': 'Scan the Macron box barcode first so this garment can be allocated safely.'}
        _log_scan(conn, session_id=req.session_id, scan_type='unknown', raw_value=raw, result='unmatched')
        conn.commit()
        return {'kind': 'unknown', 'matched': False, 'value': raw}

def _allocate_product_in_active_box(conn, session_id: int, box_id: int, barcode: str):
    rows = conn.execute(
        '''SELECT sl.id AS shipment_line_id, sl.quantity_shipped, sl.product_code, sl.size, sl.description, sl.macron_order_id,
                  o.id AS order_id, o.reference_note, ol.id AS order_line_id, ol.barcode, ol.name,
                  (SELECT COUNT(*) FROM scan_events se WHERE se.matched_shipment_line_id=sl.id AND se.result='accepted') AS already_scanned
           FROM shipment_lines sl
           JOIN orders o ON o.macron_order_id=sl.macron_order_id
           JOIN order_lines ol ON ol.order_id=o.id AND ol.barcode=?
           WHERE sl.box_id=? AND (ol.size=sl.size OR ol.size IS NULL OR ol.size='') ORDER BY sl.id''',
        (barcode, box_id),
    ).fetchall()
    candidates = [row for row in rows if product_code_matches_barcode(row['product_code'], barcode)]
    available = [row for row in candidates if row['already_scanned'] < row['quantity_shipped']]
    if not available:
        result = 'over_scan' if candidates else 'wrong_box'
        _log_scan(conn, session_id=session_id, scan_type='product', raw_value=barcode, matched_box_id=box_id, result=result)
        return {'kind': 'product', 'matched': False, 'reason': result, 'message': 'This item has already reached the quantity Macron says is in this box.' if result == 'over_scan' else 'This barcode is not expected in the active Macron box.'}
    chosen = available[0]
    new_count = chosen['already_scanned'] + 1
    _log_scan(conn, session_id=session_id, scan_type='product', raw_value=barcode, matched_order_id=chosen['order_id'], matched_order_line_id=chosen['order_line_id'], matched_box_id=box_id, matched_shipment_line_id=chosen['shipment_line_id'], result='accepted')
    return {'kind': 'product', 'matched': True, 'accepted': True, 'order_id': chosen['order_id'], 'macron_order_id': chosen['macron_order_id'], 'reference_note': chosen['reference_note'], 'product_code': chosen['product_code'], 'name': chosen['name'] or chosen['description'], 'size': chosen['size'], 'box_id': box_id, 'line_progress': {'scanned': new_count, 'expected_in_box': chosen['quantity_shipped']}}

@app.get('/api/dashboard')
def dashboard():
    with connect() as conn:
        counts = {
            'orders': conn.execute('SELECT COUNT(*) c FROM orders').fetchone()['c'],
            'order_lines': conn.execute('SELECT COUNT(*) c FROM order_lines').fetchone()['c'],
            'shipments': conn.execute('SELECT COUNT(*) c FROM shipments').fetchone()['c'],
            'boxes': conn.execute('SELECT COUNT(*) c FROM shipment_boxes').fetchone()['c'],
            'verified_items': conn.execute("SELECT COUNT(*) c FROM scan_events WHERE scan_type='product' AND result='accepted'").fetchone()['c'],
        }
        recent = [dict(r) for r in conn.execute('SELECT * FROM scan_events ORDER BY id DESC LIMIT 10').fetchall()]
    return {**counts, 'recent_scans': recent}
