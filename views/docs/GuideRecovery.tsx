import { guideRepoUrl } from "../../lib/docs-source";
import Icon from "../../components/Icon";
type Props = { status: string; branch: string; onRetry: () => void };
export default function GuideRecovery({ status, branch, onRetry }: Props) {
  return (
    <div className="actions">
      {status === "error" ? (
        <button className="button primary" onClick={onRetry}>
          Retry loading
        </button>
      ) : (
        <a className="button primary" href="#">
          Read the overview
        </a>
      )}
      <a
        className="button secondary"
        href={guideRepoUrl(branch)}
        target="_blank"
        rel="noreferrer"
      >
        View guide source <Icon name="external" />
      </a>
    </div>
  );
}
