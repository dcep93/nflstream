import React from "react";
import { StreamType } from "../firebase";
import Extension from "./Extension";
import style from "./index.module.css";
import Menu, { menuWrapperComponent } from "./Menu";
import Multiscreen, { ScreenType } from "./multiscreen";

class NFLStream extends React.Component<{}, { screens: ScreenType[] }> {
  constructor(props: {}) {
    super(props);
    this.state = { screens: [] };
  }

  render() {
    return (
      <div className={style.main}>
        <Extension
          streams={menuWrapperComponent?.state.streams || []}
          logs={menuWrapperComponent?.state.logs || []}
          version={menuWrapperComponent?.state.version || ""}
        />
        <Menu sendStream={this.sendStream.bind(this)} />
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
export default NFLStream;
