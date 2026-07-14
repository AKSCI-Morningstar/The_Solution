# Parser Framework

## The `Parser` Interface

```ts
interface Parser {
  readonly name: string;
  readonly version: string;
  readonly supportedExtensions: readonly string[];
  readonly supportedMimeTypes: readonly string[];
  canParse(file: { extension: string; mimeType: string }): boolean;
  parse(buffer: Buffer, context: ParseContext): Promise<ParsedDocument>;
}
```

`ParsedDocument` is the common shape every parser produces, regardless of input format:

```ts
interface ParsedDocument {
  fullText: string;
  pages: { pageNumber: number; text: string }[];
  sections: { title: string; level: number; startOffset: number; page: number | null }[];
  tables: { page: number | null; headers: string[]; rows: string[][] }[];
  metadata: Record<string, unknown>;
}
```

Parsers that can determine structure directly (CSV → tables, Markdown → `#` headings) populate `sections`/`tables` themselves; downstream pipeline stages (`section-detection`, `table-detection`) only run their own heuristics when a parser left those arrays empty.

## Built-in Parsers

| Parser            | Formats                         | Notes                                                                                                         |
| ----------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `txt-parser`      | `.txt`                          | Single page, no sections/tables (left to later stages).                                                       |
| `markdown-parser` | `.md`, `.markdown`              | Extracts `#`-`######` headings as sections directly.                                                          |
| `csv-parser`      | `.csv`                          | Hand-written parser respecting quoted fields with embedded commas/newlines; the whole file becomes one table. |
| `docx-parser`     | `.docx`                         | Via `mammoth` (raw text extraction; no HTML/styling retained).                                                |
| `pdf-parser`      | `.pdf`                          | Via `pdf-parse` v2's `PDFParse` class - real per-page text plus document `Info` metadata.                     |
| `image-parser`    | `.png`, `.jpg`, `.jpeg`, `.gif` | **Metadata only** (detected format, size) - no OCR, no pixel dimensions, per the mission's explicit scope.    |

## Registry, Health, and Fallback

`parser-registry.ts` is a hot-reload-safe module singleton (same pattern as the Prisma client global) that:

1. **Resolves** a parser by extension/mimetype (`resolve()`), first match wins.
2. **Tracks health** per parser: `totalRuns`, `totalFailures`, `consecutiveFailures`, `lastSuccessAt`, `lastErrorAt` - exposed via `GET /api/ingestion/parsers` and rendered on the pipeline dashboard.
3. **Falls back** to a generic plain-text parser (`generic-text-fallback-parser.ts`) _only_ for text-representable formats (`txt`, `md`, `markdown`, `csv`) when the specialized parser throws. Binary formats (`docx`, `pdf`, images) never fall back - a parse failure there fails the job with a clear error instead of silently returning garbage extracted from raw bytes.

## Adding a New Parser (e.g. a future CAD/PLM/ERP integration)

1. Implement the `Parser` interface in a new file under `parsers/`.
2. Call `parserRegistry.register(yourParser)` once (in `parser-registry.ts`, or from a future plugin-loading mechanism).
3. Add the format's extension(s) to `SUPPORTED_EXTENSIONS` in `constants.ts` if it should pass file validation.

No other pipeline code changes - the orchestrator, stages 5 onward, and the API/UI are all format-agnostic once `structural-parsing` hands them a `ParsedDocument`. This is the extension point the mission's "Future CAD / Future PLM / Future ERP / Future APIs" scope refers to; none of those are implemented in this milestone since there is nothing concrete yet to parse against.
