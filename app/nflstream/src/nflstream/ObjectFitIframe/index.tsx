import { CSSProperties } from "react";
import { default as ofStyle } from "./index.module.css";

function ObjectFitIframe(props: {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  url: string;
  title: string;
}) {
  return (
    <iframe
      ref={props.iframeRef}
      sandbox={"allow-scripts allow-same-origin"}
      className={ofStyle.fill}
      title={props.title}
      srcDoc={`
<meta data-url="${props.url}" data-title="${props.title}" />
<script>
(${script.toString()})();
</script>
      `}
    ></iframe>
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
