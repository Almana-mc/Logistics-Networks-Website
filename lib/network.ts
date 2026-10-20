import "../js/lnet.js";
import type { GraphData } from "./graph";
import { libraryFile } from "./library";

export type Channel = {
  index: number;
  enabled: boolean;
  mode: string;
  type: string;
  batch: number;
  delay: number;
  io: string;
  redstone: string;
  distribution: string;
  filter_mode: string;
  priority: number;
  name: string;
};
export type NetworkItem = { id: string; count: number; components: unknown };
export type NetworkNode = {
  label: string;
  visible: boolean;
  config: {
    activeChannels: Channel[];
    channels: Channel[];
    filters: { channel: number; slot: number; item: NetworkItem | null }[];
    upgrades: { slot: number; item: NetworkItem | null }[];
    required_items: { count: number; item: NetworkItem | null }[];
  };
};
export type Network = {
  network: string;
  nodes: NetworkNode[];
  topology: {
    from: number;
    to: number;
    type: string;
    channel: number;
    weak?: boolean;
    undirected?: boolean;
  }[];
  warnings: string[];
  stats: {
    nodes: number;
    hidden: number;
    links: number;
    activeChannels: number;
  };
};

declare global {
  interface Window {
    LNET: { parse: (text: string) => Network };
  }
}

export function parseNetwork(text: string) {
  const network = window.LNET.parse(text);
  for (const node of network.nodes) {
    const items = [
      ...node.config.filters,
      ...node.config.upgrades,
      ...node.config.required_items,
    ];
    if (
      items.some(
        ({ item }) =>
          item && (typeof item.id !== "string" || !Number.isFinite(item.count)),
      )
    )
      throw new Error(`Invalid item data in ${node.label}.`);
    for (const channel of node.config.activeChannels) {
      if (
        ![
          channel.mode,
          channel.type,
          channel.name,
          channel.io,
          channel.redstone,
          channel.distribution,
          channel.filter_mode,
        ].every((value) => typeof value === "string") ||
        ![channel.batch, channel.delay, channel.priority].every(Number.isFinite)
      )
        throw new Error(`Invalid channel settings in ${node.label}.`);
    }
  }
  return network;
}

export const graphData = (network: Network, baseR = 11): GraphData => ({
  nodes: network.nodes.map((node) => ({
    label: node.label,
    dominantType: node.visible
      ? node.config.activeChannels[0]?.type || "ITEM"
      : null,
    role: node.visible ? "node" : "hidden",
    baseR,
  })),
  edges: network.topology,
});

export async function loadLibraryNetwork(file: string) {
  const response = await fetch(libraryFile(file));
  if (!response.ok) throw new Error(`Could not load ${file}.`);
  return parseNetwork(await response.text());
}
