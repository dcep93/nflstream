import md5 from "md5";
import React, { useEffect } from "react";
import firebase from "./etc/Firebase";
import Menu from "./etc/Menu";
import { isMobile } from "./etc/Options";
import Remote from "./etc/Remote";
import { StreamType } from "./Fetcher";
import StreamsFetcher, {
  HOST,
  HOST_STORAGE_KEY,
} from "./Fetcher/StreamsFetcher";
import style from "./index.module.css";
import Multiscreen, { ScreenType } from "./Multiscreen";
import { SCOREBOARD_SRC, ScoreFetcher } from "./Multiscreen/Scoreboard";
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

// export const extension_id = "jbdpjafpomdbklfifcclbkflmnnjefdc"; // local
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
    firebase.initialize();
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
      this.setState({
        streams: streams
          .concat(
            this.state.hasExtension
              ? [
                  {
                    raw_url: `https://fantasy.espn.com/football/fantasycast?leagueId=${ScoreFetcher.leagueId}`,
                    name: SCOREBOARD_SRC,
                    stream_id: SCOREBOARD_SRC,
                    src: SCOREBOARD_SRC,
                  },
                ]
              : []
          )
          .concat(...getStreamsFromUrlQuery()),
      });
    };
    return md5(HOST || "") !== "01ff79624460db1d04dce5d92cce3079" ? (
      <HostPrompt />
    ) : this.state?.hasExtension === undefined ? null : (
      <div className={style.main} style={{ backgroundColor: "black" }}>
        <StreamsFetcher
          ref={ref}
          handleResponse={handleResponse}
          payload={null}
        />
        <Menu
          refreshStreams={() =>
            ref.current!.getResponse(5 * 1000).then(handleResponse)
          }
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
              hasExtension={this.state.hasExtension}
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
    setTimeout(handleKeyDown);
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

function getStreamsFromUrlQuery(): StreamType[] {
  return (
    new URLSearchParams(window.location.search).get("extra")?.split(",") || []
  ).map((raw_url, i) => ({
    raw_url,
    name: `extra_${i + 1}`,
    src: "extra",
    stream_id: `extra_${i + 1}`,
  }));
}

function HostPrompt() {
  const pw = window.prompt("choose a host:");
  if (pw) {
    localStorage.setItem(HOST_STORAGE_KEY, pw);
    window.location.reload();
  }
  return null;
}

export default NFLStream;
