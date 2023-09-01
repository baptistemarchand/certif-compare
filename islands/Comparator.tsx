import { useSignal } from "@preact/signals";

import { categories } from "../categories.ts";
import { Header } from "../components/Header.tsx";
import { Category } from "../components/Category.tsx";
import { soarxs } from "../wings/soarxs.ts";
import { hook522 } from "../wings/hook522.ts";

export default function Comparator() {
  const showIfNoDiff = useSignal(false);
  const wings = useSignal<any[]>([hook522, soarxs]);
  return (
    <div class="px-4 py-8 mx-auto">
      <div class="">
        <Header showIfNoDiff={showIfNoDiff} wings={wings} />

        {categories.map(({ key, label, testLabels }) => (
          <Category
            categoryKey={key}
            label={label}
            testLabels={testLabels}
            showIfNoDiff={showIfNoDiff}
            wings={wings.value}
          />
        ))}
      </div>
    </div>
  );
}
