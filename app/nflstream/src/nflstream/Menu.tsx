import React, { useState } from "react";
import firebase, { NFLStreamType, StreamType } from "../firebase";
import style from "./index.module.css";
import { screenWrapperRef } from "./multiscreen";
import recorded_sha from "./recorded_sha";

const ref: React.RefObject<HTMLTextAreaElement> = React.createRef();
function Menu(props: {
  sendStream: (stream: StreamType, skipLog: boolean) => void;
  nflStream: NFLStreamType;
}) {
  if (!props.nflStream.other) props.nflStream.other = [];
  const [hidden, update] = useState(true);
  const title = recorded_sha;
  return (
    <div className={style.menu}>
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
          (props.nflStream?.other || []).filter((s) => s.url !== "")
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
  streams: StreamType[];
  sendStream: (stream: StreamType, skipLog: boolean) => void;
};
class Streams extends React.Component<StreamsPropsType, {}> {
  componentDidUpdate(prevProps: StreamsPropsType) {
    if (
      this.props.streams.filter(
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
                onClick={(e) =>
                  click(
                    this.props.sendStream,
                    obj.stream,
                    obj.invalid,
                    e.shiftKey
                  )
                }
              >
                <div title={obj.stream.url}>{obj.stream.name}</div>
              </div>
            </div>
          ))}
      </div>
    );
  }
}

function click(
  sendStream: (stream: StreamType, skipLog: boolean) => void,
  stream: StreamType,
  invalid: boolean,
  skipLog: boolean
) {
  // mobile
  if (window.innerWidth < 768) {
    window.open(stream.url);
    return;
  }
  if (invalid) {
    fetch("iframe.html")
      .then((response) => response.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = window.URL.createObjectURL(blob);
        a.download = "nflstream.html";
        a.click();
      });
    return;
  }
  sendStream(stream, skipLog);
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
        <li>Clicking the title of a stream will delete it.</li>
        <li>
          Streams will include a delayed play-by-play log. You can disable this
          by holding shift when opening a stream.
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

export default Menu;
