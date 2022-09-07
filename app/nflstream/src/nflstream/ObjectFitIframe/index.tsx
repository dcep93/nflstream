import { default as ofStyle } from "./index.module.css";
import Log from "./Log";

function ObjectFitIframe(props: {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  url: string;
  name: string;
  skipLog: boolean;
}) {
  return (
    <div className={ofStyle.container}>
      {props.skipLog ? null : <Log name={props.name}></Log>}
      <iframe
        ref={props.iframeRef}
        sandbox={"allow-scripts allow-same-origin"}
        className={ofStyle.fill}
        title={props.name}
        srcDoc={`
<meta data-url="${props.url}" data-title="${props.name}" />
<script>
(${script.toString()})();
</script>
      `}
      ></iframe>
    </div>
  );
}

const script = () => {
  document.addEventListener("DOMContentLoaded", () => {
    Object.assign(document.body.style, {
      width: "100vw",
      height: "100vh",
      margin: 0,
      border: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    });
    const meta = document.getElementsByTagName("meta")[0];
    const iframeE = document.createElement("iframe");
    iframeE.allowFullscreen = true;
    Object.assign(iframeE.style, {
      border: 0,
      opacity: 0,
    });
    iframeE.onload = () => {
      // const [width, height] = [iframeE.offsetWidth, iframeE.offsetHeight];
      const [width, height] = [812, 477]; // on weakstreams, height is dynamic
      const ratioStr = width + "/" + height;
      const ratio = width / height;
      const style = document.createElement("style");
      style.innerHTML = `
                @media (min-aspect-ratio: ${ratioStr}) {
                    iframe {
                        height: 100vh;
                        width: ${100 * ratio}vh;
                    }
                }
                @media (max-aspect-ratio: ${ratioStr}) {
                    iframe {
                        width: 100vw;
                        height: ${100 / ratio}vw;
                    }
                }
            `;
      document.head.appendChild(style);
      iframeE.style.opacity = "1";
    };
    iframeE.src = meta.getAttribute("data-url")!;
    document.body.appendChild(iframeE);
  });
};

export default ObjectFitIframe;
