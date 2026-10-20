import { createRoot } from "react-dom/client";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import PageIntro from "../components/PageIntro";
import NetworkIntro from "./visualiser/NetworkIntro";
import UploadNetwork from "./visualiser/UploadNetwork";
import NetworkWorkspace from "./visualiser/NetworkWorkspace";
import ProcessingSteps, { steps } from "./visualiser/ProcessingSteps";
import { useNetworkFile } from "./visualiser/useNetworkFile";
import { useReveal } from "./visualiser/useReveal";
import "../styles/index.css";
import "../styles/views/visualiser.css";
import "../styles/views/visualiser-workspace.css";
import "../styles/views/node-detail.css";

function Visualiser() {
  const file = useNetworkFile();
  const step = useReveal(file.loaded, steps.length);
  return (
    <>
      <SiteHeader current="Visualiser" />
      <main id="main" className="shell page-main" tabIndex={-1}>
        {file.loaded ? (
          <NetworkIntro loaded={file.loaded} />
        ) : (
          <PageIntro eyebrow="The Visualiser" title="See your network breathe.">
            Open a <code>.lnet</code> export from the in-game Computer screen.
            Every node is read, the flow from senders to receivers is inferred,
            and the network is drawn colour-coded by resource type.
          </PageIntro>
        )}
        {!file.loaded ? (
          <UploadNetwork
            busy={file.busy}
            error={file.error}
            onFile={file.openFile}
            onExample={file.openExample}
          />
        ) : step <= steps.length ? (
          <ProcessingSteps step={step} loaded={file.loaded} />
        ) : (
          <NetworkWorkspace loaded={file.loaded} onReset={file.reset} />
        )}
      </main>
      <SiteFooter note=".lnet files are parsed in your browser." />
    </>
  );
}

createRoot(document.getElementById("root")!).render(<Visualiser />);
