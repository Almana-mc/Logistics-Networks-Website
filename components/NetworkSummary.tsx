import ResourceLegend from "./ResourceLegend";
import { formatDate } from "../lib/account";
import { entryLink } from "../lib/library";
import { uploadEntry, type Upload } from "../lib/uploads";

export default function NetworkSummary({ upload }: { upload: Upload }) {
  return (
    <>
      <h3>
        <a href={entryLink(uploadEntry(upload))}>{upload.name}</a>
      </h3>
      <p className="network-row-date">
        Published{" "}
        <time dateTime={new Date(upload.createdAt).toISOString()}>
          {formatDate(upload.createdAt)}
        </time>
      </p>
      <p>{upload.description}</p>
      <ResourceLegend types={upload.types} />
    </>
  );
}
