import React from "react";
import { LogType } from "../firebase";
import { isIdentical } from "./MessageExtension";

export var delayedLogComponent: DelayedLog;
class DelayedLog extends React.Component<
  { logs: LogType[] },
  { logs: LogType[] }
> {
  componentDidMount() {
    const oldComponent = delayedLogComponent;
    delayedLogComponent = this;
    if (oldComponent) {
      this.setState(oldComponent.state);
    }
  }

  componentDidUpdate(prevProps: { logs: LogType[] }) {
    if (isIdentical(prevProps.logs, this.props.logs)) return;
    setTimeout(() => this.setState({ logs: this.props.logs }), 2 * 60 * 1000);
  }

  render() {
    return null;
  }
}

export default DelayedLog;
