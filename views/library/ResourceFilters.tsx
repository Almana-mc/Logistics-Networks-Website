import { resources, resourceStyle } from "../../lib/resources";
type Props = {
  types: string[];
  counts: (type: string) => number;
  onType: (type: string) => void;
};
export default function ResourceFilters({ types, counts, onType }: Props) {
  return (
    <fieldset className="resource-filters">
      <legend>Moves any of</legend>
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
          <span className="filter-count">{counts(type.id)}</span>
        </button>
      ))}
    </fieldset>
  );
}
