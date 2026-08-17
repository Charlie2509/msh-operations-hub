import io
import re
from dataclasses import dataclass
import pdfplumber

DELIVERY_RE = re.compile(r'Delivery\s+(\d+)')
TOTAL_PIECES_RE = re.compile(r'^Total Pieces\s+(\d+)\s*$', re.I | re.M)
TOTAL_BOXES_RE = re.compile(r'^Boxes\s+(\d+)\b', re.I | re.M)
BOX_PREFIX_RE = re.compile(r'^(ND\d+\s+DC\d)\s+(.*)$')
ORDER_TOKEN_RE = re.compile(r'^\d{10}$')
PRODUCT_CODE_RE = re.compile(r'^[A-Z0-9-]{6,}$')

@dataclass
class ParsedShipment:
    delivery_number: str | None
    total_pieces: int | None
    total_boxes: int | None
    lines: list[dict]


def extract_text(pdf_bytes: bytes) -> str:
    pages = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            pages.append(page.extract_text(x_tolerance=2, y_tolerance=3) or '')
    return '\n'.join(pages)


def _normalise_order_id(value: str) -> str:
    return value.lstrip('0') or '0'


def _parse_packing_line(line: str, current_box: str | None):
    m = BOX_PREFIX_RE.match(line)
    if m:
        current_box = m.group(1)
        line = m.group(2)
    if not current_box:
        return current_box, None

    tokens = line.split()
    if len(tokens) < 5 or not PRODUCT_CODE_RE.match(tokens[0]):
        return current_box, None

    order_idx = None
    for i in range(len(tokens) - 2, 0, -1):
        if ORDER_TOKEN_RE.match(tokens[i]):
            order_idx = i
            break
    if order_idx is None or order_idx + 1 >= len(tokens):
        return current_box, None

    try:
        qty = int(tokens[order_idx + 1])
    except ValueError:
        return current_box, None

    size = tokens[order_idx - 1]
    desc_end = order_idx - 1
    if order_idx - 2 >= 1 and tokens[order_idx - 2] == size:
        desc_end = order_idx - 2
    description = ' '.join(tokens[1:desc_end])
    if not description:
        return current_box, None

    return current_box, {
        'box_code': current_box,
        'product_code': tokens[0],
        'description': description,
        'size': size,
        'macron_order_id': _normalise_order_id(tokens[order_idx]),
        'quantity': qty,
    }


def parse_packing_list(pdf_bytes: bytes) -> ParsedShipment:
    text = extract_text(pdf_bytes)
    delivery = DELIVERY_RE.search(text)
    pieces_m = TOTAL_PIECES_RE.search(text)
    boxes_m = TOTAL_BOXES_RE.search(text)

    lines = []
    current_box = None
    in_packing = False
    for raw in text.splitlines():
        line = ' '.join(raw.split())
        if line == 'PACKING LIST':
            in_packing = True
            continue
        if in_packing and ('ITEM RECAP' in line or 'ORDER RECAP' in line):
            in_packing = False
        if not in_packing or not line or line.startswith('Box Code Description'):
            continue
        current_box, parsed = _parse_packing_line(line, current_box)
        if parsed:
            lines.append(parsed)

    parsed = ParsedShipment(
        delivery_number=delivery.group(1) if delivery else None,
        total_pieces=int(pieces_m.group(1)) if pieces_m else None,
        total_boxes=int(boxes_m.group(1)) if boxes_m else None,
        lines=lines,
    )
    validate_packing_list(parsed)
    return parsed


def validate_packing_list(parsed: ParsedShipment) -> None:
    if not parsed.delivery_number:
        raise ValueError('Packing list delivery number could not be identified')
    if not parsed.lines:
        raise ValueError('Packing list contained no parseable product lines')

    parsed_piece_count = sum(row['quantity'] for row in parsed.lines)
    parsed_box_count = len({row['box_code'] for row in parsed.lines})

    if parsed.total_pieces is not None and parsed_piece_count != parsed.total_pieces:
        raise ValueError(
            f'Packing list rejected: PDF says {parsed.total_pieces} pieces but parser found {parsed_piece_count}'
        )
    if parsed.total_boxes is not None and parsed_box_count != parsed.total_boxes:
        raise ValueError(
            f'Packing list rejected: PDF says {parsed.total_boxes} boxes but parser found {parsed_box_count}'
        )
