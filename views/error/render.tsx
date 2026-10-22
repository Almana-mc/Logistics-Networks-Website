import { renderToStaticMarkup } from "react-dom/server";
import ErrorPage from "./ErrorPage";
import { errors } from "./errors";

export const pages = errors.map((error) => ({
  file: error.code.toLowerCase(),
  title: error.reason,
  description: error.summary,
  body: renderToStaticMarkup(<ErrorPage error={error} />),
}));
