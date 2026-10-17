import { resources, resourceStyle } from "../lib/resources";

export default function ResourceLegend() {
  return (
    <ul className="resource-legend" aria-label="Resource types">
      {resources.map((type) => (
        <li key={type.id} style={resourceStyle(type.id)}>
          <span className="resource-dot" />
          {type.label}
        </li>
      ))}
    </ul>
  );
}
