import { detectColumns, type Run } from "./pdf_text.ts";
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
 * Vertical geometry of the report, constant across every template revision:
 * consecutive table rows are 12.848pt apart, while a cell that wraps onto a
 * second visual line sits 8.848pt below its own first line. Anything at or
 * above the midpoint starts a new row.
 *
 * This gap — not the presence of a grade — is what delimits rows. The
 * "Folding lines used" rows carry a label and comments but no grades, so a
 * grade-based rule silently glues them onto the preceding "Cascade occurs" row
 * (yielding "No No") *without* changing any per-category test count, which
 * makes the corruption invisible to the count check.
 */
const ROW_PITCH = 12.848;
const WRAP_LEADING = 8.848;
const NEW_ROW_GAP = (ROW_PITCH + WRAP_LEADING) / 2;

const BODY_SIZE = 8;
const HEADER_SIZE = 10;
const COLUMN_TOLERANCE = 1;

/** Present in the PDF for c10/c14 but deliberately absent from categories.ts. */
const SKIPPED_ROW = /^folding lines used/i;
/** "24. Pilot comments" is free text and ends the graded part of the report. */
const LAST_CATEGORY = 23;
const CATEGORY_HEADING = /^(\d+)\.\s/;

type Column =
  | "label"
  | "lightComment"
  | "lightGrade"
  | "heavyComment"
  | "heavyGrade";
const COLUMN_ORDER: Column[] = [
  "label",
  "lightComment",
  "lightGrade",
  "heavyComment",
  "heavyGrade",
];

interface Line {
  page: number;
  y: number;
  cells: Partial<Record<Column, { bold: boolean; text: string }>>;
}

/** Groups runs into visual lines, ordered top-down. */
function toLines(runs: Run[], columns: number[]): Line[] {
  const snap = (x: number): Column | undefined => {
    for (let i = 0; i < columns.length; i++) {
      if (Math.abs(x - columns[i]) < COLUMN_TOLERANCE) return COLUMN_ORDER[i];
    }
    return undefined;
  };

  // Runs sharing a y are *not* contiguous in the content stream — a wrapped
  // continuation at a lower y is emitted between them — so lines are keyed by
  // (page, y) across the whole page rather than compared against the last run.
  const byKey = new Map<string, Line>();
  for (const run of runs) {
    if (Math.abs(run.size - BODY_SIZE) > 0.5) continue;
    const column = snap(run.x);
    if (!column) continue;
    const key = `${run.page}:${run.y.toFixed(2)}`;
    let line = byKey.get(key);
    if (!line) {
      line = { page: run.page, y: run.y, cells: {} };
      byKey.set(key, line);
    }
    const cell = line.cells[column];
    line.cells[column] = {
      bold: cell?.bold ?? run.bold,
      text: cell ? `${cell.text} ${run.text}` : run.text,
    };
  }

  return [...byKey.values()].sort((a, b) => a.page - b.page || b.y - a.y);
}

const clean = (text: string) => text.replace(/\s+/g, " ").trim();

/** Reads the two label/value column pairs of the cover-page header block. */
function parseHeader(runs: Run[]): Record<string, string> {
  const columns = detectColumns(runs, HEADER_SIZE, 4);
  const byY = new Map<number, Map<number, string>>();
  for (const run of runs) {
    if (run.page !== 1) continue;
    if (Math.abs(run.size - HEADER_SIZE) > 0.5) continue;
    const index = columns.findIndex((c) =>
      Math.abs(run.x - c) < COLUMN_TOLERANCE
    );
    if (index < 0) continue;
    const row = byY.get(run.y) ?? new Map<number, string>();
    const existing = row.get(index);
    row.set(index, existing ? `${existing} ${run.text}` : run.text);
    byY.set(run.y, row);
  }

  const fields: Record<string, string> = {};
  for (const row of byY.values()) {
    for (const [labelIndex, valueIndex] of [[0, 1], [2, 3]]) {
      const label = row.get(labelIndex);
      const value = row.get(valueIndex);
      if (label && value) fields[clean(label)] = clean(value);
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
  const columns = detectColumns(runs, BODY_SIZE, 5);
  const lines = toLines(runs, columns);

  const categories: Record<string, Category> = {};
  let tests: TestResult[] = [];
  let labels: string[] = [];
  let open: { label: string; cells: string[] } | undefined;
  let previous: Line | undefined;

  const closeRow = () => {
    if (!open) return;
    const label = clean(open.label);
    if (!SKIPPED_ROW.test(label)) {
      tests.push(open.cells.map(clean) as TestResult);
      labels.push(label);
    }
    open = undefined;
  };

  for (const line of lines) {
    const { cells } = line;
    const label = cells.label;
    const heading = label?.bold ? CATEGORY_HEADING.exec(label.text) : null;

    if (heading && cells.lightComment?.bold) {
      closeRow();
      const number = Number(heading[1]);
      if (number > LAST_CATEGORY) break;
      tests = [];
      labels = [];
      categories[`c${String(number).padStart(2, "0")}`] = {
        result: clean(cells.lightComment.text),
        tests,
      };
    } else if (label?.bold) {
      // Configuration sub-heading ("At least 50% chord") or the wrapped second
      // line of a category title — a separator, never data.
      closeRow();
    } else {
      const gap = previous && previous.page === line.page
        ? previous.y - line.y
        : Infinity;
      if (!open || gap >= NEW_ROW_GAP) {
        closeRow();
        open = { label: "", cells: ["", "", "", ""] };
      }
      open.label = `${open.label} ${label?.text ?? ""}`;
      const parts: Column[] = [
        "lightComment",
        "lightGrade",
        "heavyComment",
        "heavyGrade",
      ];
      parts.forEach((part, i) => {
        const cell = cells[part];
        if (cell) open!.cells[i] = `${open!.cells[i]} ${cell.text}`;
      });
    }
    previous = line;
  }
  closeRow();

  const header = parseHeader(runs);
  return {
    ...categories,
    classification: requireField(header, "Classification"),
    folding_lines_used: requireField(header, "Folding lines used"),
    glider_model: requireField(header, "Glider model"),
  } as Wing;
}

export type { CategoryKey };
