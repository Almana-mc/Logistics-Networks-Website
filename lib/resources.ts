import type { CSSProperties } from "react";

export const resources = [
  { id: "ITEM", label: "Items", color: "item" },
  { id: "FLUID", label: "Fluids", color: "fluid" },
  { id: "ENERGY", label: "Energy", color: "energy" },
  { id: "CHEMICAL", label: "Chemicals", color: "chemical" },
  { id: "SOURCE", label: "Source", color: "source" },
] as const;

export const resourceStyle = (id: string): CSSProperties =>
  ({
    "--resource": `var(--type-${resources.find((type) => type.id === id)?.color || "item"})`,
  }) as CSSProperties;

export const links = {
  github: "https://github.com/Almana-mc/LogisticsNetworks",
  discord: "https://discord.gg/xTeHR2tdYh",
  curseforge: "https://www.curseforge.com/minecraft/mc-mods/logistics-network",
  modrinth: "https://modrinth.com/mod/logisticsnetwork",
};
