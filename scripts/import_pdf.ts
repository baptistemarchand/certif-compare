import { extractRuns } from "./pdf_text.ts";
import { parseReport, type Wing } from "./parse_report.ts";
import { categories } from "../categories.ts";
import type { TestResult } from "../components/Test.tsx";

const GRADE = /^[A-D0]$/;

/**
 * Checks the parse against categories.ts — the shape the UI actually renders —
 * plus the specific corruption classes the previous label-matching parser left
 * behind in the committed data. Anything that fails here is a bug in the
 * extractor, never something to paper over by editing categories.ts.
 */
function validate(wing: Wing): string[] {
  const problems: string[] = [];

  for (const { key, label, testLabels } of categories) {
    const category = wing[key] as
      | { result: string; tests: TestResult[] }
      | undefined;
    if (!category) {
      problems.push(`${key} (${label}): missing entirely`);
      continue;
    }
    if (!GRADE.test(category.result)) {
      problems.push(
        `${key}: result ${JSON.stringify(category.result)} is not a grade`,
      );
    }
    if (category.tests.length !== testLabels.length) {
      problems.push(
        `${key} (${label}): ${category.tests.length} tests, expected ${testLabels.length}`,
      );
      continue;
    }
    category.tests.forEach((test, i) => {
      const where = `${key}.tests[${i}] (${testLabels[i]})`;
      const [lightComment, lightGrade, heavyComment, heavyGrade] = test;
      for (
        const [grade, side] of [[lightGrade, "light"], [
          heavyGrade,
          "heavy",
        ]] as const
      ) {
        if (!GRADE.test(grade)) {
          problems.push(
            `${where}: ${side} grade ${JSON.stringify(grade)} is not a grade`,
          );
        }
      }
      for (
        const [comment, side] of [[lightComment, "light"], [
          heavyComment,
          "heavy",
        ]] as const
      ) {
        if (!comment) {
          problems.push(`${where}: ${side} comment is empty`);
          continue;
        }
        // "90° to 180° / Dive or roll angle B 15° to 45°" — a grade letter that
        // leaked out of its own column and into the comment text.
        if (/\s[A-D]\s/.test(comment)) {
          problems.push(
            `${where}: ${side} comment has a stray grade letter: ${comment}`,
          );
        }
        // "No No" — a row swallowed by its neighbour. Invisible to the count
        // check above, because the swallowed row disappears rather than shifts.
        const words = comment.split(" ");
        if (words.length % 2 === 0) {
          const half = words.length / 2;
          if (words.slice(0, half).join(" ") === words.slice(half).join(" ")) {
            problems.push(`${where}: ${side} comment is doubled: ${comment}`);
          }
        }
      }
    });
  }
  return problems;
}

function slugFor(model: string): string {
  const slug = model.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!slug) {
    throw new Error(
      `cannot derive a slug from glider model ${JSON.stringify(model)}`,
    );
  }
  return slug;
}

/**
 * Emits each test as a single-line tuple; `deno fmt` then wraps only the ones
 * that are genuinely too long. Letting JSON.stringify's indentation stand would
 * put every one of the four fields on its own line and more than double the
 * file, drowning real data changes in noise at review time.
 */
function serialise(slug: string, wing: Wing): string {
  const lines = [`export const ${slug} = {`];
  for (const { key } of categories) {
    const { result, tests } = wing[key] as {
      result: string;
      tests: TestResult[];
    };
    lines.push(`  ${JSON.stringify(key)}: {`);
    lines.push(`    "result": ${JSON.stringify(result)},`);
    lines.push(`    "tests": [`);
    for (const test of tests) {
      lines.push(
        `      [${test.map((field) => JSON.stringify(field)).join(", ")}],`,
      );
    }
    lines.push(`    ],`);
    lines.push(`  },`);
  }
  for (
    const field of [
      "classification",
      "folding_lines_used",
      "glider_model",
    ] as const
  ) {
    lines.push(`  ${JSON.stringify(field)}: ${JSON.stringify(wing[field])},`);
  }
  lines.push("};", "");
  return lines.join("\n");
}

/** Adds the import and the allWings entry, leaving an already-known wing alone. */
async function register(slug: string): Promise<boolean> {
  const path = new URL("../wings/index.ts", import.meta.url);
  const source = await Deno.readTextFile(path);
  if (source.includes(`./${slug}.ts`)) return false;
  const updated = source
    .replace(
      /(^import .*\n)(?![\s\S]*^import )/m,
      `$1import { ${slug} } from "./${slug}.ts";\n`,
    )
    .replace(/(\n\];)/, `\n  ${slug},$1`);
  await Deno.writeTextFile(path, updated);
  return true;
}

async function fmt(path: string) {
  const command = new Deno.Command(Deno.execPath(), {
    args: ["fmt", "--quiet", path],
    stdout: "null",
    stderr: "inherit",
  });
  await command.output();
}

if (import.meta.main) {
  const args = [...Deno.args];
  const dryRun = args.includes("--dry-run");
  const slugFlag = args.indexOf("--slug");
  const slugOverride = slugFlag >= 0 ? args[slugFlag + 1] : undefined;
  const source = args.find((a) => !a.startsWith("--") && a !== slugOverride);

  if (!source) {
    console.error(
      "usage: deno task import <report.pdf> [--slug name] [--dry-run]",
    );
    Deno.exit(2);
  }

  const wing = parseReport(await extractRuns(await Deno.readFile(source)));
  const slug = slugOverride ?? slugFor(wing.glider_model);

  console.log(
    `${wing.glider_model} — class ${wing.classification} → wings/${slug}.ts`,
  );
  for (const { key, label, testLabels } of categories) {
    const category = wing[key] as { tests: TestResult[] } | undefined;
    const count = category?.tests.length ?? 0;
    const ok = count === testLabels.length;
    console.log(
      `  ${ok ? "✓" : "✗"} ${key} ${
        String(count).padStart(2)
      }/${testLabels.length}  ${label}`,
    );
  }

  const problems = validate(wing);
  if (problems.length) {
    console.error(`\n${problems.length} problem(s):`);
    for (const problem of problems) console.error(`  ✗ ${problem}`);
    Deno.exit(1);
  }
  console.log(
    `\n✓ ${categories.length}/${categories.length} categories validated`,
  );

  if (dryRun) {
    console.log("(dry run — nothing written)");
  } else {
    const path = `wings/${slug}.ts`;
    await Deno.writeTextFile(path, serialise(slug, wing));
    await fmt(path);
    console.log(
      `wrote ${path}${
        (await register(slug)) ? " and registered it in wings/index.ts" : ""
      }`,
    );
  }
}

export { serialise, slugFor, validate };
