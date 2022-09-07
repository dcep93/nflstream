import React, { useState } from "react";
import { delayedLogComponent } from "../DelayedLog";
import { StreamType } from "../Fetcher";
import style from "../index.module.css";
import ObjectFitIframe from "../ObjectFitIframe";
import msStyle from "./index.module.css";

export type ScreenType = StreamType & { iFrameTitle: string; skipLog: boolean };
export const screenWrapperRef: React.RefObject<HTMLDivElement> =
  React.createRef();

function Multiscreen(props: {
  screens: ScreenType[];
  removeScreen: (iFrameTitle: string) => void;
}) {
  const [rawSelected, updateSelected] = useState("");
  const selected = (
    props.screens.find((s) => s.iFrameTitle === rawSelected) || props.screens[0]
  )?.iFrameTitle;
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
            <Singlescreen
              key={screen.iFrameTitle}
              screen={screen}
              selected={selected}
              iframeRefs={iframeRefs}
              removeScreen={props.removeScreen}
              updateSelected={updateSelected}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Singlescreen(props: {
  screen: ScreenType;
  iframeRefs: { [iframeTitle: string]: React.RefObject<HTMLIFrameElement> };
  selected: string;
  removeScreen: (iframeTitle: string) => void;
  updateSelected: (iframeTitle: string) => void;
}) {
  const screenTitleParts = [props.screen.name];
  const drive = ((
    (delayedLogComponent?.state?.logs || []).find(
      (l) => l.name === props.screen.name
    ) || {}
  ).playByPlay || [])[0];
  if (drive) {
    screenTitleParts[
      props.screen.name.endsWith(drive.team) ? "push" : "unshift"
    ]("🏈");
  }
  const screenTitle = screenTitleParts.join(" ");
  const numScreens = Object.keys(props.iframeRefs).length;
  return (
    <div
      style={{
        width:
          props.selected === props.screen.iFrameTitle
            ? "100%"
            : `${100 / (numScreens - 1)}%`,
      }}
      className={[
        props.selected === props.screen.iFrameTitle && msStyle.selected_screen,
        props.selected !== props.screen.iFrameTitle &&
          msStyle.unselected_screen,
        msStyle.screen_wrapper,
      ].join(" ")}
    >
      <div
        className={[msStyle.title, style.hover].join(" ")}
        onClick={() => props.removeScreen(props.screen.iFrameTitle)}
      >
        {screenTitle}
      </div>
      <div className={msStyle.screen}>
        <div className={msStyle.subscreen}>
          <div
            hidden={props.selected === props.screen.iFrameTitle}
            className={msStyle.screen_mask}
            onClick={() => {
              muteUnmute(props.iframeRefs[props.screen.iFrameTitle]!, false);
              muteUnmute(props.iframeRefs[props.selected]!, true);
              props.updateSelected(props.screen.iFrameTitle);
            }}
          ></div>
          <ObjectFitIframe
            iframeRef={props.iframeRefs[props.screen.iFrameTitle]}
            url={props.screen.url}
            name={props.screen.name}
            skipLog={
              props.screen.skipLog ||
              (numScreens > 1 && props.selected !== props.screen.iFrameTitle)
            }
          />
        </div>
      </div>
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
  ).contentWindow!.postMessage({ mute, source: "nflstream" }, "*");
}

export default Multiscreen;
