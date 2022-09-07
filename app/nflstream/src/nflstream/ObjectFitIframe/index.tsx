import Log from "../Log";
import { ScreenType } from "../Multiscreen";

function ObjectFitIframe(props: {
  screen: ScreenType;
  hiddenLog: boolean;
  updateDrivingTeam: (drivingTeam: string) => void;
}) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
      }}
    >
      {props.screen.skipLog ? null : (
        <Log
          espnId={props.screen.espnId}
          updateDrivingTeam={props.updateDrivingTeam}
          hidden={props.hiddenLog}
        />
      )}
      <iframe
        ref={props.screen.ref}
        sandbox={"allow-scripts allow-same-origin"}
        style={{ flexGrow: 1 }}
        title={props.screen.name}
        srcDoc={`
<meta data-url="${props.screen.url}" />
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
