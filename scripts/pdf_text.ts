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

/**
 * Recovers the table's column x-positions from the runs themselves.
 *
 * The template has been revised over the years — the 2017 reports place the
 * columns at 30/260/385/400/535 while later ones use 50/280/415/430/565 — so
 * the positions are derived rather than hardcoded. Every cell in the body sits
 * on exactly one of `count` x-values, which makes them the most frequent by a
 * wide margin.
 *
 * Returned ascending, which is also semantic order: label, then the light-weight
 * pair, then the heavy-weight pair.
 */
export function detectColumns(
  runs: Run[],
  size: number,
  count: number,
): number[] {
  const histogram = new Map<number, number>();
  for (const run of runs) {
    if (Math.abs(run.size - size) > 0.5) continue;
    const x = Math.round(run.x * 100) / 100;
    histogram.set(x, (histogram.get(x) ?? 0) + 1);
  }
  const top = [...histogram.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([x]) => x);
  if (top.length < count) {
    throw new Error(
      `expected ${count} columns at ${size}pt, found ${top.length} — is this an Air Turquoise report?`,
    );
  }
  return top.sort((a, b) => a - b);
}
