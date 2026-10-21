import { useEffect, useState, type FormEvent } from "react";

export type Account = {
  user: { id: number; username: string; email: string; createdAt: number };
  hasPassword: boolean;
};

const messages: Record<string, string> = {
  "bad-email": "Enter a valid email address.",
  "bad-username": "Use 3 to 24 letters, numbers, _ or -.",
  "username-taken": "That username is taken. Try another.",
  "email-taken": "That email already has an account. Sign in instead.",
  "password-length": "Use 12 to 128 characters.",
  "password-username": "Your password can't contain your username.",
  "password-breached":
    "That password appears in a known data breach. Choose another.",
  "signup-password":
    "That isn't the password you chose when signing up. Forgot it? Go back and create the account again.",
  "invalid-login": "Wrong username, email or password.",
  "wrong-password": "That password is wrong.",
  "wrong-code": "That code is wrong. Check the latest email and try again.",
  "code-expired": "That code has expired. Request a new one.",
  "link-expired": "That link has expired or was already used. Start again.",
  reauth: "Confirm it's you to continue, then try again.",
  "reauth-cancelled": "Not saved. Confirm it's you to make this change.",
  "signed-out": "You were signed out. Sign in again.",
  "rate-limited": "Too many attempts. Wait a few minutes and try again.",
  server: "Something went wrong. Try again.",
};

export const describeError = (code: string) =>
  messages[code] || messages.server;

export const newPassword = {
  type: "password",
  autoComplete: "new-password",
  minLength: 12,
  hint: "12 to 128 characters. Passwords found in known data breaches are refused.",
} as const;

export const formatDate = (time: number) =>
  new Date(time).toLocaleDateString(undefined, { dateStyle: "medium" });

export async function api<T = void>(
  path: string,
  method = "GET",
  body?: unknown,
) {
  const response = await fetch(
    `/api/${path}`,
    method === "GET"
      ? {}
      : {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body ?? {}),
        },
  );
  const data = await response.json().catch(() => undefined);
  if (data?.error === "signed-out") accountChanged();
  if (!response.ok) throw new Error(data?.error || "server");
  return data as T;
}

let current: Promise<Account | null> | null = null;
const loadAccount = () =>
  (current ??= api<Account | null>("me").catch(() => null));

export function accountChanged() {
  current = null;
  window.dispatchEvent(new Event("account"));
}

export function useAccount() {
  const [state, setState] = useState({
    account: null as Account | null,
    loading: true,
  });
  useEffect(() => {
    let live = true;
    const load = () => {
      const request = loadAccount();
      request.then((account) => {
        if (live && request === current) setState({ account, loading: false });
      });
    };
    load();
    window.addEventListener("account", load);
    return () => {
      live = false;
      window.removeEventListener("account", load);
    };
  }, []);
  return state;
}

export function useSubmit(action: () => Promise<unknown>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    action()
      .catch((failure: Error) => setError(failure.message))
      .finally(() => setBusy(false));
  };
  return { busy, error, onSubmit };
}
