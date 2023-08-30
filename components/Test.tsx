import type { Signal } from "@preact/signals";
import { Grade } from "./Grade.tsx";

export type TestResult = [string, string, string, string];

const processTestResult = (
  [commentLight, gradeLight, commentHeavy, gradeHeavy]: TestResult,
) => {
  const comment = (() => {
    if (gradeLight > gradeHeavy) {
      return `${commentLight} (light)`;
    }
    if (gradeHeavy > gradeLight) {
      return `${commentHeavy} (heavy)`;
    }
    return commentLight;
  })();

  return {
    comment,
    grade: gradeLight > gradeHeavy ? gradeLight : gradeHeavy,
  };
};

export function Test({ label, results, showIfNoDiff }: {
  label: string;
  results: TestResult[];
  showIfNoDiff: Signal<boolean>;
}) {
  const processedResults = results.map(processTestResult);

  const diff = processedResults.some(({ grade }) =>
    grade !== processedResults[0].grade
  );

  if (!diff && !showIfNoDiff.value) {
    return null;
  }

  return (
    <div
      class={`flex px-2`}
    >
      <p class="w-1/2 max-w-screen-sm">{label}</p>
      <div class="flex">
        {processedResults.map((r) => (
          <Grade
            grade={r.grade}
            light={!diff}
            comment={r.comment}
            showGrade={false}
          />
        ))}
      </div>
    </div>
  );
}
