import { useEffect, useState } from "react";

export function useReveal(key: unknown, steps: number) {
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [shown, setShown] = useState({ key, step: steps + 1 });
  useEffect(() => {
    if (!key || still) return;
    const timers = Array.from({ length: steps }, (_, index) =>
      setTimeout(() => setShown({ key, step: index + 1 }), 120 + index * 120),
    );
    timers.push(
      setTimeout(() => setShown({ key, step: steps + 1 }), 200 + steps * 120),
    );
    return () => timers.forEach(clearTimeout);
  }, [key, steps, still]);
  if (still) return steps + 1;
  return shown.key === key ? shown.step : 0;
}
