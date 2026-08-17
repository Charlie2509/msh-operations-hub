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

app = FastAPI(title='MSH Ops API', version='0.4.0')

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
    return {'ok': True, 'version': '0.4.0'}

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
        async with httpx.AsyncClient(
            timeout=30,
            follow_redirects=True,
            headers={'User-Agent': 'Mozilla/5.0 MSH-Ops/0.4'},
        ) as client:
            response = await client.get(body.url)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail='Could not reach the Macron packing-list service') from exc
    content_type = response.headers.get('content-type', '').lower()
    if response.status_code != 200 or ('pdf' not in content_type and not response.content.startswith(b'%PDF')):
        raise HTTPException(status_code=502, detail=f'Could not retrieve packing-list PDF (HTTP {response.status_code})')
    try:
        return _save_parsed_shipment(parse_packing_list(response.content), source_url=body.url)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

def _save_parsed_shipment(parsed, source_url: str | None):
    if not parsed.delivery_number:
        raise ValueError('Packing list parsed, but no Macron delivery number was found')
    if not parsed.lines:
        raise ValueError('Packing list parsed, but no product lines were found')

    parsed_pieces = sum(int(row['quantity']) for row in parsed.lines)
    parsed_boxes = len({row['box_code'] for row in parsed.lines})
    if parsed.total_pieces is not None and parsed_pieces != parsed.total_pieces:
        raise ValueError(f'Packing-list safety check failed: parsed {parsed_pieces} pieces but Macron says {parsed.total_pieces}')
    if parsed.total_boxes is not None and parsed_boxes != parsed.total_boxes:
        raise ValueError(f'Packing-list safety check failed: parsed {parsed_boxes} boxes but Macron says {parsed.total_boxes}')

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
    return {
        'delivery_number': parsed.delivery_number,
        'total_pieces': parsed.total_pieces,
        'total_boxes': parsed.total_boxes,
        'boxes_parsed': len(box_ids),
        'lines_parsed': len(parsed.lines),
        'parsed_pieces': parsed_pieces,
        'safety_checks_passed': True,
    }

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
        verified = conn.execute(
            '''SELECT COUNT(*) c FROM scan_events se
               WHERE se.session_id=? AND se.scan_type='product' AND se.result='accepted'
               AND NOT EXISTS (SELECT 1 FROM scan_corrections sc WHERE sc.scan_event_id=se.id)''',
            (session_id,),
        ).fetchone()['c']
        return {**dict(session), 'verified_items': verified}

@app.get('/api/receiving-sessions/{session_id}/summary')
def receiving_session_summary(session_id: int):
    with connect() as conn:
        session = conn.execute('SELECT * FROM receiving_sessions WHERE id=?', (session_id,)).fetchone()
        if not session:
            raise HTTPException(status_code=404, detail='Receiving session not found')

        verified = conn.execute(
            '''SELECT COUNT(*) c FROM scan_events se
               WHERE se.session_id=? AND se.scan_type='product' AND se.result='accepted'
               AND NOT EXISTS (SELECT 1 FROM scan_corrections sc WHERE sc.scan_event_id=se.id)''',
            (session_id,),
        ).fetchone()['c']
        corrections = conn.execute('SELECT COUNT(*) c FROM scan_corrections WHERE session_id=?', (session_id,)).fetchone()['c']
        exceptions = conn.execute(
            "SELECT COUNT(*) c FROM scan_events WHERE session_id=? AND result IN ('wrong_box','over_scan','ambiguous','unmatched')",
            (session_id,),
        ).fetchone()['c']

        box_rows = conn.execute(
            '''SELECT sb.id, sb.box_code, s.delivery_number,
                      COALESCE((SELECT SUM(sl.quantity_shipped) FROM shipment_lines sl WHERE sl.box_id=sb.id),0) AS expected_items,
                      COALESCE((SELECT COUNT(*) FROM scan_events se
                                WHERE se.matched_box_id=sb.id AND se.scan_type='product' AND se.result='accepted'
                                AND NOT EXISTS (SELECT 1 FROM scan_corrections sc WHERE sc.scan_event_id=se.id)),0) AS verified_items
               FROM shipment_boxes sb
               JOIN shipments s ON s.id=sb.shipment_id
               WHERE sb.id IN (
                   SELECT DISTINCT matched_box_id FROM scan_events
                   WHERE session_id=? AND matched_box_id IS NOT NULL
               )
               ORDER BY s.delivery_number, sb.box_code''',
            (session_id,),
        ).fetchall()
        boxes = []
        for row in box_rows:
            item = dict(row)
            item['complete'] = item['verified_items'] >= item['expected_items'] and item['expected_items'] > 0
            boxes.append(item)

        shipments: dict[str, dict[str, int]] = {}
        for box in boxes:
            delivery = box['delivery_number']
            shipments.setdefault(delivery, {'boxes_touched': 0, 'boxes_complete': 0, 'verified_items': 0, 'expected_items_in_touched_boxes': 0})
            shipments[delivery]['boxes_touched'] += 1
            shipments[delivery]['boxes_complete'] += 1 if box['complete'] else 0
            shipments[delivery]['verified_items'] += box['verified_items']
            shipments[delivery]['expected_items_in_touched_boxes'] += box['expected_items']

        return {
            'session_id': session_id,
            'opened_at': session['opened_at'],
            'closed_at': session['closed_at'],
            'verified_items': verified,
            'corrections': corrections,
            'exceptions': exceptions,
            'boxes_touched': len(boxes),
            'boxes_complete': sum(1 for box in boxes if box['complete']),
            'shipments': [{'delivery_number': key, **value} for key, value in shipments.items()],
            'boxes': boxes,
        }

@app.post('/api/receiving-sessions/{session_id}/close')
def close_receiving_session(session_id: int):
    with connect() as conn:
        cur = conn.execute(
            'UPDATE receiving_sessions SET closed_at=CURRENT_TIMESTAMP, active_box_id=NULL WHERE id=? AND closed_at IS NULL',
            (session_id,),
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail='Open receiving session not found')
        conn.commit()
        return {'closed': True, 'id': session_id}

class ScanRequest(BaseModel):
    value: str
    session_id: int | None = None

class CorrectionRequest(BaseModel):
    reason: str
    corrected_by: str | None = None

def _require_open_session(conn, session_id: int | None):
    if session_id is None:
        return None
    session = conn.execute('SELECT * FROM receiving_sessions WHERE id=? AND closed_at IS NULL', (session_id,)).fetchone()
    if not session:
        raise HTTPException(status_code=409, detail='Receiving session is missing or closed')
    return session

def _log_scan(conn, **values: Any):
    cur = conn.execute(
        '''INSERT INTO scan_events(session_id, scan_type, raw_value, matched_order_id, matched_order_line_id, matched_box_id, matched_shipment_line_id, result)
           VALUES (?,?,?,?,?,?,?,?)''',
        (
            values.get('session_id'), values['scan_type'], values['raw_value'], values.get('matched_order_id'),
            values.get('matched_order_line_id'), values.get('matched_box_id'), values.get('matched_shipment_line_id'), values['result'],
        ),
    )
    return cur.lastrowid

@app.post('/api/scan-events/{scan_event_id}/correct')
def correct_scan(scan_event_id: int, body: CorrectionRequest):
    reason = body.reason.strip()
    if len(reason) < 3:
        raise HTTPException(status_code=400, detail='A correction reason is required')
    with connect() as conn:
        event = conn.execute('SELECT * FROM scan_events WHERE id=?', (scan_event_id,)).fetchone()
        if not event:
            raise HTTPException(status_code=404, detail='Scan event not found')
        if event['scan_type'] != 'product' or event['result'] != 'accepted':
            raise HTTPException(status_code=409, detail='Only accepted garment scans can be corrected')
        if conn.execute('SELECT 1 FROM scan_corrections WHERE scan_event_id=?', (scan_event_id,)).fetchone():
            raise HTTPException(status_code=409, detail='This scan has already been corrected')
        conn.execute(
            'INSERT INTO scan_corrections(scan_event_id, session_id, reason, corrected_by) VALUES (?,?,?,?)',
            (scan_event_id, event['session_id'], reason, body.corrected_by),
        )
        conn.commit()
        return {'corrected': True, 'scan_event_id': scan_event_id, 'reason': reason}

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
                '''UPDATE shipment_boxes
                   SET first_received_at=COALESCE(first_received_at, CURRENT_TIMESTAMP),
                       last_received_at=CURRENT_TIMESTAMP,
                       barcode_value=COALESCE(barcode_value, ?)
                   WHERE id=?''',
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
            'SELECT ol.id FROM order_lines ol JOIN orders o ON o.id=ol.order_id WHERE ol.barcode=?',
            (raw,),
        ).fetchall()
        if matches:
            _log_scan(conn, session_id=req.session_id, scan_type='product', raw_value=raw, result='needs_box')
            conn.commit()
            return {
                'kind': 'product', 'matched': True, 'needs_box': True,
                'message': 'Scan the Macron box barcode first so this garment can be allocated safely.',
            }
        _log_scan(conn, session_id=req.session_id, scan_type='unknown', raw_value=raw, result='unmatched')
        conn.commit()
        return {'kind': 'unknown', 'matched': False, 'value': raw}

def _allocate_product_in_active_box(conn, session_id: int, box_id: int, barcode: str):
    rows = conn.execute(
        '''SELECT sl.id AS shipment_line_id, sl.quantity_shipped, sl.product_code, sl.size, sl.description, sl.macron_order_id,
                  o.id AS order_id, o.reference_note, ol.id AS order_line_id, ol.barcode, ol.name,
                  (SELECT COUNT(*) FROM scan_events se
                   WHERE se.matched_shipment_line_id=sl.id AND se.result='accepted'
                   AND NOT EXISTS (SELECT 1 FROM scan_corrections sc WHERE sc.scan_event_id=se.id)) AS already_scanned
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
        event_id = _log_scan(conn, session_id=session_id, scan_type='product', raw_value=barcode, matched_box_id=box_id, result=result)
        return {
            'kind': 'product', 'matched': False, 'reason': result, 'scan_event_id': event_id,
            'message': 'This item has already reached the quantity Macron says is in this box.' if result == 'over_scan' else 'This barcode is not expected in the active Macron box.',
        }
    if len(available) > 1:
        event_id = _log_scan(conn, session_id=session_id, scan_type='product', raw_value=barcode, matched_box_id=box_id, result='ambiguous')
        return {
            'kind': 'product', 'matched': False, 'reason': 'ambiguous', 'scan_event_id': event_id,
            'message': 'More than one valid allocation remains. The system has refused to guess.',
        }
    chosen = available[0]
    new_count = chosen['already_scanned'] + 1
    event_id = _log_scan(
        conn, session_id=session_id, scan_type='product', raw_value=barcode,
        matched_order_id=chosen['order_id'], matched_order_line_id=chosen['order_line_id'], matched_box_id=box_id,
        matched_shipment_line_id=chosen['shipment_line_id'], result='accepted',
    )
    return {
        'kind': 'product', 'matched': True, 'accepted': True, 'scan_event_id': event_id,
        'order_id': chosen['order_id'], 'macron_order_id': chosen['macron_order_id'], 'reference_note': chosen['reference_note'],
        'product_code': chosen['product_code'], 'name': chosen['name'] or chosen['description'], 'size': chosen['size'], 'box_id': box_id,
        'line_progress': {'scanned': new_count, 'expected_in_box': chosen['quantity_shipped']},
    }

@app.get('/api/dashboard')
def dashboard():
    with connect() as conn:
        counts = {
            'orders': conn.execute('SELECT COUNT(*) c FROM orders').fetchone()['c'],
            'order_lines': conn.execute('SELECT COUNT(*) c FROM order_lines').fetchone()['c'],
            'shipments': conn.execute('SELECT COUNT(*) c FROM shipments').fetchone()['c'],
            'boxes': conn.execute('SELECT COUNT(*) c FROM shipment_boxes').fetchone()['c'],
            'received_boxes': conn.execute('SELECT COUNT(*) c FROM shipment_boxes WHERE first_received_at IS NOT NULL').fetchone()['c'],
            'verified_items': conn.execute(
                '''SELECT COUNT(*) c FROM scan_events se WHERE se.scan_type='product' AND se.result='accepted'
                   AND NOT EXISTS (SELECT 1 FROM scan_corrections sc WHERE sc.scan_event_id=se.id)'''
            ).fetchone()['c'],
            'corrections': conn.execute('SELECT COUNT(*) c FROM scan_corrections').fetchone()['c'],
        }
        recent = [dict(r) for r in conn.execute(
            '''SELECT se.*, sc.reason AS correction_reason, sc.corrected_by
               FROM scan_events se LEFT JOIN scan_corrections sc ON sc.scan_event_id=se.id
               ORDER BY se.id DESC LIMIT 10'''
        ).fetchall()]
    return {**counts, 'recent_scans': recent}
