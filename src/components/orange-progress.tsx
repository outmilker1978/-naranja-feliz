export function OrangeProgress({ completed, total, size = "sm" }: { completed: number; total: number; size?: "sm" | "md" | "lg" }) {
  if (total === 0) return null;

  const dotSize = size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5";
  const gap = size === "sm" ? "gap-0.5" : "gap-1";
  const allDone = completed >= total;

  if (allDone) {
    return <span className="text-lg" title="Курс пройден!">🍊</span>;
  }

  return (
    <div className={`flex items-center ${gap}`} title={`${completed} из ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`${dotSize} rounded-full border-2 transition-all duration-300 ${
            i < completed
              ? "bg-primary-500 border-primary-500"
              : "bg-white border-primary-300"
          }`}
        />
      ))}
    </div>
  );
}
