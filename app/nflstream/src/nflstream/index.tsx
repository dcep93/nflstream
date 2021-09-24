import React from "react";
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
        <Menu
          sendStream={(stream) =>
            this.setState({
              screens: this.state.screens.concat(
                Object.assign(
                  {
                    iFrameTitle: (Math.random() + 1).toString(36).substring(2),
                  },
                  stream
                )
              ),
            })
          }
        />
        {(this.state.screens || []).map((screen, i) => (
          <Multiscreen
            key={screen.iFrameTitle}
            screen={screen}
            delete={() =>
              this.setState({
                screens: this.state.screens.filter((_, j) => j !== i),
              })
            }
          />
        ))}
      </div>
    );
  }
}
export default NFLStream;
