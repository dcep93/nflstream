import React from "react";
import { StreamType } from "../Fetcher";
import { getHostParams } from "../Fetcher/StreamsFetcher";
import { DelayedLog } from "../Log";
import { autoRefreshRef } from "../Options";
import msStyle from "./index.module.css";
import { Singlescreen } from "./Singlescreen";

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
  { selected: string; refreshes: { [iFrameTitle: string]: number } }
> {
  mounted = false;
  componentDidMount(): void {
    if (this.mounted) return;
    this.mounted = true;
    window.addEventListener("keydown", (e) =>
      Promise.resolve(e)
        .then((e) => e.key)
        .then((key) => parseInt(key))
        .then((index) =>
          index === 0
            ? Promise.resolve().then(() => DelayedLog.active?.updateNow())
            : Promise.resolve()
                .then(() => this.props.screens[index - 1])
                .then((screen) => screen && this.updateSelected(screen))
        )
    );
    window.addEventListener("message", (event) => {
      if (event.data.source !== "nflstream.html") return;
      console.log(event.data);
      if (event.data.action === "loaded") {
        if (event.data.iFrameTitle === this.state?.selected) {
          const ref = this.getScreen()?.ref;
          if (ref) muteUnmute(ref, false);
        }
      } else if (event.data.action === "refresh") {
        if (autoRefreshRef.current!.checked) {
          Promise.resolve(this.getScreen()).then(
            (screen) =>
              screen &&
              getHostParams(screen.raw_url, true, "").then(() =>
                this.refreshScreen(event.data.iFrameTitle)
              )
          );
        }
      }
    });
    this.setState({ selected: "" });
  }

  componentDidUpdate(): void {
    const selectedScreen = this.getScreen();
    if (!selectedScreen) {
      const screen = this.props.screens[0];
      if (screen) {
        this.setState({ selected: screen.iFrameTitle });
        if (screen) muteUnmute(screen.ref, false);
      }
    }
  }

  refreshScreen(iFrameTitle: string) {
    this.setState({
      refreshes: Object.assign({}, this.state?.refreshes, {
        [iFrameTitle]: Date.now(),
      }),
    });
  }

  getScreen() {
    return this.props.screens.find(
      (s) => s.iFrameTitle === this.state?.selected
    );
  }

  updateSelected(screen: ScreenType) {
    const selectedScreen = this.getScreen();
    if (!selectedScreen) return;
    if (screen.iFrameTitle === selectedScreen.iFrameTitle) {
      muteUnmute(screen.ref, null);
    } else {
      muteUnmute(selectedScreen.ref, true);
      muteUnmute(screen.ref, false);
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
          <div className={msStyle.screens}>
            {this.props.screens.map((screen, i) => (
              <Singlescreen
                key={screen.iFrameTitle}
                index={i + 1}
                refreshKeyValue={
                  (this.state?.refreshes || {})[screen.iFrameTitle]
                }
                refreshKeyF={() => this.refreshScreen(screen.iFrameTitle)}
                screen={screen}
                isSelected={screen === this.getScreen()}
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

function muteUnmute(
  iframeRef: React.RefObject<HTMLIFrameElement>,
  mute: boolean | null
) {
  iframeRef.current?.contentWindow?.postMessage(
    { mute, source: "nflstream" },
    "*"
  );
}

export default Multiscreen;
