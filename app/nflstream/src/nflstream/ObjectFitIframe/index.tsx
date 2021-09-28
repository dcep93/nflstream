import { default as ofStyle } from "./index.module.css";

function ObjectFitIframe(props: { url: string; title: string }) {
  return (
    <iframe
      sandbox={"allow-scripts allow-same-origin"}
      className={ofStyle.fill}
      title={props.title}
      srcDoc={`
<style>
body {
    width: 100vw;
    height: 100vh;
    margin: 0;
    border: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}
iframe {
    border: 0;
    opacity: 0;
}
</style>
<iframe id="iframe"></iframe>
<script nonce="wli4Ie0yPhWS35TUeZ8bLQ==">
${load.toString().replace(/^function \w+/, "function load")}
document.getElementById("iframe").onload = load;
document.getElementById("iframe").src = "${props.url}";
</script>
      `}
    ></iframe>
  );
}

function load() {
  console.log("loading");
  const iframe = document.getElementById("iframe")! as HTMLIFrameElement;
  const ratioStr = iframe.offsetWidth + "/" + iframe.offsetHeight;
  const ratio = iframe.offsetWidth / iframe.offsetHeight;
  const style = document.createElement("style");
  style.innerHTML = `
      iframe {
          opacity: 1;
      }
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
  console.log(iframe.src);
  document.head.appendChild(style);
}

export default ObjectFitIframe;
