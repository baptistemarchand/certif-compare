import type { Signal } from "@preact/signals";
import { wings } from "../wings/index.ts";

export const Header = ({ showIfNoDiff }: { showIfNoDiff: Signal<boolean> }) => (
  <div class="flex p-2 items-end">
    <div class="w-1/2 max-w-screen-sm">
      <p class="text-2xl font-semibold mb-3">
        Welcome to my amazing certification comparator!
      </p>
      <div>
        <input
          id="showIfNoDiff"
          type="checkbox"
          checked={showIfNoDiff.value}
          onClick={() => (showIfNoDiff.value = !showIfNoDiff.value)}
        />
        <label class="ml-2" for="showIfNoDiff">
          show tests where everything is the same
        </label>
      </div>
    </div>
    {wings.map((wing) => (
      <div class="font-medium p-2 mx-2 w-32 border border-black flex justify-center rounded">
        {wing.glider_model} ({wing.classification})
      </div>
    ))}
  </div>
);
