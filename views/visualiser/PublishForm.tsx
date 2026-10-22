import { useState } from "react";
import FormActions from "../../components/FormActions";
import NetworkFields from "../../components/NetworkFields";
import { useSubmit } from "../../lib/account";
import type { NetworkEntry } from "../../lib/library";
import type { Network } from "../../lib/network";
import { publishNetwork, uploadEntry, uploadLimit } from "../../lib/uploads";
import PublishSummary from "./PublishSummary";
import type { LoadedNetwork } from "./useNetworkFile";

type Props = {
  loaded: LoadedNetwork;
  author: string;
  onPublished: (entry: NetworkEntry) => void;
  onCancel: () => void;
};

const usedTypes = (network: Network) => [
  ...new Set(
    network.nodes.flatMap((node) =>
      node.config.activeChannels.map((channel) => channel.type),
    ),
  ),
];

export default function PublishForm({
  loaded,
  author,
  onPublished,
  onCancel,
}: Props) {
  const types = usedTypes(loaded.network);
  const [details, setDetails] = useState({
    name: loaded.network.network || loaded.name.replace(/\.lnet$/i, ""),
    description: "",
  });
  const form = useSubmit(async () => {
    const { raw } = loaded;
    if (new Blob([raw]).size > uploadLimit) throw new Error("too-large");
    const upload = await publishNetwork({ ...details, lnet: raw, types });
    onPublished(uploadEntry(upload));
  });
  return (
    <>
      <h2 id="publish-heading">Publish to the library</h2>
      <PublishSummary loaded={loaded} types={types} />
      <form className="publish-form" onSubmit={form.onSubmit}>
        <NetworkFields id="publish" value={details} onChange={setDetails} />
        <p>
          Anyone can open and download it from the library, credited to{" "}
          <strong>{author}</strong>. Edit or delete it any time from your
          account.
        </p>
        <FormActions
          label={form.busy ? "Publishing…" : "Publish"}
          form={form}
          onCancel={onCancel}
        />
      </form>
    </>
  );
}
