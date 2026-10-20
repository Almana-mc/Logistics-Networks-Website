export default function NetworkNotes({ warnings }: { warnings: string[] }) {
  return (
    <>
      <p className="inference-note">
        Connections are inferred from channel settings. This is a saved
        configuration, not live game telemetry. Solid arrows show inferred
        direction, dashed lines a shared channel, dotted lines layout only.
        Layout-only links are excluded from the link count.
      </p>
      {warnings.length > 0 && (
        <details className="parsing-notes">
          <summary>
            {warnings.length} parsing {warnings.length === 1 ? "note" : "notes"}
          </summary>
          <ul>
            {warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
