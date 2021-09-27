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

  const [isVisible, updateVisible] = useState(false);

  return (
    <div className={msStyle.screen_wrapper} style={props.wrapperStyle}>
      <div
        className={[msStyle.title, style.hover].join(" ")}
        ref={titleRef}
        onClick={props.delete}
      >
        {props.screen.name}
      </div>
      <div className={msStyle.screen}>
        <div className={msStyle.sub_screen}>
          <div className={[msStyle.sized].join(" ")}>
            <iframe
              sandbox={"allow-scripts allow-same-origin"}
              ref={iframeRef}
              hidden={isVisible}
              className={[
                msStyle.iframe,
                isVisible ? msStyle.full : msStyle.invisible,
              ].join(" ")}
              title={props.screen.name}
              src={props.screen.url}
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
              className={msStyle.sizer}
            ></img>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Multiscreen;
