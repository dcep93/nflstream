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
        props.numScreens > 1 &&
          (props.isSelected
            ? msStyle.selected_screen
            : msStyle.unselected_screen),
        msStyle.screen_wrapper,
      ].join(" ")}
    >
      <div className={msStyle.title}>
        <span className={style.hover} onClick={() => props.removeScreen()}>
          {screenTitle}
        </span>{" "}
        <span
          className={style.hover}
          onClick={() =>
            props.screen.ref.current!.contentWindow?.location.reload()
          }
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
  updateDrivingTeam: (drivingTeam: string) => void;
  isSelected: boolean;
}) {
  const [width, height] = [812, 477]; // on weakstreams, height is dynamic
  const ratioStr = width + "/" + height;
  const ratio = width / height;
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
      }}
    >
      {!props.screen.espnId || props.screen.skipLog ? null : (
        <Log
          espnId={props.screen.espnId!}
          updateDrivingTeam={props.updateDrivingTeam}
          isSelected={props.isSelected}
        />
      )}
      <iframe
        ref={props.screen.ref}
        sandbox={"allow-scripts allow-same-origin"}
        style={{ flexGrow: 1 }}
        title={props.screen.name}
        srcDoc={`
        <head>
          <style>
            body {
              width: 100vw;
              height: 100vh;
              margin: 0;
              border: 0;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            @media (min-aspect-ratio: ${ratioStr}) {
              iframe {
                height: 100vh;
                width: ${100 * ratio}vh;
              }
            }
            @media (max-aspect-ratio: ${ratioStr}) {
              iframe {
                width: 100vw;
                height: ${100 / ratio}vw;
              }
            }
          </style>
        </head>
        <body>
            <iframe style="border: 0" src="${props.screen.url}">
        </body>
        `}
      ></iframe>
    </div>
  );
}

function muteUnmute(
  iframeRef: React.RefObject<HTMLIFrameElement>,
  mute: boolean
) {
  (
    iframeRef.current?.contentWindow!.document.getElementsByTagName(
      "iframe"
    )[0] as HTMLIFrameElement
  )?.contentWindow!.postMessage({ mute, source: "nflstream" }, "*");
}

export default Multiscreen;
