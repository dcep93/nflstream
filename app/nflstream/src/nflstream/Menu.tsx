import React from "react";
import firebase, { NFLStreamType, StreamType } from "../firebase";

var component: Menu;

class Menu extends React.Component<
  { sendStream: (stream: StreamType) => void },
  NFLStreamType
> {
  componentDidMount() {
    const shouldConnect = !component;
    component = this;
    if (shouldConnect)
      firebase.connect((nflStream) =>
        component.setState.bind(component)(nflStream)
      );
  }

  render() {
    if (!this.state) return "Loading...";
    return (
      <div>
        <h1 title={this.state.timestamp}>NFL Stream</h1>
        <div>
          {(this.state.streams || []).map((stream, i) => (
            <div key={i} onClick={() => this.props.sendStream(stream)}>
              <div>{stream.name}</div>
              <div>{stream.url}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default Menu;
