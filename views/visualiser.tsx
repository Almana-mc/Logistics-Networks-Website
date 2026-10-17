import { createRoot } from "react-dom/client";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PageIntro from "../components/PageIntro";
import UploadNetwork from "./visualiser/UploadNetwork";
import NetworkWorkspace from "./visualiser/NetworkWorkspace";
import { useNetworkFile } from "./visualiser/useNetworkFile";
import "../styles/index.css";
import "../styles/views/visualiser.css";
import "../styles/views/node-detail.css";

function Visualiser() {
  const file = useNetworkFile();
  return (
    <>
      <Header current="Visualiser" />
      <main id="main" className="shell page-main" tabIndex={-1}>
        <PageIntro title="Network visualiser">
          See how your setup connects. Open a <code>.lnet</code> export to
          inspect nodes, channels and resource paths.
        </PageIntro>
        {file.loaded ? (
          <NetworkWorkspace loaded={file.loaded} onReset={file.reset} />
        ) : (
          <UploadNetwork
            busy={file.busy}
            error={file.error}
            onFile={file.openFile}
            onExample={file.openExample}
          />
        )}
      </main>
      <Footer />
    </>
  );
}

createRoot(document.getElementById("root")!).render(<Visualiser />);
