import {
  columnOf,
  type ColumnRange,
  detectColumns,
  type Run,
} from "./pdf_text.ts";
import type { CategoryKey } from "../categories.ts";
import type { TestResult } from "../components/Test.tsx";

export interface Wing {
  [key: string]: unknown;
  classification: string;
  folding_lines_used: string;
  glider_model: string;
}

export interface Category {
  result: string;
  tests: TestResult[];
}

/**
 * A cell that wraps onto a second visual line sits 8.848pt below its own first
 * line on every template revision seen so far, while the tightest gap between
 * two different rows is 12.848pt. Anything above the midpoint starts a new row.
 */
const WRAP_GAP = 10.5;

/**
 * How far above its row's label a cell may sit. The 2025 template centres a
 * row's text vertically against its label rather than sharing a baseline, so
 * the first line of a comment can start ~1.7pt higher than the label itself.
 */
const ROW_TOP_SLACK = 3;

/** Category headings and their grade are likewise not quite on one baseline. */
const HEADING_SLACK = 3;

/** Excludes the page footer, which is the only small text outside the table. */
const FOOTER_TOP = 35;
/** Excludes the cover-page header block (10pt) and the title (14pt). */
const MAX_TABLE_SIZE = 9;

/** Present in the PDF for c10/c14 but deliberately absent from categories.ts. */
const SKIPPED_ROW = /^folding lines used/i;
/** "24. Pilot comments" is free text and ends the graded part of the report. */
const LAST_CATEGORY = 23;
const CATEGORY_HEADING = /^(\d+)\.\s/;

const LABEL = 0;
const DATA_COLUMNS = [1, 2, 3, 4];

const clean = (text: string) => text.replace(/\s+/g, " ").trim();

const isTableRun = (run: Run) =>
  run.y > FOOTER_TOP && run.size < MAX_TABLE_SIZE;

interface Row {
  /** Top of the row: where its cells start, and what anchors them. */
  y: number;
  /** Baseline of the label's last line, for folding in further wrapped lines. */
  labelY: number;
  label: string;
  cells: string[][];
}

/**
 * Builds the table by anchoring every row on its label.
 *
 * Rows cannot be delimited by "has both grades": the `Folding lines used` rows
 * carry a label and comments but no grades, so such a rule silently glues them
 * onto the preceding `Cascade occurs` row *without* changing any per-category
 * test count — invisible to the count check. Anchoring on the label instead
 * gives those rows an identity of their own, so they can be dropped by name.
 */
function buildRows(runs: Run[], columns: ColumnRange[]): {
  categories: Record<string, Category>;
} {
  const categories: Record<string, Category> = {};
  let tests: TestResult[] | undefined;
  let done = false;

  const pages = [...new Set(runs.map((r) => r.page))].sort((a, b) => a - b);
  for (const page of pages) {
    if (done) break;
    const onPage = runs
      .filter((run) => run.page === page && isTableRun(run))
      .map((run) => ({ run, column: columnOf(columns, run) }))
      .filter((entry) => entry.column >= 0)
      .sort((a, b) => b.run.y - a.run.y || a.run.x - b.run.x);

    // Headings first: they close the current category and must never be
    // mistaken for a row label.
    const headings = new Map<number, { number: number; result: string }>();
    const subHeadings = new Set<number>();
    for (const { run, column } of onPage) {
      if (column !== LABEL || !run.bold) continue;
      const match = CATEGORY_HEADING.exec(run.text);
      if (!match) {
        subHeadings.add(run.y);
        continue;
      }
      const grade = onPage.find((e) =>
        e.column === 1 && e.run.bold &&
        Math.abs(e.run.y - run.y) <= HEADING_SLACK
      );
      if (!grade) {
        subHeadings.add(run.y);
        continue;
      }
      headings.set(run.y, {
        number: Number(match[1]),
        result: clean(grade.run.text),
      });
    }

    // Row anchors: non-bold label runs, with wrapped label lines folded in.
    const rows: Row[] = [];
    for (const { run, column } of onPage) {
      if (column !== LABEL || run.bold) continue;
      const previous = rows.at(-1);
      if (previous && previous.labelY - run.y <= WRAP_GAP) {
        previous.label += ` ${run.text}`;
        previous.labelY = run.y;
        continue;
      }
      rows.push({
        y: run.y,
        labelY: run.y,
        label: run.text,
        cells: [[], [], [], []],
      });
    }

    // Every element of the page in one top-down order, so a heading closes the
    // rows above it and opens the ones below.
    const anchors = [
      ...rows.map((row, index) => ({ y: row.y, row, index })),
    ].sort((a, b) => b.y - a.y);

    const rowFor = (y: number): Row | undefined => {
      // The lowest anchor still at or above this run — not the nearest one,
      // which would hand the third line of a wrapped cell to the row below.
      let best: Row | undefined;
      for (const anchor of anchors) {
        if (anchor.row.y >= y - ROW_TOP_SLACK) best = anchor.row;
        else break;
      }
      return best;
    };

    for (const { run, column } of onPage) {
      if (column === LABEL || run.bold) continue;
      const row = rowFor(run.y);
      if (row) row.cells[DATA_COLUMNS.indexOf(column)].push(run.text);
    }

    // Walk headings and rows together in page order.
    const events = [
      ...[...headings.entries()].map(([y, h]) => ({
        y,
        heading: h,
        row: undefined as Row | undefined,
      })),
      ...rows.map((row) => ({ y: row.y, heading: undefined, row })),
    ].sort((a, b) => b.y - a.y);

    for (const event of events) {
      if (event.heading) {
        if (event.heading.number > LAST_CATEGORY) {
          done = true;
          break;
        }
        tests = [];
        categories[`c${String(event.heading.number).padStart(2, "0")}`] = {
          result: event.heading.result,
          tests,
        };
      } else if (event.row && tests) {
        if (SKIPPED_ROW.test(clean(event.row.label))) continue;
        tests.push(
          event.row.cells.map((cell) => clean(cell.join(" "))) as TestResult,
        );
      }
    }
  }

  return { categories };
}

const HEADER_SIZE = 10;
/** Second-column header label; also the divider between the two label/value pairs. */
const DIVIDER_LABEL = "Classification";

/**
 * Reads named fields out of the cover-page header block.
 *
 * The block is a two-by-two label/value grid, but it resists the column
 * clustering used for the table: the 2025 template renders units as separate
 * runs ("Harness to risers distance", "[", "cm", "]"), which invent extra
 * columns of their own and crowd out the real ones. Since only three fields are
 * ever needed, each is instead found by name and its value read from the runs
 * to its right — bounded by the second label column, whose position is given by
 * "Classification" itself.
 */
function parseHeader(runs: Run[], names: string[]): Record<string, string> {
  const headerRuns = runs.filter(
    (run) => run.page === 1 && Math.abs(run.size - HEADER_SIZE) < 0.6,
  );

  const rows: Run[][] = [];
  for (const run of headerRuns.sort((a, b) => b.y - a.y || a.x - b.x)) {
    const last = rows.at(-1);
    if (last && Math.abs(last[0].y - run.y) <= 2) last.push(run);
    else rows.push([run]);
  }

  const divider = headerRuns.find((run) => clean(run.text) === DIVIDER_LABEL);
  if (!divider) {
    throw new Error(
      `header label ${
        JSON.stringify(DIVIDER_LABEL)
      } not found — is this an Air Turquoise report?`,
    );
  }

  const fields: Record<string, string> = {};
  for (const row of rows) {
    for (const label of row) {
      const name = clean(label.text);
      if (!names.includes(name)) continue;
      const inLeftColumn = label.x < divider.x - 1;
      const value = row
        .filter((run) =>
          run.x > label.x && (!inLeftColumn || run.x < divider.x - 1)
        )
        .sort((a, b) => a.x - b.x)
        .map((run) => run.text)
        .join(" ");
      if (clean(value)) fields[name] = clean(value);
    }
  }
  return fields;
}

function requireField(fields: Record<string, string>, name: string): string {
  const value = fields[name];
  if (!value) {
    throw new Error(
      `header field ${JSON.stringify(name)} not found (saw: ${
        Object.keys(fields).join(", ")
      })`,
    );
  }
  return value;
}

export function parseReport(runs: Run[]): Wing {
  const columns = detectColumns(runs.filter(isTableRun), 5);
  const { categories } = buildRows(runs, columns);
  const header = parseHeader(runs, [
    "Classification",
    "Folding lines used",
    "Glider model",
  ]);
  return {
    ...categories,
    classification: requireField(header, "Classification"),
    folding_lines_used: requireField(header, "Folding lines used"),
    glider_model: requireField(header, "Glider model"),
  } as Wing;
}

export type { CategoryKey };
