import React from "react";
import { StreamType } from "./Fetcher";
import StreamsFetcher from "./Fetcher/StreamsFetcher";
import style from "./index.module.css";
import Menu from "./Menu";
import Mobile from "./Mobile";
import Multiscreen, { ScreenType } from "./Multiscreen";

const PASSWORD = "mustbeusedlegally";

class NFLStream extends React.Component<
  {},
  {
    backgroundColor: string;
    streams?: StreamType[];
    screens: ScreenType[];
  }
> {
  render() {
    return localStorage.getItem("password") !== PASSWORD ? (
      <Password />
    ) : window.innerWidth < 768 ? (
      <Mobile />
    ) : (
      <div
        className={style.main}
        style={{ backgroundColor: this.state?.backgroundColor }}
      >
        <StreamsFetcher
          handleResponse={(streams) => {
            this.setState({ streams, backgroundColor: "darkgrey" });
            setTimeout(() => this.setState({ backgroundColor: "" }), 2000);
          }}
        />
        <Menu
          addScreen={(screen) =>
            this.setState({
              screens: (this.state?.screens || []).concat(screen),
            })
          }
          streams={this.state?.streams}
        />
        <Multiscreen
          screens={this.state?.screens || []}
          removeScreen={(iFrameTitle) =>
            this.setState({
              screens: this.state.screens.filter(
                (o) => o.iFrameTitle !== iFrameTitle
              ),
            })
          }
        />
      </div>
    );
  }
}

function Password() {
  const password = window.prompt("enter the password:");
  if (password) localStorage.setItem("password", password);
  window.location.reload();
  return null;
}

export default NFLStream;
