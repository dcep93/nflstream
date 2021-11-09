import { CSSProperties } from "react";
import { LogType } from "../../firebase";
import { default as ofStyle } from "./index.module.css";
import Log from "./Log";

function ObjectFitIframe(props: {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  url: string;
  name: string;
  log: LogType | undefined;
}) {
  return (
    <div className={ofStyle.container}>
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
      {props.log === undefined ? null : <Log log={props.log}></Log>}
    </div>
  );
}

const script = () => {
  document.addEventListener("DOMContentLoaded", () => {
    const style: CSSProperties = {
      width: "100vw",
      height: "100vh",
      margin: 0,
      border: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    };
    Object.assign(document.body.style, style);
    const meta = document.getElementsByTagName("meta")[0];
    const iframeE = document.createElement("iframe");
    iframeE.allowFullscreen = true;
    const iframeStyle = {
      border: 0,
      opacity: 0,
    };
    Object.assign(iframeE.style, iframeStyle);
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
      iframeE.style.opacity = "1";
      document.head.appendChild(style);
    };
    iframeE.src = meta.getAttribute("data-url")!;
    document.body.appendChild(iframeE);
  });
};

export default ObjectFitIframe;
