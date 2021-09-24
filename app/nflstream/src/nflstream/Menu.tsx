import React, { useState } from "react";
import firebase, { NFLStreamType, StreamType } from "../firebase";
import style from "./index.module.css";

const MAX_AGE_MS = 5 * 1000;

function Menu(props: {
  sendStream: (stream: StreamType) => void;
  nflStream?: NFLStreamType;
}) {
  const [hidden, update] = useState(true);
  if (!props.nflStream) return <div>Loading...</div>;
  const title = new Date(props.nflStream.timestamp).toLocaleString();
  console.log(title);
  return (
    <div>
      <h1
        className={style.header}
        title={title}
        onClick={() => update(!hidden)}
      >
        NFL Stream
      </h1>
      <Streams
        streams={props.nflStream.streams}
        sendStream={props.sendStream}
      />
      <div hidden={hidden}>
        <UpdateStreams nflStream={props.nflStream} />
      </div>
      (
      {new Date().getTime() - props.nflStream.timestamp > MAX_AGE_MS && (
        <OutOfDate />
      )}
      )
    </div>
  );
}

function Streams(props: {
  streams?: StreamType[];
  sendStream: (stream: StreamType) => void;
}) {
  return (
    <div>
      {(props.streams || []).map((stream, i) => (
        <div key={i}>
          <div
            className={style.bubble}
            onClick={() => props.sendStream(stream)}
          >
            <div title={stream.url}>{stream.name}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function UpdateStreams(props: { nflStream: NFLStreamType }) {
  const ref: React.RefObject<HTMLTextAreaElement> = React.createRef();

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

function OutOfDate() {
  return (
    <div className={style.bubble}>
      <div>These links are out of date.</div>
      <div>
        Consider downloading the{" "}
        <a href="https://chrome.google.com/webstore/detail/movie-date/iofdkijmnaoabjndjbichhbllhbbkbde">
          chrome extension
        </a>{" "}
        to automatically update the streams.
      </div>
    </div>
  );
}

var component: MenuWrapper;
class MenuWrapper extends React.Component<
  { sendStream: (stream: StreamType) => void },
  NFLStreamType
> {
  componentDidMount() {
    const shouldConnect = !component;
    if (!shouldConnect) {
      this.setState(component.state);
    }
    component = this;
    if (shouldConnect)
      firebase.connect((nflStream) =>
        component.setState.bind(component)(nflStream)
      );
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
