import GuideRecovery from "./GuideRecovery";
type Props = { status: string; branch: string; onRetry: () => void };
export default function GuideUnavailable({ status, branch, onRetry }: Props) {
  return (
    <article
      className="doc-article"
      role={status === "error" ? "alert" : undefined}
    >
      <h1>
        {status === "notfound" ? "Topic not found" : "Could not load the guide"}
      </h1>
      <p className="doc-p">
        {status === "notfound"
          ? "This topic is not available for the selected version. Choose another chapter or return to the overview."
          : "The guide comes from the mod repository. Check your connection and try again."}
      </p>
      <GuideRecovery status={status} branch={branch} onRetry={onRetry} />
    </article>
  );
}
