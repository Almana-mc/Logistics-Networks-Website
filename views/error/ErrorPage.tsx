import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import Icon from "../../components/Icon";
import ErrorStage from "./ErrorStage";
import OtherPages from "./OtherPages";
import type { ErrorCopy } from "./errors";

export default function ErrorPage({ error }: { error: ErrorCopy }) {
  return (
    <>
      <SiteHeader current="" />
      <main id="main" className="shell page-main" tabIndex={-1}>
        <section className="error-hero" aria-labelledby="error-title">
          <ErrorStage code={error.code} reason={error.reason} />
          <div className="error-copy">
            <h1 id="error-title">{error.title}</h1>
            <p>{error.summary}</p>
            <div className="actions">
              {error.retry ? (
                <>
                  <a className="button primary" href="">
                    <Icon name="reset" size={18} />
                    Try again
                  </a>
                  <a className="button secondary" href="/index.html">
                    Go to the home page
                  </a>
                </>
              ) : (
                <a className="button primary" href="/index.html">
                  Go to the home page
                </a>
              )}
            </div>
          </div>
        </section>
        {!error.retry && <OtherPages />}
      </main>
      <SiteFooter />
    </>
  );
}
