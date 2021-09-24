import React, { CSSProperties } from "react";
import { StreamType } from "../firebase";
import style from "./index.module.css";

export type ScreenType = StreamType & { iFrameTitle: string };

function Multiscreen(props: {
  delete: () => void;
  screen: ScreenType;
  numScreens: number;
}) {
  const ref: React.RefObject<HTMLImageElement> = React.createRef();
  const iframeRef: React.RefObject<HTMLIFrameElement> = React.createRef();
  return (
    <div className={style.screen_wrapper} style={getStyle(props.numScreens)}>
      <div onClick={props.delete}>{props.screen.name}</div>
      <div className={style.screen_helper}>
        <div className={style.screen}>
          <iframe
            ref={iframeRef}
            className={style.iframe}
            title={props.screen.iFrameTitle}
            src={props.screen.url}
            onLoad={() => {
              ref.current!.src = `http://lorempixel.com/${
                iframeRef.current!.offsetWidth
              }/${iframeRef.current!.offsetHeight}`;
            }}
          ></iframe>
          <img
            className={style.screen_sizer}
            ref={ref}
            alt={""}
            onLoad={() => {
              console.log("loaded img");
            }}
          ></img>
        </div>
      </div>
    </div>
  );
}

function getStyle(numScreens: number): CSSProperties {
  const columns = Math.ceil(Math.sqrt(numScreens));
  const basis = `${Math.floor(100 / columns)}%`;
  return { flexBasis: basis, height: basis };
}

export default Multiscreen;
