import React from "react";
import { StreamType } from "../firebase";
import style from "./index.module.css";
import Menu from "./Menu";
import MessageExtension from "./MessageExtension";
import Multiscreen, { ScreenType } from "./multiscreen";

class NFLStream extends React.Component<{}, { screens: ScreenType[] }> {
  constructor(props: {}) {
    super(props);
    this.state = { screens: [] };
  }

  render() {
    if (window.location.href.startsWith("http")) {
      const blob = new Blob(
        [
          document.body.innerHTML.replaceAll(
            /\/static/g,
            `${window.location.href}/static`
          ),
        ],
        {
          type: "text/html",
        }
      );
      const url = URL.createObjectURL(blob);
      return (
        <iframe className={style.main} title={"_blank"} src={url}></iframe>
      );
    }
    return (
      <div className={style.main}>
        <MessageExtension />
        <Menu sendStream={this.sendStream.bind(this)} />
        <Multiscreen
          screens={this.state.screens}
          removeScreen={this.removeScreen.bind(this)}
        />
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

  removeScreen(index: number) {
    this.setState({
      screens: this.state.screens.filter((_, i) => i !== index),
    });
  }
}
export default NFLStream;
