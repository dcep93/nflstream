import { CSSProperties } from "react";
import { nflstream_url } from "../Extension";
import { default as ofStyle } from "./index.module.css";

function ObjectFitIframe(props: {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  url: string;
  title: string;
  chat: string | undefined;
}) {
  return (
    <div className={ofStyle.container}>
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
      {props.chat === undefined ? null : (
        <iframe
          className={ofStyle.live_chat}
          title={`${props.title}_live_chat`}
          src={`${nflstream_url}live_chat.html?chat=${props.chat}`}
        ></iframe>
      )}
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
