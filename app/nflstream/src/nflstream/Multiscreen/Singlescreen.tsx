import { useEffect, useState } from "react";
import { ScreenType } from ".";
import { DRIVER, HOST } from "../Fetcher/StreamsFetcher";
import Log from "../Log";

import { displayLogRef } from "../etc/Options";
import style from "../index.module.css";
import msStyle from "./index.module.css";
import Scoreboard, { SCOREBOARD_SRC } from "./Scoreboard";

export function Singlescreen(props: {
  index: number;
  screen: ScreenType;
  isSelected: boolean;
  removeScreen: () => void;
  updateSelected: () => void;
  numScreens: number;
  refreshKeyValue: number;
  refreshKeyF: () => void;
}) {
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
                  ? DRIVER.getHostParams(props.screen, true)
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
            updateBigPlay={updateBigPlay}
            updateDrivingTeam={updateDrivingTeam}
            updateRedzone={updateRedzone}
            {...props}
          />
        </div>
      </div>
    </div>
  );
}

function ObjectFitIframe(props: {
  screen: ScreenType;
  refreshKeyValue: number;
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
      {true ||
      !props.screen.espnId ||
      !displayLogRef.current?.checked ? null : (
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
        refreshKeyValue={props.refreshKeyValue}
      />
    </div>
  );
}

function IframeWrapper(props: { screen: ScreenType; refreshKeyValue: number }) {
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
            <HostStreamIFrame {...props} />
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

function HostStreamIFrame(props: {
  screen: ScreenType;
  refreshKeyValue: number;
}) {
  const [iframeE, updateIframeE] = useState<JSX.Element | null>(null);
  useEffect(
    () => {
      DRIVER.getHostParams(props.screen, false)
        .then((params) => ({
          ...params,
          iFrameTitle: props.screen.iFrameTitle,
        }))
        .then((params) => (
          <iframe
            key={props.refreshKeyValue}
            ref={props.screen.ref}
            style={{
              height: "100%",
              width: "98%",
            }}
            title={props.screen.iFrameTitle}
            srcDoc={DRIVER.getSrcDoc(params)}
          ></iframe>
        ))
        .then((ife) => updateIframeE(ife));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.refreshKeyValue]
  );
  return <>{iframeE}</>;
}
