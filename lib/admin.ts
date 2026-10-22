import { api } from "./account";
import type { Details, Upload } from "./uploads";

export type AdminUser = {
  id: number;
  username: string;
  email: string;
  createdAt: number;
  suspendedAt: number | null;
  networks: number;
  locked: boolean;
  admin: boolean;
};
export type AdminNetwork = Upload & { userId: number; hidden: boolean };
export type UserDetails = AdminUser & { networkList: AdminNetwork[] };
export type Block = { pattern: string; createdAt: number; accounts: number };
export type LogEntry = {
  id: number;
  admin: string | null;
  action: string;
  target: string;
  detail: unknown;
  createdAt: number;
};

export const searchUsers = (query: string) =>
  api<AdminUser[]>(`admin/users?q=${encodeURIComponent(query)}`);
export const fetchUser = (id: number) =>
  api<UserDetails>(`admin/user?id=${id}`);
export const saveUser = (
  id: number,
  changes: { username: string; email: string },
) => api<AdminUser>("admin/user", "PUT", { id, ...changes });
export const suspendUser = (id: number, suspended: boolean) =>
  api<AdminUser>("admin/user/suspend", "POST", { id, suspended });
export const signOutUser = (id: number) =>
  api("admin/user/signout", "POST", { id });
export const deleteUser = (id: number) => api("admin/user", "DELETE", { id });

export const fetchNetworks = () => api<AdminNetwork[]>("admin/networks");
export const editNetwork = (id: string, details: Details) =>
  api<AdminNetwork>("admin/networks", "PUT", { id, ...details });
export const deleteNetwork = (id: string) =>
  api("admin/networks", "DELETE", { id });

export const fetchBlocks = () => api<Block[]>("admin/blocks");
export const addBlock = (pattern: string) =>
  api<Block[]>("admin/blocks", "POST", { pattern });
export const removeBlock = (pattern: string) =>
  api<Block[]>("admin/blocks", "DELETE", { pattern });

export const fetchLog = (before?: number) =>
  api<LogEntry[]>(before ? `admin/log?before=${before}` : "admin/log");
