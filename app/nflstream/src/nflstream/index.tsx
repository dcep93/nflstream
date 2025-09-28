import md5 from "md5";
import React, { useEffect } from "react";
import firebase from "./etc/Firebase";
import Menu, { extension_package_url } from "./etc/Menu";
import { isMobile } from "./etc/Options";
import Remote from "./etc/Remote";
import { StreamType } from "./Fetcher";
import StreamsFetcher from "./Fetcher/StreamsFetcher";
import style from "./index.module.css";
import Multiscreen, { ScreenType } from "./Multiscreen";
import { SCOREBOARD_ID } from "./Multiscreen/Scoreboard";
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

const passwordKey = "password.v1";
const password = "mustbeusedlegally";
const userPassword = localStorage.getItem(passwordKey)!;
const extension_version = "7.0.0";
export const EXTENSION_STORAGE_KEY = "extension_id";
export const extension_id =
  localStorage.getItem(EXTENSION_STORAGE_KEY) ||
  "jbdpjafpomdbklfifcclbkflmnnjefdc";

function NFLStream() {
  return (
    <>
      <Sub divRef={React.createRef()} />
    </>
  );
}

class Sub extends React.Component<
  { divRef: React.RefObject<HTMLDivElement> },
  {
    backgroundColor?: string;
    streams?: StreamType[];
    screens: ScreenType[];
    extensionVersion?: string;
    initialized?: boolean;
  }
> {
  componentDidMount() {
    firebase.initialize();
    console.log(recorded_sha);
    if (!window.chrome?.runtime) {
      console.log("componentDidMount", "no chrome runtime");
      this.setState({ extensionVersion: "- no_chrome_runtime" });
    } else {
      new Promise((resolve, reject) => {
        window.chrome.runtime.sendMessage(extension_id, {}, (response: any) => {
          if (response === undefined) return reject("empty_response");
          // if (response < expected_version) return reject("old version");
          console.log("componentDidMount", "extension detected", response);
          this.setState({ extensionVersion: response });
          resolve(null);
        });
      }).catch((err: Error) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        window.chrome.runtime.lastError;
        console.log("componentDidMount", "extension not detected", err);
        this.setState({ extensionVersion: `- ${err}` });
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
      .map((stream) => streamToScreen(stream!));
  }

  componentDidUpdate() {
    if (this.state?.initialized === undefined) {
      if (this.state?.streams !== undefined) {
        const screens = this.getHashedScreens();
        if (screens.length === 0) {
          this.setState({ initialized: true, screens });
        } else {
          this.props.divRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
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
          .concat([
            {
              raw_url: "",
              name: SCOREBOARD_ID,
              stream_id: SCOREBOARD_ID,
              isStream: false,
            },
          ])
          .concat(
            this.state?.extensionVersion! >= extension_version
              ? []
              : [
                  {
                    raw_url: extension_package_url,
                    name: `update extension ${extension_version} vs ${this.state
                      ?.extensionVersion!}`,
                    stream_id: "ERROR",
                    isStream: false,
                  },
                ]
          )
          .concat(...getStreamsFromUrlQuery()),
      });
    };
    const interact = () =>
      !this.state.streams ||
      this.state.initialized ||
      this.setState({
        initialized: true,
        screens: this.getHashedScreens(),
      });
    return this.state?.extensionVersion === undefined ? null : md5(
        userPassword || ""
      ) !== md5(password) ? (
      <PasswordPrompt extensionVersion={this.state.extensionVersion!} />
    ) : (
      <div
        className={style.main}
        style={{ backgroundColor: "black" }}
        onClick={interact}
      >
        {!this.state.extensionVersion ? null : (
          <StreamsFetcher
            ref={ref}
            handleResponse={handleResponse}
            payload={null}
          />
        )}
        <Menu
          refreshStreams={() =>
            ref.current?.getResponse(5 * 1000).then(handleResponse)
          }
          addScreen={(screen) =>
            this.setState({
              screens: (this.state?.screens || []).concat(screen),
            })
          }
          streams={this.state?.streams}
        />
        <div
          ref={this.props.divRef}
          style={{ width: "100vW", display: "flex" }}
        >
          {this.state.initialized === false ? (
            <ForceInteract interact={interact} />
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
  return (
    <div style={{ color: "white" }} onClick={() => handleKeyDown()}>
      press enter to resume
    </div>
  );
}

export function streamToScreen(stream: StreamType): ScreenType {
  return {
    iFrameTitle: (Math.random() + 1).toString(36).substring(2),
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
    isStream: false,
    stream_id: `extra_${i + 1}`,
  }));
}

var prompted = false;
function PasswordPrompt(props: { extensionVersion: string }) {
  if (props.extensionVersion) {
    localStorage.setItem(passwordKey, password);
    window.location.reload();
    return null;
  }
  if (prompted) return null;
  prompted = true;
  const pw = window.prompt("enter password:");
  if (pw) {
    localStorage.setItem(passwordKey, pw);
    window.location.reload();
  }
  return null;
}

export default NFLStream;
