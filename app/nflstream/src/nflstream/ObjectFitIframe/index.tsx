import React, { useState } from "react";
import { default as ofStyle } from "./index.module.css";

function ObjectFitIframe(props: { url: string; title: string }) {
  const imgRef: React.RefObject<HTMLImageElement> = React.createRef();
  const iframeRef: React.RefObject<HTMLIFrameElement> = React.createRef();

  const [isVisible, updateVisible] = useState(false);

  return (
    <div className={ofStyle.sub_screen}>
      <div className={[ofStyle.sized].join(" ")}>
        <iframe
          sandbox={"allow-scripts allow-same-origin"}
          ref={iframeRef}
          hidden={isVisible}
          className={[
            ofStyle.iframe,
            isVisible ? ofStyle.full : ofStyle.invisible,
          ].join(" ")}
          title={props.title}
          src={props.url}
          onLoad={() => {
            imgRef.current!.src = `http://placekitten.com/${
              iframeRef.current!.offsetWidth
            }/${iframeRef.current!.offsetHeight}`;
          }}
        ></iframe>
        <img
          onLoad={() => updateVisible(true)}
          ref={imgRef}
          alt={""}
          className={ofStyle.sizer}
        ></img>
      </div>
    </div>
  );
}

export default ObjectFitIframe;
