import { getDocument } from "npm:pdfjs-dist@4.0.379/legacy/build/pdf.mjs";

/** A single positioned text run from the PDF's text layer. */
export interface Run {
  page: number;
  x: number;
  y: number;
  /** Font size in text space; the table body is 8pt, the header block 10pt. */
  size: number;
  bold: boolean;
  text: string;
}

/**
 * Extracts every non-empty text run with its absolute position.
 *
 * The Air Turquoise reports are machine-generated with one `Td`/`Tj` per line
 * fragment, so runs map one-to-one onto table cells (a wrapped cell yields one
 * run per visual line, all sharing the cell's x).
 *
 * `getOperatorList()` has to run before `getTextContent()`: it is what resolves
 * `page.commonObjs`, and without it the real font names (`Arial-BoldMT` vs
 * `ArialMT`) are unavailable and bold headings cannot be told apart from data.
 */
export async function extractRuns(data: Uint8Array): Promise<Run[]> {
  const doc = await getDocument({ data, useSystemFonts: false }).promise;
  const runs: Run[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    await page.getOperatorList();
    const content = await page.getTextContent();

    const boldCache = new Map<string, boolean>();
    const isBold = (fontName: string): boolean => {
      let cached = boldCache.get(fontName);
      if (cached === undefined) {
        let name = "";
        try {
          name = (page.commonObjs.get(fontName) as { name?: string })?.name ??
            "";
        } catch {
          name = "";
        }
        cached = /bold/i.test(name);
        boldCache.set(fontName, cached);
      }
      return cached;
    };

    type TextItem = {
      str: string;
      height: number;
      fontName: string;
      transform: number[];
    };
    for (const item of content.items) {
      const it = item as unknown as TextItem;
      const text = it.str.trim();
      if (!text) continue;
      runs.push({
        page: p,
        x: it.transform[4],
        y: it.transform[5],
        size: it.height,
        bold: isBold(it.fontName),
        text,
      });
    }
  }

  await doc.destroy();
  return runs;
}

/** An x-range covering one table column, including its per-page jitter. */
export interface ColumnRange {
  min: number;
  max: number;
  count: number;
}

/**
 * Recovers the table's column positions from the runs themselves.
 *
 * The template has been revised repeatedly and the columns move every time —
 * the 2017 reports use 30/260/385/400/535, the 2020s ones 50/280/415/430/565,
 * and the 2025 rewrite 50/252/402/418/568 with the exact offsets drifting by a
 * few points from page to page. Rather than hardcode any of that, cluster the
 * observed x-values: cells within a column land within a point or two of each
 * other while the columns themselves are tens of points apart, so a gap-based
 * split separates them cleanly on any revision.
 *
 * Returned ascending, which is also semantic order: label, then the
 * light-weight comment/grade pair, then the heavy-weight pair.
 */
export function detectColumns(runs: Run[], count: number): ColumnRange[] {
  const histogram = new Map<number, number>();
  for (const run of runs) {
    const x = Math.round(run.x * 100) / 100;
    histogram.set(x, (histogram.get(x) ?? 0) + 1);
  }

  const clusters: ColumnRange[] = [];
  for (const x of [...histogram.keys()].sort((a, b) => a - b)) {
    const last = clusters.at(-1);
    const n = histogram.get(x)!;
    // 8pt: wider than the jitter within a column, narrower than the ~12pt
    // that separates the tightest pair of columns (grade and comment).
    if (last && x - last.max <= 8) {
      last.max = x;
      last.count += n;
    } else {
      clusters.push({ min: x, max: x, count: n });
    }
  }

  const columns = clusters
    .sort((a, b) => b.count - a.count)
    .slice(0, count)
    .sort((a, b) => a.min - b.min);
  if (columns.length < count) {
    throw new Error(
      `expected ${count} columns, found ${columns.length} — is this an Air Turquoise report?`,
    );
  }
  return columns;
}

/** Index of the column a run sits in, or -1 if it belongs to none of them. */
export function columnOf(columns: ColumnRange[], run: Run): number {
  return columns.findIndex((c) => run.x >= c.min - 1 && run.x <= c.max + 1);
}
