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

class Multiscreen extends React.Component<
  {
    screens: ScreenType[];
    removeScreen: (iFrameTitle: string) => void;
  },
  { selected: string }
> {
  componentDidMount(): void {
    window.addEventListener("message", (event) => {
      if (event.data === "nflstream") {
        const ref = this.getSelectedScreen()?.ref;
        if (ref) muteUnmute(ref, false);
      }
    });
  }

  componentDidUpdate(): void {
    const selectedScreen = this.getSelectedScreen();
    if (selectedScreen) muteUnmute(selectedScreen.ref, false);
  }

  getSelectedScreen() {
    return (
      this.props.screens.find((s) => s.iFrameTitle === this.state?.selected) ||
      this.props.screens[0]
    );
  }

  updateSelected(screen: ScreenType) {
    const selectedScreen = this.getSelectedScreen();
    if (screen.iFrameTitle === selectedScreen.iFrameTitle) {
      muteUnmute(screen.ref, null);
    } else {
      muteUnmute(selectedScreen.ref, true);
      this.setState({ selected: screen.iFrameTitle });
    }
  }

  render() {
    return (
      <div
        className={msStyle.screens_wrapper}
        style={{ backgroundColor: "black" }}
      >
        {this.props.screens.length === 0 ? null : (
          <div
            className={msStyle.screens}
            onKeyDown={(e) =>
              Promise.resolve(e)
                .then((e) => e.key)
                .then((key) => parseInt(key))
                .then((index) =>
                  index === 0
                    ? Promise.resolve().then(() =>
                        DelayedLog.active?.updateNow()
                      )
                    : Promise.resolve()
                        .then(() => this.props.screens[index - 1])
                        .then((screen) => screen && this.updateSelected(screen))
                )
            }
            tabIndex={0}
          >
            {this.props.screens.map((screen, i) => (
              <Singlescreen
                key={screen.iFrameTitle}
                index={i + 1}
                screen={screen}
                isSelected={screen === this.getSelectedScreen()}
                removeScreen={() => this.props.removeScreen(screen.iFrameTitle)}
                updateSelected={() => this.updateSelected(screen)}
                numScreens={this.props.screens.length}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
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
  iframeRef.current?.contentWindow!.postMessage(
    { mute, source: "nflstream" },
    "*"
  );
}

export default Multiscreen;
