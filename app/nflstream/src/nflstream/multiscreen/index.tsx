import React, { useState } from "react";
import { StreamType } from "../../firebase";
import style from "../index.module.css";
import ObjectFitIframe from "../ObjectFitIframe";
import msStyle from "./index.module.css";

export type ScreenType = StreamType & { iFrameTitle: string; skipLog: boolean };
export const screenWrapperRef: React.RefObject<HTMLDivElement> =
  React.createRef();

function Multiscreen(props: {
  screens: ScreenType[];
  removeScreen: (index: number) => void;
}) {
  const [rawSelected, updateSelected] = useState("");
  const selected =
    props.screens.find((s) => s.iFrameTitle === rawSelected)?.iFrameTitle ||
    props.screens[0]?.iFrameTitle;
  const refs = Object.fromEntries(
    props.screens.map((s) => [
      s.iFrameTitle,
      React.createRef() as React.RefObject<HTMLDivElement>,
    ])
  );
  const iframeRefs = Object.fromEntries(
    props.screens.map((s) => [
      s.iFrameTitle,
      React.createRef() as React.RefObject<HTMLIFrameElement>,
    ])
  );
  return (
    <div ref={screenWrapperRef} className={msStyle.screens_wrapper}>
      {props.screens.length === 0 ? null : (
        <div className={msStyle.screens}>
          {props.screens.map((screen, i) => (
            <div
              key={screen.iFrameTitle}
              style={{
                width:
                  selected === screen.iFrameTitle
                    ? "100%"
                    : `${100 / (props.screens.length - 1)}%`,
              }}
              className={[
                props.screens.length > 1 &&
                  selected === screen.iFrameTitle &&
                  msStyle.selected_screen,
                selected !== screen.iFrameTitle && msStyle.unselected_screen,
                msStyle.screen_wrapper,
              ].join(" ")}
            >
              <div
                className={[msStyle.title, style.hover].join(" ")}
                onClick={() => props.removeScreen(i)}
              >
                {screen.name}
              </div>
              <div className={msStyle.screen} ref={refs[screen.iFrameTitle]}>
                <div className={msStyle.subscreen}>
                  <div
                    hidden={selected === screen.iFrameTitle}
                    className={msStyle.screen_mask}
                    onClick={() => {
                      const height = refs[selected]!.current!.style.height;
                      refs[selected]!.current!.style.height = "initial";
                      refs[screen.iFrameTitle]!.current!.style.height = height;
                      muteUnmute(iframeRefs[screen.iFrameTitle]!, false);
                      muteUnmute(iframeRefs[selected]!, true);
                      updateSelected(screen.iFrameTitle);
                    }}
                  ></div>
                  <ObjectFitIframe
                    iframeRef={iframeRefs[screen.iFrameTitle]}
                    url={screen.url}
                    name={screen.name}
                    skipLog={
                      screen.skipLog ||
                      (props.screens.length > 1 &&
                        selected !== screen.iFrameTitle)
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function muteUnmute(
  iframeRef: React.RefObject<HTMLIFrameElement>,
  mute: boolean
) {
  (
    iframeRef.current!.contentWindow!.document.getElementsByTagName(
      "iframe"
    )[0] as HTMLIFrameElement
  ).contentWindow!.postMessage({ mute }, "*");
}

export default Multiscreen;
