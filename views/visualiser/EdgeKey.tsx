const lines = [
  ["Inferred direction", ""],
  ["Shared channel", "5 4"],
  ["Layout only", "2 6"],
];

export default function EdgeKey() {
  return (
    <ul className="edge-key" aria-label="Line styles">
      {lines.map(([label, dash]) => (
        <li key={label}>
          <svg width="26" height="10" viewBox="0 0 26 10" aria-hidden="true">
            <line
              x1="1"
              y1="5"
              x2="24"
              y2="5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray={dash || undefined}
            />
            {!dash && (
              <path
                d="M19 1.5 24 5l-5 3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            )}
          </svg>
          {label}
        </li>
      ))}
    </ul>
  );
}
