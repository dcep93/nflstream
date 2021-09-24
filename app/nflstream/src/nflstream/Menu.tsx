import React, { useState } from "react";
import firebase, { NFLStreamType, StreamType } from "../firebase";

const MAX_AGE_MS = 5 * 1000;

function MenuHelper(props: {
  sendStream: (stream: StreamType) => void;
  nflStream: NFLStreamType;
}) {
  const title = new Date(props.nflStream.timestamp).toLocaleString();
  console.log(title);
  const [hidden, update] = useState(true);
  const ref: React.RefObject<HTMLTextAreaElement> = React.createRef();
  return (
    <div>
      <h1 title={title} onClick={() => update(!hidden)}>
        NFL Stream
      </h1>
      <div>
        {(props.nflStream.streams || []).map((stream, i) => (
          <div key={i} onClick={() => props.sendStream(stream)}>
            <div>{stream.name}</div>
            <div>{stream.url}</div>
          </div>
        ))}
      </div>
      <div hidden={hidden}>
        <textarea ref={ref} defaultValue={JSON.stringify(props.nflStream)} />
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
      {new Date().getTime() - props.nflStream.timestamp > MAX_AGE_MS && (
        <div>
          These links are out of date. Consider downloading the{" "}
          <a href="https://chrome.google.com/webstore/detail/movie-date/iofdkijmnaoabjndjbichhbllhbbkbde">
            chrome extension
          </a>{" "}
          to automatically update the streams.
        </div>
      )}
    </div>
  );
}

var component: Menu;
class Menu extends React.Component<
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
    if (!this.state) return "Loading...";
    return (
      <MenuHelper sendStream={this.props.sendStream} nflStream={this.state} />
    );
  }
}

export default Menu;
