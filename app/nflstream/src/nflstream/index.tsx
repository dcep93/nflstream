import md5 from "md5";
import React, { useEffect } from "react";
import Menu from "./etc/Menu";
import { isMobile } from "./etc/Options";
import Remote from "./etc/Remote";
import { StreamType } from "./Fetcher";
import StreamsFetcher, { HOST } from "./Fetcher/StreamsFetcher";
import firebase from "./firebase";
import style from "./index.module.css";
import Multiscreen, { ScreenType } from "./Multiscreen";
import recorded_sha from "./recorded_sha";

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
    firebase();
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
    if (isMobile) {
      return <Remote />;
    }
    const ref = React.createRef<StreamsFetcher>();
    const handleResponse = (streams: StreamType[]) => {
      this.setState({ streams });
    };
    return md5(HOST || "") !== "c1d94a185f9959737bd1be30537c710d" ? (
      <HostPrompt />
    ) : this.state?.hasExtension === undefined ? null : (
      <div className={style.main} style={{ backgroundColor: "black" }}>
        <StreamsFetcher
          ref={ref}
          handleResponse={handleResponse}
          payload={this.state.hasExtension!}
        />
        <Menu
          // TODO no cache on click, maybe for logfetcher and fetcher base class???
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
          this.state.initialized && (
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
          )
        )}
      </div>
    );
  }
}

function ForceInteract(props: { interact: () => void }) {
  function handleKeyDown() {
    props.interact();
    document.removeEventListener("keydown", handleKeyDown);
  }
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (process.env.NODE_ENV === "development") {
    handleKeyDown();
    return null;
  }
  return (
    <div style={{ color: "white" }} onClick={() => handleKeyDown()}>
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

function HostPrompt() {
  const pw = window.prompt("choose a host:");
  if (pw) {
    localStorage.setItem("host", pw);
    window.location.reload();
  }
  return null;
}

export default NFLStream;
