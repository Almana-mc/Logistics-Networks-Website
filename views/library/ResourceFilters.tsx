import { resources, resourceStyle } from "../../lib/resources";
type Props = { types: string[]; onType: (type: string) => void };
export default function ResourceFilters({ types, onType }: Props) {
  return (
    <fieldset className="resource-filters">
      <legend>Filter by resource</legend>
      {resources.map((type) => (
        <button
          key={type.id}
          className="resource-filter"
          style={resourceStyle(type.id)}
          aria-pressed={types.includes(type.id)}
          onClick={() => onType(type.id)}
        >
          <span className="resource-dot" />
          {type.label}
        </button>
      ))}
    </fieldset>
  );
}
