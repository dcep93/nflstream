import React, { useEffect } from "react";
import { StreamType } from "./Fetcher";
import StreamsFetcher from "./Fetcher/StreamsFetcher";
import Menu from "./Menu";
import Multiscreen, { ScreenType } from "./Multiscreen";
import style from "./index.module.css";
import recorded_sha from "./recorded_sha";

const mustbeusedlegally = "mustbeusedlegally";

declare global {
  interface Window {
    chrome: any;
  }
}

export function clog<T>(t: T): T {
  console.log(t);
  return t;
}

// export const extension_id = "idejabpndfcphdflfdbionahnlnphlnf"; // local
export const extension_id = "jjlokcmkcepehbfepbffkmkkbnggkmje";

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

  getHashedScreens() {
    return window.location.hash
      .substring(1)
      .split(",")
      .map((stream_id) =>
        this.state.streams!.find((s) => s.stream_id === stream_id)
      )
      .filter(Boolean)
      .map((stream) => streamToScreen(stream!, false));
  }

  componentDidUpdate() {
    if (this.state?.initialized === undefined) {
      if (this.state?.streams !== undefined) {
        const screens = this.getHashedScreens();
        if (screens.length === 0) {
          this.setState({ initialized: true, screens });
        } else {
          this.setState({ initialized: false });
        }
      }
    } else if (this.state.initialized) {
      window.location.hash = `#${(this.state?.screens || [])
        .map((s) => s.stream_id)
        .join(",")}`;
    }
  }

  render() {
    const ref = React.createRef<StreamsFetcher>();
    const handleResponse = (streams: StreamType[]) => {
      this.setState({ streams });
    };
    return localStorage.getItem("mustbeusedlegally") !== mustbeusedlegally ? (
      <Mustbeusedlegally />
    ) : this.state?.hasExtension === undefined ? null : (
      <div className={style.main} style={{ backgroundColor: "black" }}>
        <StreamsFetcher
          ref={ref}
          handleResponse={handleResponse}
          payload={this.state.hasExtension!}
        />
        <Menu
          refreshStreams={() => ref.current!.getResponse().then(handleResponse)}
          addScreen={(screen) =>
            this.setState({
              screens: (this.state?.screens || []).concat(screen),
            })
          }
          streams={this.state?.streams}
        />
        {this.state.initialized === false ? (
          <ForceInteract
            interact={() =>
              this.state?.initialized ||
              this.setState({
                initialized: true,
                screens: this.getHashedScreens(),
              })
            }
          />
        ) : (
          <Multiscreen
            screens={this.state?.screens || []}
            removeScreen={(iFrameTitle) =>
              this.setState({
                screens: this.state.screens.filter(
                  (o) => o.iFrameTitle !== iFrameTitle
                ),
              })
            }
          />
        )}
      </div>
    );
  }
}

function ForceInteract(props: { interact: () => void }) {
  useEffect(() => {
    function handleKeyDown() {
      props.interact();
      document.removeEventListener("keydown", handleKeyDown);
    }
    document.addEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div
      style={{ color: "white" }}
      // onClick={() => props.interact()}
    >
      press enter to resume
    </div>
  );
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

function Mustbeusedlegally() {
  const mustbeusedlegally = window.prompt("enter the password:");
  if (mustbeusedlegally) {
    localStorage.setItem("mustbeusedlegally", mustbeusedlegally);
    window.location.reload();
  }
  return null;
}

export default NFLStream;
