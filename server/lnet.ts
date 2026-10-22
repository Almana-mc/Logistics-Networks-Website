import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

export type Edge = {
  from: number;
  to: number;
  type: string;
  weak?: boolean;
  undirected?: boolean;
};
export type Parsed = {
  network: string;
  nodes: {
    label: string;
    visible: boolean;
    config: { activeChannels: { type: string }[] };
  }[];
  topology: Edge[];
  stats: {
    nodes: number;
    hidden: number;
    links: number;
    activeChannels: number;
    types: Record<string, number>;
  };
};

// Browser parser, run sandboxed
const sandbox = { window: {} as { LNET: { parse: (text: string) => Parsed } } };
runInNewContext(
  readFileSync(new URL("../js/lnet.js", import.meta.url), "utf8"),
  sandbox,
);

export const parseLnet = (text: string) => sandbox.window.LNET.parse(text);
