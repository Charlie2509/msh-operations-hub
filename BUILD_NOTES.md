# Build notes

## Real-data parser validation performed during discovery

The packing-list parser was exercised against three real Macron PDFs supplied by MSH during development. No customer PDFs or shipment data are committed to this repository.

| PDF reported pieces | Parsed quantity sum | PDF reported boxes | Parsed unique boxes |
|---:|---:|---:|---:|
| 650 | 650 | 12 | 12 |
| 501 | 501 | 14 | 14 |
| 43 | 43 | 3 | 3 |

The supplied Macron CSV also imported successfully with its expected product lines.

## Build 0.2

- Added strict packing-list reconciliation: reject imports whose parsed piece/box totals do not match the PDF totals.
- Added receiving sessions distinct from Macron shipments.
- Added active-box state per session.
- Added box-constrained product allocation using the real garment barcode from the order CSV.
- Added wrong-box and over-scan protection.
- Added accepted-scan quantity progress for each shipment line.
- Removed database/runtime artifacts from source control and added environment configuration.
