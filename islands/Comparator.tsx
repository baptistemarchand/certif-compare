import { useSignal } from "@preact/signals";

import { categories } from "../categories.ts";
import { Header } from "../components/Header.tsx";
import { Category } from "../components/Category.tsx";

export default function Comparator() {
  const showIfNoDiff = useSignal(false);
  return (
    <div class="px-4 py-8 mx-auto">
      <div class="">
        <Header showIfNoDiff={showIfNoDiff} />
        {categories.map(({ key, label, testLabels }) => (
          <Category
            categoryKey={key}
            label={label}
            testLabels={testLabels}
            showIfNoDiff={showIfNoDiff}
          />
        ))}
      </div>
    </div>
  );
}
