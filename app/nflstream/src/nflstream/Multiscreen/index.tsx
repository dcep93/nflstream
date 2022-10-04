import React, { useState } from "react";
import { StreamType } from "../Fetcher";
import style from "../index.module.css";
import Log from "../Log";
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
  const [selected, updateSelected] = useState("");
  const selectedScreen =
    props.screens.find((s) => s.iFrameTitle === selected) || props.screens[0];
  if (selectedScreen) muteUnmute(selectedScreen.ref, false);
  return (
    <div
      className={msStyle.screens_wrapper}
      style={{ backgroundColor: props.backgroundColor || "black" }}
    >
      {props.screens.length === 0 ? null : (
        <div className={msStyle.screens}>
          {props.screens.map((screen, i) => (
            <Singlescreen
              key={screen.iFrameTitle}
              screen={screen}
              isSelected={screen === selectedScreen}
              removeScreen={() => props.removeScreen(screen.iFrameTitle)}
              updateSelected={() => {
                muteUnmute(screen.ref, false);
                muteUnmute(selectedScreen.ref, true);
                updateSelected(screen.iFrameTitle);
              }}
              numScreens={props.screens.length}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Singlescreen(props: {
  screen: ScreenType;
  isSelected: boolean;
  removeScreen: () => void;
  updateSelected: () => void;
  numScreens: number;
}) {
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
      <div className={msStyle.title}>
        <span className={style.hover} onClick={() => props.removeScreen()}>
          {screenTitle}
        </span>{" "}
        <span className={style.hover} onClick={() => updateKey(Date.now())}>
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
            updateDrivingTeam={updateDrivingTeam}
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
          updateDrivingTeam={props.updateDrivingTeam}
          isSelected={props.isSelected}
        />
      )}
      <IframeWrapper screen={props.screen} key={props.xkey} />
    </div>
  );
}

function IframeWrapper(props: { screen: ScreenType; key: number }) {
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
            aspectRatio: "16 / 9",
            // border: "1px solid lightgray",
          }}
        >
          <iframe
            ref={props.screen.ref}
            sandbox={"allow-scripts allow-same-origin"}
            style={{
              height: "100%",
              width: "100%",
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
  mute: boolean
) {
  iframeRef.current?.contentWindow!.postMessage(
    { mute, source: "nflstream" },
    "*"
  );
}

export default Multiscreen;
