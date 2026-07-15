# Export System

## Overview

`src/server/reporting/export-service.ts` converts a generated report's `ReportPayload` (`columns` +
`rows`) into a downloadable format. CSV and JSON are fully implemented; PDF and Excel are
architecture-only in this foundation - this platform has no PDF/spreadsheet-generation dependency
installed today, and adding one is an explicit, documented scope decision rather than a silent gap.

## Implemented formats

### CSV

`toCsv(payload)` writes the report's own declared `columns` as the header row, then one row per data
row, quoting any value containing a comma, quote, or newline (doubling embedded quotes per the standard
CSV escaping rule). Returned with `Content-Type: text/csv` and `Content-Disposition: attachment`.

### JSON

The full `ReportPayload` (plus the report's title) is serialized with `JSON.stringify(..., null, 2)`.
Returned with `Content-Type: application/json` and `Content-Disposition: attachment`.

## Architecture-only formats

### Excel

`ReportPayload.columns`/`rows` are already shaped for a tabular writer - a real implementation would add
a spreadsheet-generation dependency (e.g. `exceljs`) and replace the `EXCEL` branch in
`generateExport()` with a call into it, producing a genuine `.xlsx` workbook. Requesting `EXCEL` today
returns `{ implemented: false, format: "EXCEL", architectureNote }` describing exactly this seam - the
API never pretends to produce a real spreadsheet it can't.

### PDF

The documented rendering path is: use each report's print-friendly view as the source
(`ReportViewer`'s existing summary + table markup, laid out with print CSS), then wire in a
headless-browser or PDF-generation library to rasterize that view into a real `.pdf` file. Requesting
`PDF` today returns `{ implemented: false, format: "PDF", architectureNote }` with the same honesty.

## Why this split

The mission for this platform explicitly separated "CSV, JSON" from "PDF architecture, Excel
architecture" - the wording itself distinguishes formats that should be genuinely functional from formats
where only the integration seam is in scope for this foundation release. Exposing `EXCEL`/`PDF` through
the same API and UI as `CSV`/`JSON` (rather than hiding them) keeps the seam discoverable and the
contract honest: a `200` response with `implemented: false` is never mistaken for a corrupt or empty
file, unlike a route that silently returned an empty download.

## Security

Every export is scoped to the requesting organization (a report can only be exported by a user with
`reporting:execute` in the report's own organization - the same `requireActiveOrganization` +
`requirePermission` gate as every other reporting endpoint) and audited via `REPORT_EXPORTED` in the
shared `AuditLog`, recording the requested format.
