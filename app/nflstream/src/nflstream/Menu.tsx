import React, { useState } from "react";
import firebase, { NFLStreamType, StreamType } from "../firebase";
import style from "./index.module.css";
import { screenWrapperRef } from "./multiscreen";
import recorded_sha from "./recorded_sha";

const ref: React.RefObject<HTMLTextAreaElement> = React.createRef();
function Menu(props: {
  sendStream: (stream: StreamType) => void;
  nflStream?: NFLStreamType;
}) {
  const [hidden, update] = useState(true);
  if (!props.nflStream) return <div>Loading...</div>;
  const title = `${new Date(
    props.nflStream.timestamp
  ).toLocaleString()}\n${recorded_sha}`;
  return (
    <div>
      <h1
        className={style.header}
        title={title}
        onClick={() => {
          ref.current!.value = JSON.stringify(props.nflStream, null, 2);
          update(!hidden);
        }}
      >
        NFL Stream
      </h1>
      <div hidden={hidden}>
        <ManualUpdate nflStream={props.nflStream} />
      </div>
      <Streams
        streams={(props.nflStream.streams || []).concat(
          props.nflStream?.other || []
        )}
        sendStream={props.sendStream}
      />
      <Guide />
    </div>
  );
}

function ManualUpdate(props: { nflStream: NFLStreamType }) {
  if (!props.nflStream.streams) props.nflStream.streams = [];

  return (
    <div>
      <textarea className={style.menu_textarea} ref={ref} />
      <div>
        <button
          onClick={() => {
            const nflStream: NFLStreamType = JSON.parse(ref.current!.value);
            firebase.updateNFLStream(nflStream);
          }}
        >
          Update
        </button>
      </div>
    </div>
  );
}

type StreamsPropsType = {
  streams?: StreamType[];
  sendStream: (stream: StreamType) => void;
};
class Streams extends React.Component<StreamsPropsType, {}> {
  componentDidUpdate(prevProps: StreamsPropsType) {
    if (
      (this.props.streams || []).filter(
        (s) => !prevProps.streams?.map((prevS) => prevS.name).includes(s.name)
      ).length > 0
    ) {
      screenWrapperRef.current!.style.backgroundColor = "darkgrey";
      setTimeout(
        () => (screenWrapperRef.current!.style.backgroundColor = ""),
        2000
      );
    }
  }

  render() {
    return (
      <div>
        {(this.props.streams || [])
          .map((stream, i) => ({
            stream,
            i,
            invalid:
              stream.url.startsWith("http://") &&
              window.location.protocol === "https:",
          }))
          .map((obj) => (
            <div key={obj.i}>
              <div
                className={[
                  style.bubble,
                  style.hover,
                  obj.invalid && style.red,
                ].join(" ")}
                onClick={(e) => {
                  if (obj.invalid) {
                    fetch("iframe.html")
                      .then((response) => response.blob())
                      .then((blob) => {
                        const a = document.createElement("a");
                        a.href = window.URL.createObjectURL(blob);
                        a.download = "nflstream.html";
                        a.click();
                      });
                  } else if (e.shiftKey) {
                    window.open(obj.stream.url, "_blank");
                  } else {
                    const stream =
                      e.metaKey || e.altKey
                        ? obj.stream
                        : Object.assign({}, obj.stream, { chat: undefined });
                    this.props.sendStream(stream);
                  }
                }}
              >
                <div title={obj.stream.url}>{obj.stream.name}</div>
              </div>
            </div>
          ))}
      </div>
    );
  }
}

function Guide() {
  return (
    <div className={style.bubble}>
      <h3>User Guide</h3>
      <ol>
        <li>
          This app is used to watch multiple NFL streams free with no popups.
        </li>
        <li>
          Because of CORS policies, most streams will be colored in red. These
          http links cannot be loaded over https, so clicking one will instead
          download an HTML page that will work properly.
        </li>
        <li>
          Clicking a game will open a stream and place it on the multiscreen.
          Streams are borrowed from other sources, so I can't do anything about
          broken links.
        </li>
        <li>
          Holding shift when clicking a game will open it in a new tab - in case
          something is broken.
        </li>
        <li>Clicking a minimized stream will move it to the spotlight.</li>
        <li>Clicking the title of a stream will delete it.</li>
        <li>
          Clicking a stream while holding ctrl or cmd will open a chat panel.
        </li>
        <li>
          Downloading the{" "}
          <a href="https://chrome.google.com/webstore/detail/nfl-stream/jjlokcmkcepehbfepbffkmkkbnggkmje?hl=en&u_producttype=chrome-extension-667709&u_country=au&funnel=convert-pdf&gclid=Cj0KCQjwwNWKBhDAARIsAJ8HkhfEFO3SAM6aK42aSfntfnUY6yIRKS6A7DiyPG00l1mf8743CELeGaQaAksoEALw_wcB">
            chrome extension
          </a>{" "}
          offers additional functionality, like keeping the list of streams
          updated, and muting non-spotlighted streams.
        </li>
      </ol>
    </div>
  );
}

export var menuWrapper: MenuWrapper;
class MenuWrapper extends React.Component<
  { sendStream: (stream: StreamType) => void },
  NFLStreamType
> {
  componentDidMount() {
    const oldComponent = menuWrapper;
    menuWrapper = this;
    if (oldComponent) {
      this.setState(oldComponent.state);
    } else {
      document.title = "NFLStream";
      firebase.connect((nflStream) =>
        menuWrapper.setState.bind(menuWrapper)(nflStream)
      );
    }
  }

  render() {
    return (
      <div className={style.menu}>
        <Menu sendStream={this.props.sendStream} nflStream={this.state} />
      </div>
    );
  }
}

export default MenuWrapper;
