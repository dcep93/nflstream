import { useState } from "react";
import { ScreenType } from ".";
import { getHostParams, HOST } from "../Fetcher/StreamsFetcher";
import Log from "../Log";
import HostSrcDoc from "./HostSrcDoc";

import React from "react";
import style from "../index.module.css";
import msStyle from "./index.module.css";
import Scoreboard, { SCOREBOARD_SRC } from "./Scoreboard";

export const REDZONE_STREAM_ID = "redzone";

export function Singlescreen(props: {
  index: number;
  screen: ScreenType;
  isSelected: boolean;
  removeScreen: () => void;
  updateSelected: () => void;
  numScreens: number;
  refreshKeyValue: number | undefined;
  refreshKeyF: () => void;
}) {
  console.log(props.screen);
  const [redZone, updateRedzone] = useState(false);
  const [bigPlay, updateBigPlay] = useState(false);
  const [drivingTeam, updateDrivingTeam] = useState<string | undefined>(
    undefined
  );
  const screenTitleParts = [props.screen.name];
  if (drivingTeam) {
    screenTitleParts[
      props.screen.name.endsWith(drivingTeam) ? "push" : "unshift"
    ]("🏈");
  }
  const screenTitle = screenTitleParts.join(" ");
  return (
    <div
      style={{
        width: props.isSelected ? "100%" : `${100 / (props.numScreens - 1)}%`,
      }}
      className={[
        props.isSelected && msStyle.selected_screen,
        msStyle.screen_wrapper,
      ].join(" ")}
    >
      <div
        className={msStyle.title}
        style={{
          backgroundColor: redZone
            ? "maroon"
            : bigPlay && !props.isSelected
            ? "steelblue"
            : undefined,
        }}
      >
        <span className={style.hover} onClick={() => props.removeScreen()}>
          ({props.index}) {screenTitle}
        </span>{" "}
        <span
          className={style.hover}
          style={{ filter: "grayscale(100%)" }}
          onClick={() => {
            Promise.resolve()
              .then(() =>
                props.screen.src === HOST
                  ? getHostParams(props.screen.raw_url, true, "")
                  : Promise.resolve({})
              )
              .then(() => props.refreshKeyF());
          }}
        >
          🔄
        </span>
      </div>
      <div className={msStyle.screen}>
        <div className={msStyle.subscreen}>
          <div
            hidden={props.isSelected || props.screen.src === SCOREBOARD_SRC}
            className={msStyle.screen_mask}
            onClick={() => {
              props.updateSelected();
            }}
          ></div>
          <ObjectFitIframe
            xkey={props.refreshKeyValue}
            screen={props.screen}
            updateBigPlay={updateBigPlay}
            updateDrivingTeam={updateDrivingTeam}
            updateRedzone={updateRedzone}
            isSelected={props.isSelected}
          />
        </div>
      </div>
    </div>
  );
}

function ObjectFitIframe(props: {
  screen: ScreenType;
  xkey: number | undefined;
  updateDrivingTeam: (drivingTeam: string) => void;
  updateRedzone: (redZone: boolean) => void;
  updateBigPlay: (isBigPlay: boolean) => void;
  isSelected: boolean;
}) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        justifyContent: "space-around",
      }}
    >
      {!props.screen.espnId || props.screen.skipLog ? null : (
        <Log
          espnId={props.screen.espnId!}
          updateBigPlay={props.updateBigPlay}
          updateDrivingTeam={props.updateDrivingTeam}
          updateRedzone={props.updateRedzone}
          isSelected={props.isSelected}
        />
      )}
      <IframeWrapper
        screen={props.screen}
        key={props.xkey?.toString() || props.screen.iFrameTitle}
      />
    </div>
  );
}

function IframeWrapper(props: { screen: ScreenType; key: string }) {
  return (
    <div
      style={{
        flexGrow: 1,
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {props.screen.src === HOST ? (
        <div
          style={{
            width: "100%",
            maxHeight: "100%",
            position: "relative",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              marginTop: "56.25%",
            }}
          ></div>
          <div
            style={{
              maxWidth: "100%",
              height: "100%",
              position: "absolute",
              aspectRatio: "160 / 90",
              // border: "1px solid lightgray",
            }}
          >
            <MemoizedHostStreamIFrame {...props} />
          </div>
        </div>
      ) : props.screen.src === SCOREBOARD_SRC ? (
        <Scoreboard />
      ) : (
        <iframe
          ref={props.screen.ref}
          src={props.screen.raw_url}
          title={props.screen.iFrameTitle}
        />
      )}
    </div>
  );
}

const MemoizedHostStreamIFrame = React.memo(
  (props: { screen: ScreenType }) => <HostStreamIFrame screen={props.screen} />,
  (prevProps, currProps) =>
    prevProps.screen.iFrameTitle === currProps.screen.iFrameTitle
);

function HostStreamIFrame(props: { screen: ScreenType }) {
  const [params, updateParams] = useState<{ [key: string]: string } | null>(
    null
  );
  if (params === null) {
    getHostParams(props.screen.raw_url, false, props.screen.iFrameTitle).then(
      updateParams
    );
  }
  return (
    <>
      {params !== null && (
        <iframe
          ref={props.screen.ref}
          style={{
            height: "100%",
            width: "98%",
          }}
          title={props.screen.iFrameTitle}
          srcDoc={HostSrcDoc(params)}
        ></iframe>
      )}
    </>
  );
}
