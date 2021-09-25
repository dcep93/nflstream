import React, { CSSProperties, useState } from "react";
import { StreamType } from "../firebase";
import style from "./index.module.css";

export type ScreenType = StreamType & { iFrameTitle: string };

function Multiscreen(props: {
  screens: ScreenType[];
  removeScreen: (index: number) => void;
}) {
  const basis = `${Math.floor(
    100 / Math.ceil(Math.sqrt(props.screens.length))
  )}%`;
  const wrapperStyle: CSSProperties = { flexBasis: basis, height: basis };
  return (
    <div className={style.screens_wrapper}>
      {props.screens.length && (
        <div className={style.screens}>
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
  const [isWide, updateWide] = useState(false);

  return (
    <div className={style.screen_wrapper} style={props.wrapperStyle}>
      <div className={style.screen_title} ref={titleRef} onClick={props.delete}>
        {props.screen.name}
      </div>
      <div className={style.screen}>
        <div
          className={[
            style.sized_screen,
            isWide ? style.wide : style.tall,
          ].join(" ")}
        >
          <iframe
            sandbox={"allow-scripts allow-same-origin"}
            ref={iframeRef}
            className={[
              style.iframe,
              isFull && style.full,
              !isFull && style.invisible,
            ].join(" ")}
            title={props.screen.iFrameTitle}
            src={props.screen.url}
            onLoad={() => {
              const ratio = `${iframeRef.current!.offsetWidth}/${
                iframeRef.current!.offsetHeight
              }`;
              imgRef.current!.src = `http://lorempixel.com/${ratio}`;
              const match = window.matchMedia(`(min-aspect-ratio: ${ratio})`);
              updateWide(match.matches);
              match.addEventListener("change", (e) => {
                updateWide(e.matches);
              });
            }}
          ></iframe>
          <img
            onLoad={() => updateFull(true)}
            ref={imgRef}
            alt={""}
            className={style.iframe_sizer}
          ></img>
        </div>
      </div>
    </div>
  );
}

export default Multiscreen;
