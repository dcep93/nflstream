import { default as ofStyle } from "./index.module.css";

function ObjectFitIframe(props: { url: string; title: string }) {
  return (
    <iframe
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
<script>
${load}
</script>
<iframe id="iframe" src="${props.url}" onload="load()" />
      `}
    ></iframe>
  );
}

function load() {
  console.log("loading");
  const iframe = document.getElementById("iframe")!;
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
  console.log(style.innerHTML);
  document.head.appendChild(style);
}

export default ObjectFitIframe;
