import { api } from "./account";
import type { NetworkEntry } from "./library";

export type Upload = {
  id: string;
  name: string;
  description: string;
  author: string;
  types: string[];
  createdAt: number;
};
export type Details = { name: string; description: string };

export const uploadLimit = 524_288;

const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "network";

export const uploadEntry = (upload: Upload): NetworkEntry => ({
  id: upload.id,
  name: upload.name,
  author: upload.author,
  desc: upload.description,
  file: `${slug(upload.name)}.lnet`,
  types: upload.types,
  added: new Date(upload.createdAt).toISOString().slice(0, 10),
});

export const fetchUploads = () =>
  api<Upload[]>("networks").then((uploads) => uploads.map(uploadEntry));

export const fetchOwnUploads = () => api<Upload[]>("me/networks");

export const publishNetwork = (
  details: Details & { lnet: string; types: string[] },
) => api<Upload>("networks", "POST", details);

export const editUpload = (id: string, details: Details) =>
  api<Upload>("networks", "PUT", { id, ...details });

export const deleteUpload = (id: string) => api("networks", "DELETE", { id });
