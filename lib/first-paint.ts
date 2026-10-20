export function afterFirstPaint() {
  return new Promise<void>((resolve) => {
    if (!PerformanceObserver.supportedEntryTypes.includes("paint")) {
      resolve();
      return;
    }
    new PerformanceObserver((_, observer) => {
      observer.disconnect();
      resolve();
    }).observe({ type: "paint", buffered: true });
  });
}
