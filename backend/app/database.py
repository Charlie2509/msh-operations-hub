import os
import sqlite3
from pathlib import Path

DEFAULT_DB_PATH = Path(__file__).resolve().parents[1] / 'msh_ops.db'
DB_PATH = Path(os.getenv('MSH_DB_PATH', DEFAULT_DB_PATH))

SCHEMA = '''
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    macron_order_id TEXT NOT NULL UNIQUE,
    reference_note TEXT,
    order_date TEXT,
    source_file TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sku TEXT,
    size TEXT,
    barcode TEXT NOT NULL,
    name TEXT,
    quantity_expected INTEGER NOT NULL DEFAULT 0,
    availability_date TEXT,
    UNIQUE(order_id, barcode)
);

CREATE TABLE IF NOT EXISTS shipments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    delivery_number TEXT UNIQUE,
    source_url TEXT,
    shipping_date TEXT,
    carrier TEXT,
    total_pieces INTEGER,
    total_boxes INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shipment_boxes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id INTEGER NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    box_code TEXT NOT NULL,
    barcode_value TEXT,
    first_received_at TEXT,
    last_received_at TEXT,
    UNIQUE(shipment_id, box_code)
);

CREATE TABLE IF NOT EXISTS shipment_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id INTEGER NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    box_id INTEGER REFERENCES shipment_boxes(id) ON DELETE SET NULL,
    macron_order_id TEXT,
    product_code TEXT,
    description TEXT,
    size TEXT,
    quantity_shipped INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS receiving_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    opened_by TEXT,
    active_box_id INTEGER REFERENCES shipment_boxes(id) ON DELETE SET NULL,
    opened_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TEXT
);

CREATE TABLE IF NOT EXISTS scan_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER REFERENCES receiving_sessions(id) ON DELETE SET NULL,
    scan_type TEXT NOT NULL,
    raw_value TEXT NOT NULL,
    matched_order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    matched_order_line_id INTEGER REFERENCES order_lines(id) ON DELETE SET NULL,
    matched_box_id INTEGER REFERENCES shipment_boxes(id) ON DELETE SET NULL,
    matched_shipment_line_id INTEGER REFERENCES shipment_lines(id) ON DELETE SET NULL,
    result TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_lines_barcode ON order_lines(barcode);
CREATE INDEX IF NOT EXISTS idx_shipment_lines_box ON shipment_lines(box_id);
CREATE INDEX IF NOT EXISTS idx_shipment_lines_order ON shipment_lines(macron_order_id);
CREATE INDEX IF NOT EXISTS idx_scan_events_session ON scan_events(session_id);
CREATE INDEX IF NOT EXISTS idx_scan_events_alloc ON scan_events(matched_shipment_line_id, result);
'''


def connect():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON')
    return conn


def init_db():
    with connect() as conn:
        conn.executescript(SCHEMA)
        conn.commit()
