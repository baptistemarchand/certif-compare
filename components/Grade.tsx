export const Grade = (
  { grade, light, comment, showGrade = true }: {
    grade: string;
    light: boolean;
    comment?: string;
    showGrade?: boolean;
  },
) => {
  const color = (() => {
    if (grade === "A") {
      return light ? "bg-green-100" : "bg-green-400";
    }
    if (grade === "B") {
      return light ? "bg-blue-100" : "bg-blue-400";
    }
    if (grade === "C") {
      return light ? "bg-red-100" : "bg-red-400";
    }
    if (grade === "D") {
      return light ? "bg-purple-100" : "bg-purple-400";
    }
    return "";
  })();
  return (
    <div
      class={`mx-2 my-1 px-3 py-1 w-32 ${color} rounded border border-black`}
    >
      {showGrade && <p class="font-medium">{grade}</p>}
      <p class="text-xs">{comment}</p>
    </div>
  );
};
