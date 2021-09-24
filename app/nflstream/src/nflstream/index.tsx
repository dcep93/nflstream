import React from "react";
import { StreamType } from "../firebase";
import style from "./index.module.css";
import Menu from "./Menu";
import MessageExtension from "./MessageExtension";
import Multiscreen, { ScreenType } from "./Multiscreen";

class NFLStream extends React.Component<{}, { screens: ScreenType[] }> {
  constructor(props: {}) {
    super(props);
    this.state = { screens: [] };
  }

  render() {
    return (
      <div className={style.main}>
        <MessageExtension />
        <Menu sendStream={this.sendStream.bind(this)} />
        <div className={style.screens_wrapper}>
          <div className={style.screens}>
            {(this.state.screens || []).map((screen, i) => (
              <Multiscreen
                key={screen.iFrameTitle}
                numScreens={this.state.screens.length}
                screen={screen}
                delete={() => this.filterScreen(i)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  sendStream(stream: StreamType) {
    this.setState({
      screens: this.state.screens.concat(
        Object.assign(
          {
            iFrameTitle: (Math.random() + 1).toString(36).substring(2),
          },
          stream
        )
      ),
    });
  }

  filterScreen(index: number) {
    this.setState({
      screens: this.state.screens.filter((_, i) => i !== index),
    });
  }
}
export default NFLStream;
