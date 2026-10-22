import type { Context, Routes } from "./context.ts";
import { param, send } from "./http.ts";

type Entry = {
  id: number;
  admin: string | null;
  action: string;
  target: string;
  detail: string;
  created_at: number;
};

const hour = 3_600_000;

export function adminChange(context: Context) {
  const adminId = context.requireAdmin();
  context.requireRecent();
  context.limit(`admin:${adminId}`, 300, hour);
  return (action: string, target: string, detail: object) =>
    context.db
      .prepare(
        "INSERT INTO admin_log (admin_id, action, target, detail, created_at) VALUES (?, ?, ?, ?, ?)",
      )
      .run(adminId, action, target, JSON.stringify(detail), Date.now());
}

export const auditRoutes: Routes = {
  "GET /api/admin/log": (context) => {
    context.requireAdmin();
    const before =
      Number(param(context.request, "before")) || Number.MAX_SAFE_INTEGER;
    const rows = context.db
      .prepare(
        `SELECT l.id, u.username AS admin, l.action, l.target, l.detail, l.created_at
        FROM admin_log l LEFT JOIN users u ON u.id = l.admin_id
        WHERE l.id < ? ORDER BY l.id DESC LIMIT 100`,
      )
      .all(before) as Entry[];
    send(
      context.response,
      200,
      rows.map(({ detail, created_at, ...row }) => ({
        ...row,
        detail: JSON.parse(detail),
        createdAt: created_at,
      })),
    );
  },
};
