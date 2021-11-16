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
    } else {
      this.delayUpdate();
    }
  }

  componentDidUpdate(prevProps: { logs: LogType[] }) {
    if (isIdentical(prevProps.logs, this.props.logs)) return;
    this.delayUpdate();
  }

  delayUpdate() {
    setTimeout(this.updateNow.bind(this), 3 * 60 * 1000);
  }

  updateNow() {
    this.setState({ logs: this.props.logs });
  }

  render() {
    return null;
  }
}

export default DelayedLog;
