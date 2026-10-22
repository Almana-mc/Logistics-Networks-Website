type Props = { code: string; reason: string };
export default function ErrorStage({ code, reason }: Props) {
  return (
    <div className="error-stage">
      <span className="stage-corner top left" aria-hidden="true" />
      <span className="stage-corner top right" aria-hidden="true" />
      <span className="stage-corner bottom left" aria-hidden="true" />
      <span className="stage-corner bottom right" aria-hidden="true" />
      <p className={/^\d+$/.test(code) ? "error-code" : "error-code word"}>
        {code}
      </p>
      <p className="error-key">
        <span>{reason}</span>
        <code data-path />
      </p>
    </div>
  );
}
