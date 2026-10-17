type Props = { status: string; onRetry: () => void };
export default function LibraryStatus({ status, onRetry }: Props) {
  if (status === "loading")
    return (
      <div className="loading-state" role="status">
        <p>Loading saved networks…</p>
      </div>
    );
  if (status === "error")
    return (
      <div className="empty-state" role="alert">
        <h2>Could not load the library</h2>
        <p>Check your connection and try again.</p>
        <button className="button primary" onClick={onRetry}>
          Retry loading
        </button>
      </div>
    );
  return null;
}
