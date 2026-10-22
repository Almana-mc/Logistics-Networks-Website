export type ErrorCopy = {
  code: string;
  reason: string;
  title: string;
  summary: string;
  retry?: boolean;
};

export const errors: ErrorCopy[] = [
  {
    code: "400",
    reason: "Bad request",
    title: "This request couldn't be read",
    summary:
      "Part of the address isn't in a form the site understands. Check the link for missing or stray characters, or start again from the home page.",
  },
  {
    code: "403",
    reason: "Forbidden",
    title: "You can't open this page",
    summary:
      "This address exists, but it isn't open to visitors. Pick another page to carry on.",
  },
  {
    code: "404",
    reason: "Not found",
    title: "This page doesn't exist",
    summary:
      "The address may be mistyped, or the page has moved. If a share link sent you here, check it was copied in full.",
  },
  {
    code: "410",
    reason: "Gone",
    title: "This page has been removed",
    summary:
      "It was taken down on purpose and won't be coming back. Saved networks live in the library, and setup guides in the docs.",
  },
  {
    code: "429",
    reason: "Too many requests",
    title: "You're sending requests too quickly",
    summary:
      "The site limits how often one connection can ask for pages. Wait a minute, then try again.",
    retry: true,
  },
  {
    code: "500",
    reason: "Server error",
    title: "Something broke on the server",
    summary:
      "The server hit an error while loading this page. It wasn't caused by anything you did. Try again in a moment.",
    retry: true,
  },
  {
    code: "502",
    reason: "Bad gateway",
    title: "The server didn't respond",
    summary:
      "The site couldn't reach the service behind this page. This is usually temporary, so try again in a few minutes.",
    retry: true,
  },
  {
    code: "503",
    reason: "Service unavailable",
    title: "The site is temporarily unavailable",
    summary:
      "It's down for maintenance or under heavy load. Try again in a few minutes.",
    retry: true,
  },
  {
    code: "504",
    reason: "Gateway timeout",
    title: "The server took too long to answer",
    summary:
      "The request timed out before the page finished loading. Try again, and if it keeps happening, the service may be busy.",
    retry: true,
  },
  {
    code: "Error",
    reason: "Something went wrong",
    title: "This page couldn't be loaded",
    summary:
      "The server returned an error it has no page for. Try again, or start again from the home page.",
    retry: true,
  },
];
