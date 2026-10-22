import type { useNotice } from "../../lib/useNotice";

export default function LibraryNotice({
  notice,
}: {
  notice: ReturnType<typeof useNotice>;
}) {
  return (
    <p ref={notice.ref} className="library-notice" role="status" tabIndex={-1}>
      {notice.text}
    </p>
  );
}
