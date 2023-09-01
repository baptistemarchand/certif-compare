import type { Signal } from "@preact/signals";
import { useSignal } from "@preact/signals";
import { allWings } from "../wings/index.ts";

export const Header = (
  { showIfNoDiff, wings }: {
    showIfNoDiff: Signal<boolean>;
    wings: Signal<any[]>;
  },
) => {
  const selectedWingName = useSignal(allWings[0].glider_model);

  return (
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
      {wings.value.map((wing) => (
        <div class="relative gliderBox">
          <div class="font-medium p-2 mx-2 w-32 border border-black flex justify-center rounded">
            {wing.glider_model} ({wing.classification})
          </div>
          <div
            class="absolute right-0 -top-2 bg-red-500 w-5 h-5 justify-center flex rounded-full cursor-pointer deleteBadge"
            onClick={() => {
              wings.value = wings.value.filter((w) =>
                w.glider_model !== wing.glider_model
              );
            }}
          >
          </div>
        </div>
      ))}

      <select
        value={""}
        onChange={(e) => {
          const gliderModel = (e as any).target.value;
          if (!gliderModel) {
            return;
          }
          wings.value = [
            ...wings.value,
            allWings.find((wing) => wing.glider_model === gliderModel),
          ];
        }}
        class="font-medium p-2 mx-2 w-32 border border-black rounded"
      >
        <option value="">Add a wing</option>
        {allWings.map((wing) => (
          <option
            value={wing.glider_model}
            disabled={wings.value.map((w) => w.glider_model).includes(
              wing.glider_model,
            )}
          >
            {wing.glider_model}
          </option>
        ))}
      </select>
    </div>
  );
};
