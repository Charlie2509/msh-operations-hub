import csv
import io
import re

ORDER_ID_RE = re.compile(r'^(?:0+)?(\d+)$')


def normalise_order_id(value: str | int | None) -> str:
    if value is None:
        return ''
    s = str(value).strip()
    m = ORDER_ID_RE.match(s)
    if m:
        return m.group(1)
    return s


def import_order_csv(conn, content: bytes, filename: str) -> dict:
    text = content.decode('utf-8-sig')
    sample = text[:4096]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=';,\t,')
        reader = csv.DictReader(io.StringIO(text), dialect=dialect)
    except csv.Error:
        reader = csv.DictReader(io.StringIO(text), delimiter=';')
    required = {'sku','size','barcode','name','quantity','order_id','order_date','reference_note','availability_date'}
    missing = required - set(reader.fieldnames or [])
    if missing:
        raise ValueError(f'Missing CSV columns: {sorted(missing)}')

    order_count = 0
    line_count = 0
    order_ids_seen = set()

    for row in reader:
        macron_order_id = normalise_order_id(row['order_id'])
        if not macron_order_id:
            continue
        if macron_order_id not in order_ids_seen:
            conn.execute(
                '''INSERT INTO orders(macron_order_id, reference_note, order_date, source_file)
                   VALUES (?, ?, ?, ?)
                   ON CONFLICT(macron_order_id) DO UPDATE SET
                     reference_note=excluded.reference_note,
                     order_date=excluded.order_date,
                     source_file=excluded.source_file''',
                (macron_order_id, row.get('reference_note','').strip(), row.get('order_date','').strip(), filename)
            )
            order_ids_seen.add(macron_order_id)
            order_count += 1

        order_row = conn.execute('SELECT id FROM orders WHERE macron_order_id=?', (macron_order_id,)).fetchone()
        qty = int(float(row.get('quantity') or 0))
        barcode = str(row.get('barcode') or '').strip()
        conn.execute(
            '''INSERT INTO order_lines(order_id, sku, size, barcode, name, quantity_expected, availability_date)
               VALUES (?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(order_id, barcode) DO UPDATE SET
                 sku=excluded.sku,
                 size=excluded.size,
                 name=excluded.name,
                 quantity_expected=excluded.quantity_expected,
                 availability_date=excluded.availability_date''',
            (order_row['id'], row.get('sku','').strip(), row.get('size','').strip(), barcode,
             row.get('name','').strip(), qty, row.get('availability_date','').strip())
        )
        line_count += 1

    conn.commit()
    return {'orders_processed': order_count, 'lines_processed': line_count}


def box_code_from_linear_barcode(value: str) -> str | None:
    """Observed Macron box barcode example: 999990000003391862 -> ND0103391862."""
    value = value.strip()
    if re.fullmatch(r'99999\d{13}', value):
        tail = value[-7:]
        return f'ND010{tail}'
    return None


def is_datadea_pdf_url(value: str) -> bool:
    v = value.strip().lower()
    return v.startswith('https://cloud.datadea.it/') and v.endswith('.pdf')


def product_code_matches_barcode(product_code: str | None, barcode: str | None) -> bool:
    """Conservative matching for observed newer and legacy Macron barcode formats."""
    if not product_code or not barcode:
        return False
    p = re.sub(r'\D', '', product_code).lstrip('0')
    b = re.sub(r'\D', '', barcode).lstrip('0')
    if not p or not b:
        return False
    if b.startswith(p):
        return True
    return 6 <= len(p) <= 8 and len(b) >= 6 and p[:6] == b[:6]
