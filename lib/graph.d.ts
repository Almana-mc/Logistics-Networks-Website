import type { Network } from "./network";

export type GraphData = {
  nodes: {
    label: string;
    dominantType: string | null;
    role: string;
    baseR: number;
  }[];
  edges: Network["topology"];
};
export type Graph = {
  setData: (data: GraphData) => void;
  start: () => void;
  stop: () => void;
  destroy: () => void;
  resize: () => void;
  select: (index: number) => void;
  on: (name: string, callback: (value: { index: number }) => void) => void;
  _frame: () => void;
  view: { x: number; y: number; k: number };
  cw: number;
  ch: number;
};
declare global {
  interface Window {
    NetworkGraph: new (
      canvas: HTMLCanvasElement,
      options: Record<string, unknown>,
    ) => Graph;
  }
}
