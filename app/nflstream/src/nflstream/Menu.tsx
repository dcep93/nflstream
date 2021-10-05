import React, { useState } from "react";
import firebase, { NFLStreamType, StreamType } from "../firebase";
import { isActive } from "./Extension";
import style from "./index.module.css";
import recorded_sha from "./recorded_sha";

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
        onClick={() => update(!hidden)}
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
  const ref: React.RefObject<HTMLTextAreaElement> = React.createRef();

  if (!props.nflStream.streams) props.nflStream.streams = [];

  return (
    <div>
      <textarea
        className={style.menu_textarea}
        ref={ref}
        defaultValue={JSON.stringify(props.nflStream, null, 2)}
      />
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

function Streams(props: {
  streams?: StreamType[];
  sendStream: (stream: StreamType) => void;
}) {
  return (
    <div>
      {(props.streams || [])
        .map(
          (stream) =>
            Object.assign({}, stream, {
              url: isActive
                ? stream.url.replace(
                    "http://weakstreams.com",
                    "https://weakstreams.com"
                  )
                : stream.url,
            }) as StreamType
        )
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
              onClick={() => {
                if (obj.invalid) {
                  fetch("iframe.html")
                    .then((response) => response.blob())
                    .then((blob) => {
                      const a = document.createElement("a");
                      a.href = window.URL.createObjectURL(blob);
                      a.download = "nflstream.html";
                      a.click();
                    });
                } else {
                  props.sendStream(obj.stream);
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
        <li>Clicking a minimized stream will move it to the spotlight.</li>
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
