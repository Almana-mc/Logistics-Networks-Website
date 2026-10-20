import type { LoadedNetwork } from "./useNetworkFile";

export const steps = [
  "Reading export",
  "Parsing nodes",
  "Inferring flow",
  "Resolving channels",
  "Building topology",
];

type Props = { step: number; loaded: LoadedNetwork };
export default function ProcessingSteps({ step, loaded }: Props) {
  const { stats } = loaded.network;
  const values = [loaded.name, stats.nodes, stats.links, stats.activeChannels];
  const progress = (Math.min(step, steps.length) / steps.length) * 100;
  return (
    <div className="stage processing" role="status">
      <div className="processing-panel">
        <ol>
          {steps.map((label, index) => (
            <li
              key={label}
              className={
                index < step ? "is-done" : index === step ? "is-active" : ""
              }
            >
              <span className="step-dot" aria-hidden="true" />
              <span>{label}</span>
              <span className="step-value">
                {index < step ? (values[index] ?? "ok") : ""}
              </span>
            </li>
          ))}
        </ol>
        <span className="progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </span>
      </div>
    </div>
  );
}
