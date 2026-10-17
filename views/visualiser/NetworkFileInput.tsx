type Props = { busy: boolean; onFile: (file: File) => void };
export default function NetworkFileInput({ busy, onFile }: Props) {
  return (
    <div className="file-choice">
      <label htmlFor="network-file">Choose a .lnet or .txt file</label>
      <input
        id="network-file"
        type="file"
        accept=".lnet,.txt"
        disabled={busy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }}
        aria-describedby="file-privacy file-error"
      />
    </div>
  );
}
