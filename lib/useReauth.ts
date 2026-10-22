import { useRef, useState } from "react";

type Waiting = { retry: () => void; cancel: () => void };

export function useReauth() {
  const waiting = useRef<Waiting | null>(null);
  const [open, setOpen] = useState(false);
  const guard = <T>(action: () => Promise<T>): Promise<T> =>
    action().catch((failure: Error) => {
      if (failure.message !== "reauth") throw failure;
      waiting.current?.cancel();
      return new Promise<T>((resolve, reject) => {
        waiting.current = {
          retry: () => action().then(resolve, reject),
          cancel: () => reject(new Error("reauth-cancelled")),
        };
        setOpen(true);
      });
    });
  const finish = (confirmed: boolean) => {
    const pending = waiting.current;
    waiting.current = null;
    setOpen(false);
    if (confirmed) pending?.retry();
    else pending?.cancel();
  };
  return { open, guard, finish };
}
export type Reauth = ReturnType<typeof useReauth>;
