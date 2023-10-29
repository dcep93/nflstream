import React, { useState } from "react";
import { StreamType } from "../Fetcher";
import { fetchP } from "../Fetcher/StreamsFetcher";
import Log, { DelayedLog } from "../Log";
import style from "../index.module.css";
import msStyle from "./index.module.css";

export type ScreenType = StreamType & {
  iFrameTitle: string;
  ref: React.RefObject<HTMLIFrameElement>;
  skipLog: boolean;
};

function Multiscreen(props: {
  backgroundColor?: string;
  screens: ScreenType[];
  removeScreen: (iFrameTitle: string) => void;
}) {
  const [selected, updateSelectedStr] = useState("");
  const selectedScreen =
    props.screens.find((s) => s.iFrameTitle === selected) || props.screens[0];
  if (selectedScreen) muteUnmute(selectedScreen.ref, false);
  function updateSelected(screen: ScreenType) {
    if (screen.iFrameTitle === selectedScreen.iFrameTitle) {
      muteUnmute(screen.ref, null);
    } else {
      muteUnmute(screen.ref, false);
      muteUnmute(selectedScreen.ref, true);
    }
    updateSelectedStr(screen.iFrameTitle);
  }

  return (
    <div
      className={msStyle.screens_wrapper}
      style={{ backgroundColor: props.backgroundColor || "black" }}
    >
      {props.screens.length === 0 ? null : (
        <div
          className={msStyle.screens}
          onKeyDown={(e) =>
            Promise.resolve(e)
              .then((e) => e.key)
              .then((key) => parseInt(key))
              .then((index) =>
                index === 0
                  ? Promise.resolve().then(() => DelayedLog.active?.updateNow())
                  : Promise.resolve()
                      .then(() => props.screens[index - 1])
                      .then((screen) => screen && updateSelected(screen))
              )
          }
          tabIndex={0}
        >
          {props.screens.map((screen, i) => (
            <Singlescreen
              key={screen.iFrameTitle}
              index={i + 1}
              screen={screen}
              isSelected={screen === selectedScreen}
              removeScreen={() => props.removeScreen(screen.iFrameTitle)}
              updateSelected={() => updateSelected(screen)}
              numScreens={props.screens.length}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Singlescreen(props: {
  index: number;
  screen: ScreenType;
  isSelected: boolean;
  removeScreen: () => void;
  updateSelected: () => void;
  numScreens: number;
}) {
  const [redZone, updateRedzone] = useState(false);
  const [bigPlay, updateBigPlay] = useState(false);
  const [drivingTeam, updateDrivingTeam] = useState<string | undefined>(
    undefined
  );
  const [xkey, updateKey] = useState(Date.now());
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
          onClick={() => {
            fetchP(props.screen.raw_url, 0);
            updateKey(Date.now());
          }}
        >
          🔄
        </span>
      </div>
      <div className={msStyle.screen}>
        <div className={msStyle.subscreen}>
          <div
            hidden={props.isSelected}
            className={msStyle.screen_mask}
            onClick={() => {
              props.updateSelected();
            }}
          ></div>
          <ObjectFitIframe
            xkey={xkey}
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
  xkey: number;
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
      <IframeWrapper screen={props.screen} key={props.xkey} />
    </div>
  );
}

function IframeWrapper(props: { screen: ScreenType; key: number }) {
  // console.log(props.screen.url);
  return (
    <div
      style={{
        flexGrow: 1,
        display: "inline-flex",
        alignItems: "center",
      }}
    >
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
          <iframe
            ref={props.screen.ref}
            sandbox={"allow-scripts allow-same-origin"}
            style={{
              height: "100%",
              width: "98%",
            }}
            title={props.screen.iFrameTitle}
            src={props.screen.url}
          ></iframe>
        </div>
      </div>
    </div>
  );
}

function muteUnmute(
  iframeRef: React.RefObject<HTMLIFrameElement>,
  mute: boolean | null
) {
  console.log(mute);
  iframeRef.current?.contentWindow!.postMessage(
    { mute, source: "nflstream" },
    "*"
  );
}

export default Multiscreen;
