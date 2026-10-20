import { resources, resourceStyle } from "../lib/resources";

export default function ResourceLegend({ types }: { types?: string[] }) {
  return (
    <ul className="resource-legend" aria-label="Resource types">
      {resources
        .filter((type) => !types || types.includes(type.id))
        .map((type) => (
          <li key={type.id} style={resourceStyle(type.id)}>
            <span className="resource-dot" />
            {type.label}
          </li>
        ))}
    </ul>
  );
}
