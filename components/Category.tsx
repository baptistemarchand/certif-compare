import type { Signal } from "@preact/signals";
import { CategoryKey } from "../categories.ts";
import { Grade } from "./Grade.tsx";
import { Test, TestResult } from "./Test.tsx";

export const Category = (
  { categoryKey, label, testLabels, showIfNoDiff, wings }: {
    categoryKey: CategoryKey;
    label: string;
    testLabels: readonly string[];
    showIfNoDiff: Signal<boolean>;
    wings: any[];
  },
) => {
  const categoryDiff = wings.some((wing) =>
    wing[categoryKey].result !== wings[0][categoryKey].result
  );
  if (
    !showIfNoDiff.value && !categoryDiff && testLabels.every((testLabel, i) => {
      const results = wings.map((wing) =>
        wing[categoryKey].tests[i] as TestResult
      );
      return results.every((result) =>
        result[1] === results[0][1] && result[3] === results[0][3]
      );
    })
  ) {
    return null;
  }
  return (
    <details open={categoryDiff || true} class="bg-gray-100 rounded">
      <summary
        class={`flex mt-4 p-2`}
      >
        <p
          class={`text-lg font-medium w-1/2 max-w-screen-sm`}
        >
          {label}
        </p>
        <div class="flex">
          {wings.map((wing) => (
            <Grade
              grade={wing[categoryKey].result}
              light={!categoryDiff}
            />
          ))}
        </div>
      </summary>

      {testLabels.map((testLabel, i) => (
        <Test
          label={testLabel}
          results={wings.map((wing) =>
            wing[categoryKey].tests[i] as TestResult
          )}
          showIfNoDiff={showIfNoDiff}
        />
      ))}
    </details>
  );
};
