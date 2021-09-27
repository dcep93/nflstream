import React, { CSSProperties, useState } from "react";
import { StreamType } from "../../firebase";
import { default as style } from "../index.module.css";
import { default as msStyle } from "./index.module.css";

export type ScreenType = StreamType & { iFrameTitle: string };

function Multiscreen(props: {
  screens: ScreenType[];
  removeScreen: (index: number) => void;
}) {
  const basis = `${Math.floor(
    100 / Math.ceil(Math.sqrt(props.screens.length))
  )}%`;
  const wrapperStyle: CSSProperties = { width: basis, height: basis };
  return (
    <div className={msStyle.screens_wrapper}>
      {props.screens.length && (
        <div className={msStyle.screens}>
          {props.screens.map((screen, i) => (
            <Singlescreen
              key={screen.iFrameTitle}
              screen={screen}
              delete={() => props.removeScreen(i)}
              wrapperStyle={Object.assign(
                { zIndex: props.screens.length - i },
                wrapperStyle
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Singlescreen(props: {
  delete: () => void;
  screen: ScreenType;
  wrapperStyle: CSSProperties;
}) {
  const titleRef: React.RefObject<HTMLDivElement> = React.createRef();
  const imgRef: React.RefObject<HTMLImageElement> = React.createRef();
  const iframeRef: React.RefObject<HTMLIFrameElement> = React.createRef();

  const [isFull, updateFull] = useState(false);
  const [isTall, updateTall] = useState(true);

  return (
    <div className={msStyle.screen_wrapper} style={props.wrapperStyle}>
      <div
        className={[msStyle.title, style.hover].join(" ")}
        ref={titleRef}
        onClick={props.delete}
      >
        {props.screen.name} {isTall ? "tall" : "wide"}{" "}
        {isFull ? "full" : "nofull"}
      </div>
      <div className={msStyle.screen}>
        <div className={[msStyle.sized, isTall && msStyle.tall].join(" ")}>
          <iframe
            sandbox={"allow-scripts allow-same-origin"}
            ref={iframeRef}
            className={[
              msStyle.iframe,
              isFull && msStyle.full,
              !isFull && msStyle.invisible,
            ].join(" ")}
            title={props.screen.iFrameTitle}
            src={props.screen.url}
            onLoad={() => {
              var ratio = `${iframeRef.current!.offsetWidth}/${
                iframeRef.current!.offsetHeight
              }`;
              ratio = "400/100";
              imgRef.current!.src = `http://placekitten.com/${ratio}`;
              const match = window.matchMedia(`(max-aspect-ratio: ${ratio})`);
              updateTall(match.matches);
              match.addEventListener("change", (e) => {
                updateTall(e.matches);
              });
            }}
          ></iframe>
          <img
            onLoad={() => updateFull(true)}
            ref={imgRef}
            alt={""}
            className={msStyle.sizer}
          ></img>
        </div>
      </div>
    </div>
  );
}

export default Multiscreen;
