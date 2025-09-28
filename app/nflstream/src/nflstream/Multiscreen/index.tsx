import React from "react";
import { autoRefreshRef, displayLogRef, remoteRef } from "../etc/Options";
import { onUpdateRemote, updateRemote } from "../etc/Remote";
import { StreamType } from "../Fetcher";
import { fetchE } from "../Fetcher/LogFetcher";
import { DRIVER } from "../Fetcher/StreamsFetcher";
import { DelayedLog } from "../Log";
import msStyle from "./index.module.css";
import { updateScoreboardNow } from "./Scoreboard";
import { Singlescreen } from "./Singlescreen";

export var refreshMultiscreen = () => {};

export type ScreenType = StreamType & {
  iFrameTitle: string;
  ref: React.RefObject<HTMLIFrameElement>;
};

class Multiscreen extends React.Component<
  {
    screens: ScreenType[];
    removeScreen: (iFrameTitle: string) => void;
  },
  {
    refreshKeyValue: number;
    isUnmounted: boolean;
    unsubscribe: () => void;
    selected: string;
    src: string;
    refreshes: { [iFrameTitle: string]: number };
  }
> {
  componentDidMount(): void {
    const unsubscribe = onUpdateRemote(
      ({ src, selected }) =>
        remoteRef.current?.checked &&
        src === "remote" &&
        selected !== this.state?.selected &&
        Promise.resolve()
          .then(() =>
            this.props.screens.find((s) => s.iFrameTitle === selected)
          )
          .then((screen) => screen && this.updateSelected(screen, src))
    );
    window.addEventListener(
      "keydown",
      (e) =>
        !this.state.isUnmounted &&
        Promise.resolve(e)
          .then((e) => e.key)
          .then((key) => parseInt(key))
          .then((index) =>
            index === 0
              ? Promise.resolve()
                  .then(() => DelayedLog.active?.updateNow())
                  .then(updateScoreboardNow)
              : Promise.resolve()
                  .then(() => this.props.screens[index - 1])
                  .then(
                    (screen) => screen && this.updateSelected(screen, "keydown")
                  )
          )
    );
    window.addEventListener("message", (event) => {
      if (this.state.isUnmounted) return;
      if (event.data.source !== "nflstream.html") return;
      if (event.data.action === "loaded") {
        if (event.data.iFrameTitle === this.state?.selected) {
          const ref = this.getScreen()?.ref;
          if (ref) muteUnmute(ref, false);
        }
      } else if (event.data.action === "refresh") {
        if (autoRefreshRef.current?.checked) {
          Promise.resolve(this.getScreen()).then((screen) =>
            DRIVER.getHostParams(screen!, true).then(() =>
              this.refreshScreen(event.data.iFrameTitle)
            )
          );
        }
      } else if (event.data.action === "proxy") {
        fetchE(event.data.url, -1).then((response) =>
          this.props.screens
            .find((s) => s.iFrameTitle === event.data.iFrameTitle)
            ?.ref.current?.contentWindow?.postMessage(
              { key: event.data.key, response, source: "nflstream" },
              "*"
            )
        );
      }
    });
    refreshMultiscreen = () =>
      this.setState({
        refreshKeyValue: this.state.refreshKeyValue + 1,
      });
    this.setState({ selected: "", unsubscribe, refreshKeyValue: 0 });
  }

  componentWillUnmount(): void {
    this.state?.unsubscribe();
    // todo fix???????
    // this.setState({ isUnmounted: true });
  }

  componentDidUpdate(): void {
    const selectedScreen = this.getScreen();
    if (selectedScreen) {
      if (remoteRef.current?.checked) {
        if (this.state?.src !== "remote") {
          updateRemote({
            src: "app",
            timestamp: Date.now(),
            screens: this.props.screens.map((s) => ({
              title: s.iFrameTitle,
              name: s.name,
            })),
            selected: this.state!.selected,
          });
        }
      }
    } else {
      const screen = this.props.screens[0];
      if (screen) {
        this.setState({
          selected: screen.iFrameTitle,
          src: "componentDidUpdate",
        });
        muteUnmute(screen.ref, false);
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

  updateSelected(screen: ScreenType, src: string) {
    const selectedScreen = this.getScreen();
    if (!selectedScreen) return;
    if (screen.iFrameTitle === selectedScreen.iFrameTitle) {
      muteUnmute(screen.ref, null);
    } else {
      muteUnmute(selectedScreen.ref, true);
      muteUnmute(screen.ref, false);
      this.setState({ selected: screen.iFrameTitle, src });
    }
  }

  render() {
    return this.state?.refreshKeyValue === undefined ? null : (
      <div className={msStyle.screens_wrapper} key={this.state.refreshKeyValue}>
        {this.props.screens.length === 0 ? null : (
          <div className={msStyle.screens}>
            {this.props.screens.map((screen, i) => (
              <Singlescreen
                key={screen.iFrameTitle}
                index={i + 1}
                refreshKeyValue={
                  (this.state?.refreshes || {})[screen.iFrameTitle] || 0
                }
                refreshKeyF={() => this.refreshScreen(screen.iFrameTitle)}
                screen={screen}
                isSelected={screen === this.getScreen()}
                removeScreen={() => this.props.removeScreen(screen.iFrameTitle)}
                updateSelected={() =>
                  this.updateSelected(screen, "singlescreen")
                }
                numScreens={this.props.screens.length}
                hideLog={!screen.espnId || !displayLogRef.current?.checked}
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
