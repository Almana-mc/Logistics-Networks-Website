import type { NetworkNode } from "../../lib/network";
import { itemName } from "../../lib/items";

export default function NodeItems({
  config,
}: {
  config: NetworkNode["config"];
}) {
  const groups = itemGroups(config);
  return (
    <>
      {groups
        .filter((group) => group.items.length)
        .map((group) => (
          <section className="node-items" key={group.title}>
            <h3 className="detail-label">{group.title}</h3>
            <ul>
              {group.items.map(({ label, item }, index) => (
                <li key={index}>
                  <span>{label}</span>
                  <strong>{item ? itemName(item.id) : "Unknown item"}</strong>
                  {item && <code>{item.id}</code>}
                  {item?.components != null && (
                    <details>
                      <summary>Item data</summary>
                      <pre>{JSON.stringify(item.components, null, 2)}</pre>
                    </details>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
    </>
  );
}

function itemGroups(config: NetworkNode["config"]) {
  return [
    {
      title: "Filters",
      items: config.filters.map((filter) => ({
        label: `Channel ${filter.channel + 1}, slot ${filter.slot + 1}`,
        item: filter.item,
      })),
    },
    {
      title: "Upgrades",
      items: config.upgrades.map((upgrade) => ({
        label: `Slot ${upgrade.slot + 1}`,
        item: upgrade.item,
      })),
    },
    {
      title: "Required to paste",
      items: config.required_items.map((required) => ({
        label: `×${required.count}`,
        item: required.item,
      })),
    },
  ];
}
