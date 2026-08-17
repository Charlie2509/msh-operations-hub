from pathlib import Path

from app import database
from app.importers import box_code_from_linear_barcode, product_code_matches_barcode
from app.main import ScanRequest, scan


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
