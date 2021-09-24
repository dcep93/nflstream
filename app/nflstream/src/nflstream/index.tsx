import React from "react";
import Menu from "./Menu";
import MessageExtension from "./MessageExtension";
import Multiscreen, { ScreenType } from "./Multiscreen";
import recorded_sha from "./recorded_sha";

class NFLStream extends React.Component<{}, { screens: ScreenType[] }> {
  constructor(props: {}) {
    super(props);
    this.state = { screens: [] };
    console.log("recorded_sha", recorded_sha);
  }

  render() {
    return (
      <div>
        <MessageExtension />
        <Menu
          sendStream={(stream) =>
            this.setState({
              screens: this.state.screens.concat(
                Object.assign(
                  { title: (Math.random() + 1).toString(36).substring(2) },
                  stream
                )
              ),
            })
          }
        />
        {(this.state.screens || []).map((screen, i) => (
          <Multiscreen
            key={screen.title}
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
