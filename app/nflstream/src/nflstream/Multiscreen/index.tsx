import React from "react";
import { autoRefreshRef, remoteRef } from "../etc/Options";
import { onUpdateRemote, updateRemote } from "../etc/Remote";
import { StreamType } from "../Fetcher";
import { fetchE } from "../Fetcher/LogFetcher";
import { DRIVER } from "../Fetcher/StreamsFetcher";
import { DelayedLog } from "../Log";
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
    hasExtension: boolean;
  },
  {
    selected: string;
    src: string;
    refreshes: { [iFrameTitle: string]: number };
  }
> {
  mounted = false;
  componentDidMount(): void {
    if (this.mounted) return;
    this.mounted = true;
    onUpdateRemote(
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
    window.addEventListener("keydown", (e) =>
      Promise.resolve(e)
        .then((e) => e.key)
        .then((key) => parseInt(key))
        .then((index) =>
          index === 0
            ? Promise.resolve().then(() => DelayedLog.active?.updateNow())
            : Promise.resolve()
                .then(() => this.props.screens[index - 1])
                .then(
                  (screen) => screen && this.updateSelected(screen, "keydown")
                )
        )
    );
    window.addEventListener("message", (event) => {
      if (event.data.source !== "nflstream.html") return;
      console.log(new Date(), event.data);
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
        fetchE(event.data.url, 0).then((response) => {
          const ref = this.getScreen()?.ref;
          if (ref)
            ref.current?.contentWindow?.postMessage(
              { key: event.data.key, response, source: "nflstream" },
              "*"
            );
        });
      }
    });
    this.setState({ selected: "" });
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
                hasExtension={this.props.hasExtension}
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
