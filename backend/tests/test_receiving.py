from pathlib import Path

from app import database
from app.importers import box_code_from_linear_barcode, product_code_matches_barcode
from app.main import CorrectionRequest, ScanRequest, correct_scan, receiving_session_summary, scan


def _seed(tmp_path: Path):
    database.DB_PATH = tmp_path / 'test.db'
    database.init_db()
    with database.connect() as conn:
        conn.execute("INSERT INTO orders(macron_order_id, reference_note) VALUES ('1269746', 'THREE BRIDGES - U11')")
        order_id = conn.execute("SELECT id FROM orders WHERE macron_order_id='1269746'").fetchone()['id']
        conn.execute(
            "INSERT INTO order_lines(order_id, sku, size, barcode, name, quantity_expected) VALUES (?,?,?,?,?,?)",
            (order_id, '80000456', 'XS', '80000456090005', 'GALAX SHORT', 1),
        )
        conn.execute(
            "INSERT INTO order_lines(order_id, sku, size, barcode, name, quantity_expected) VALUES (?,?,?,?,?,?)",
            (order_id, '80000454', '3XL', '80000454090011', 'VOID SHIRT SS', 1),
        )
        shipment_id = conn.execute(
            "INSERT INTO shipments(delivery_number, total_pieces, total_boxes) VALUES ('TEST001',1,1)"
        ).lastrowid
        box_id = conn.execute(
            "INSERT INTO shipment_boxes(shipment_id, box_code) VALUES (?,?)",
            (shipment_id, 'ND0103525414 DC1'),
        ).lastrowid
        conn.execute(
            "INSERT INTO shipment_lines(shipment_id, box_id, macron_order_id, product_code, description, size, quantity_shipped) VALUES (?,?,?,?,?,?,?)",
            (shipment_id, box_id, '1269746', '800004560900', 'GALAX SHORT BLK/NS', 'XS', 1),
        )
        session_id = conn.execute("INSERT INTO receiving_sessions(opened_by) VALUES ('test')").lastrowid
        conn.commit()
    return session_id


def test_observed_macron_galax_barcode_shape():
    assert product_code_matches_barcode('800004560900', '80000456090005')
    assert box_code_from_linear_barcode('999990000003525414') == 'ND0103525414'


def test_active_box_allocates_real_sample_and_blocks_duplicate(tmp_path):
    session_id = _seed(tmp_path)

    box = scan(ScanRequest(value='999990000003525414', session_id=session_id))
    assert box['matched'] is True
    assert box['box_code'] == 'ND0103525414 DC1'

    accepted = scan(ScanRequest(value='80000456090005', session_id=session_id))
    assert accepted['accepted'] is True
    assert accepted['reference_note'] == 'THREE BRIDGES - U11'
    assert accepted['line_progress'] == {'scanned': 1, 'expected_in_box': 1}

    duplicate = scan(ScanRequest(value='80000456090005', session_id=session_id))
    assert duplicate['matched'] is False
    assert duplicate['reason'] == 'over_scan'


def test_recognised_garment_in_wrong_box_is_refused(tmp_path):
    session_id = _seed(tmp_path)
    scan(ScanRequest(value='999990000003525414', session_id=session_id))

    wrong = scan(ScanRequest(value='80000454090011', session_id=session_id))
    assert wrong['matched'] is False
    assert wrong['reason'] == 'wrong_box'


def test_corrected_scan_reopens_quantity_and_keeps_audit(tmp_path):
    session_id = _seed(tmp_path)
    scan(ScanRequest(value='999990000003525414', session_id=session_id))
    accepted = scan(ScanRequest(value='80000456090005', session_id=session_id))

    correction = correct_scan(
        accepted['scan_event_id'],
        CorrectionRequest(reason='Garment was scanned twice while moving piles', corrected_by='Supervisor'),
    )
    assert correction['corrected'] is True

    rescanned = scan(ScanRequest(value='80000456090005', session_id=session_id))
    assert rescanned['accepted'] is True
    assert rescanned['line_progress'] == {'scanned': 1, 'expected_in_box': 1}

    with database.connect() as conn:
        audit = conn.execute('SELECT * FROM scan_corrections WHERE scan_event_id=?', (accepted['scan_event_id'],)).fetchone()
        assert audit['corrected_by'] == 'Supervisor'
        assert 'scanned twice' in audit['reason']


def test_session_summary_reports_box_completion(tmp_path):
    session_id = _seed(tmp_path)
    scan(ScanRequest(value='999990000003525414', session_id=session_id))
    before = receiving_session_summary(session_id)
    assert before['boxes_touched'] == 1
    assert before['boxes_complete'] == 0
    assert before['verified_items'] == 0

    scan(ScanRequest(value='80000456090005', session_id=session_id))
    after = receiving_session_summary(session_id)
    assert after['verified_items'] == 1
    assert after['boxes_complete'] == 1
    assert after['shipments'][0]['delivery_number'] == 'TEST001'
