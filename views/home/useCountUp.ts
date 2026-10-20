import { useEffect, useRef, useState } from "react";

export function useCountUp(target: number) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const begin = from.current;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still || begin === target) {
      from.current = target;
      setShown(target);
      return;
    }
    const span = begin ? 900 : 1800;
    const began = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const progress = Math.min(1, (now - began) / span);
      const eased = 1 - (1 - progress) ** 4;
      from.current = Math.round(begin + (target - begin) * eased);
      setShown(from.current);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return shown;
}
