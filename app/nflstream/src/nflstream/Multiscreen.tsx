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
              wrapperStyle={wrapperStyle}
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
  const divRef: React.RefObject<HTMLDivElement> = React.createRef();
  const imgRef: React.RefObject<HTMLImageElement> = React.createRef();
  const iframeRef: React.RefObject<HTMLIFrameElement> = React.createRef();

  const [visible, update] = useState(false);

  return (
    <div className={style.screen_wrapper} style={props.wrapperStyle}>
      <div onClick={props.delete}>{props.screen.name}</div>
      <div className={style.screen_helper}>
        <div className={style.screen}>
          <div className={style.iframe_wrapper}>
            <div className={style.what}>
              <div
                className={visible ? style.hmm : style.invisble}
                ref={divRef}
              >
                <iframe
                  ref={iframeRef}
                  className={style.iframe}
                  title={props.screen.iFrameTitle}
                  src={props.screen.url}
                  onLoad={() => {
                    imgRef.current!.src = `http://lorempixel.com/${
                      iframeRef.current!.offsetWidth
                    }/${iframeRef.current!.offsetHeight}`;
                  }}
                ></iframe>
                <img
                  onLoad={() => update(true)}
                  ref={imgRef}
                  alt={""}
                  className={style.iframe_sizer}
                ></img>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Multiscreen;
