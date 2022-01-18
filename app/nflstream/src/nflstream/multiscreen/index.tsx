import React, { useState } from "react";
import { StreamType } from "../../firebase";
import { delayedLogComponent } from "../DelayedLog";
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
  const screenRefs = Object.fromEntries(
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
            <Singlescreen
              key={screen.iFrameTitle}
              i={i}
              screenRefs={screenRefs}
              iframeRefs={iframeRefs}
              screen={screen}
              selected={selected}
              screens={props.screens}
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
  i: number;
  screen: ScreenType;
  screenRefs: { [iframeTitle: string]: React.RefObject<HTMLDivElement> };
  iframeRefs: { [iframeTitle: string]: React.RefObject<HTMLIFrameElement> };
  selected: string;
  screens: ScreenType[];
  removeScreen: (index: number) => void;
  updateSelected: (iframeTitle: string) => void;
}) {
  const screenTitleParts = props.screen.name.split(" vs ");
  screenTitleParts.splice(1, 0, "vs");
  const drive = ((
    (delayedLogComponent?.state?.logs || []).find(
      (l) =>
        l.name.replace("Washington", "Washington Football Team") ===
        props.screen.name
    ) || {}
  ).playByPlay || [])[0];
  if (drive) {
    const firstTeamHasBall = screenTitleParts[0].endsWith(drive.team);
    screenTitleParts.splice(firstTeamHasBall ? 0 : 3, 0, "🏈");
  }
  const screenTitle = screenTitleParts.join(" ");
  return (
    <div
      key={props.screen.iFrameTitle}
      style={{
        width:
          props.selected === props.screen.iFrameTitle
            ? "100%"
            : `${100 / (props.screens.length - 1)}%`,
      }}
      className={[
        props.screens.length > 1 &&
          props.selected === props.screen.iFrameTitle &&
          msStyle.selected_screen,
        props.selected !== props.screen.iFrameTitle &&
          msStyle.unselected_screen,
        msStyle.screen_wrapper,
      ].join(" ")}
    >
      <div
        className={[msStyle.title, style.hover].join(" ")}
        onClick={() => props.removeScreen(props.i)}
      >
        {screenTitle}
      </div>
      <div
        className={msStyle.screen}
        ref={props.screenRefs[props.screen.iFrameTitle]}
      >
        <div className={msStyle.subscreen}>
          <div
            hidden={props.selected === props.screen.iFrameTitle}
            className={msStyle.screen_mask}
            onClick={() => {
              const height =
                props.screenRefs[props.selected]!.current!.style.height;
              props.screenRefs[props.selected]!.current!.style.height =
                "initial";
              props.screenRefs[
                props.screen.iFrameTitle
              ]!.current!.style.height = height;
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
              (props.screens.length > 1 &&
                props.selected !== props.screen.iFrameTitle)
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
  ).contentWindow!.postMessage({ mute }, "*");
}

export default Multiscreen;
