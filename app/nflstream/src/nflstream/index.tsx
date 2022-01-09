import React from "react";
import firebase, { LogType, NFLStreamType, StreamType } from "../firebase";
import DelayedLog from "./DelayedLog";
import style from "./index.module.css";
import Menu from "./Menu";
import MessageExtension from "./MessageExtension";
import Multiscreen, { ScreenType } from "./multiscreen";

var firebaseWrapperComponent: FirebaseWrapper;
class FirebaseWrapper extends React.Component<
  {},
  { nflStream: NFLStreamType }
> {
  componentDidMount() {
    const oldComponent = firebaseWrapperComponent;
    firebaseWrapperComponent = this;
    if (oldComponent) {
      this.setState(oldComponent.state);
    } else {
      document.title = "NFL Stream";
      firebase.connect((nflStream) =>
        firebaseWrapperComponent.setState.bind(firebaseWrapperComponent)({
          nflStream,
        })
      );
    }
  }

  render() {
    return <NFLStream nflStream={this.state?.nflStream || {}} />;
  }
}

class NFLStream extends React.Component<
  { nflStream: NFLStreamType },
  { screens: ScreenType[]; logs: LogType[] }
> {
  constructor(props: { nflStream: NFLStreamType }) {
    super(props);
    this.state = { screens: [], logs: [] };
  }

  render() {
    return (
      <div className={style.main}>
        <DelayedLog logs={this.state.logs} />
        <MessageExtension
          setLogs={(logs: LogType[]) => this.setState({ logs })}
          streams={this.props.nflStream.streams || []}
          version={this.props.nflStream.version}
        />
        <Menu
          sendStream={this.sendStream.bind(this)}
          nflStream={this.props.nflStream}
        />
        <Multiscreen
          screens={this.state.screens}
          removeScreen={this.removeScreen.bind(this)}
        />
      </div>
    );
  }

  sendStream(stream: StreamType, skipLog: boolean) {
    this.setState({
      screens: this.state.screens.concat({
        iFrameTitle: (Math.random() + 1).toString(36).substring(2),
        skipLog,
        ...stream,
      }),
    });
  }

  removeScreen(index: number) {
    this.setState({
      screens: this.state.screens.filter((_, i) => i !== index),
    });
  }
}
export default FirebaseWrapper;
