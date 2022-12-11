import React from "react";
import { StreamType } from "./Fetcher";
import StreamsFetcher from "./Fetcher/StreamsFetcher";
import style from "./index.module.css";
import Menu from "./Menu";
import Multiscreen, { ScreenType } from "./Multiscreen";
import recorded_sha from "./recorded_sha";

const PASSWORD = "mustbeusedlegally";

declare global {
  interface Window {
    chrome: any;
  }
}

export const extension_id = "idejabpndfcphdflfdbionahnlnphlnf";
// export const extension_id = "jjlokcmkcepehbfepbffkmkkbnggkmje";

// const expected_version = "3.1.1";

class NFLStream extends React.Component<
  {},
  {
    backgroundColor?: string;
    streams?: StreamType[];
    screens: ScreenType[];
    hasExtension?: boolean;
    initialized?: boolean;
  }
> {
  componentDidMount() {
    console.log(recorded_sha);
    if (!window.chrome?.runtime) {
      console.log("componentDidMount", "no chrome runtime");
      this.setState({ hasExtension: false });
    } else {
      new Promise((resolve, reject) => {
        window.chrome.runtime.sendMessage(extension_id, {}, (response: any) => {
          if (response === undefined) return reject("empty response");
          // if (response < expected_version) return reject("old version");
          console.log("componentDidMount", "extension detected", response);
          this.setState({ hasExtension: true });
          resolve(null);
        });
      }).catch((err: Error) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        window.chrome.runtime.lastError;
        console.log("componentDidMount", "extension not detected", err);
        this.setState({ hasExtension: false });
      });
    }
  }

  componentDidUpdate() {
    if (!this.state?.initialized) {
      if (this.state?.streams !== undefined) {
        this.setState({
          initialized: true,
          screens: window.location.hash
            .substring(1)
            .split(",")
            .map((stream_id) =>
              this.state.streams!.find((s) => s.stream_id === stream_id)
            )
            .filter(Boolean)
            .map((stream) => streamToScreen(stream!, false)),
        });
      }
    } else {
      window.location.hash = `#${(this.state?.screens || [])
        .map((s) => s.stream_id)
        .join(",")}`;
    }
  }

  render() {
    return localStorage.getItem("password") !== PASSWORD ? (
      <Password />
    ) : this.state?.hasExtension === undefined ? null : (
      <div className={style.main}>
        <StreamsFetcher
          handleResponse={(streams) => {
            if (
              streams.map((s) => s.url).join(" ") !==
              (this.state.streams || []).map((s) => s.url).join(" ")
            ) {
              this.setState({ backgroundColor: "darkgrey" });
              setTimeout(
                () => this.setState({ backgroundColor: undefined }),
                2000
              );
            }
            this.setState({ streams });
          }}
          payload={this.state.hasExtension!}
        />
        <Menu
          addScreen={(screen) =>
            this.setState({
              screens: (this.state?.screens || []).concat(screen),
            })
          }
          streams={this.state?.streams}
        />
        <Multiscreen
          backgroundColor={this.state?.backgroundColor}
          screens={this.state?.screens || []}
          removeScreen={(iFrameTitle) =>
            this.setState({
              screens: this.state.screens.filter(
                (o) => o.iFrameTitle !== iFrameTitle
              ),
            })
          }
        />
      </div>
    );
  }
}

export function streamToScreen(
  stream: StreamType,
  skipLog: boolean
): ScreenType {
  return {
    iFrameTitle: (Math.random() + 1).toString(36).substring(2),
    skipLog,
    ref: React.createRef() as React.RefObject<HTMLIFrameElement>,
    ...stream,
  };
}

function Password() {
  const password = window.prompt("enter the password:");
  if (password) {
    localStorage.setItem("password", password);
    window.location.reload();
  }
  return null;
}

export default NFLStream;
