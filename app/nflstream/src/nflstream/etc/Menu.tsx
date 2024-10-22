import React from "react";
import { streamToScreen } from "..";
import { StreamType } from "../Fetcher";
import style from "../index.module.css";
import { ScreenType } from "../Multiscreen";
import recorded_sha from "../recorded_sha";
import Options, { titleMessageDiv } from "./Options";

class Menu extends React.Component<
  {
    refreshStreams: () => void;
    streams?: StreamType[];
    addScreen: (screen: ScreenType) => void;
  },
  {}
> {
  render() {
    return (
      <div className={style.menu}>
        <h1
          className={style.header}
          title={recorded_sha}
          onClick={this.props.refreshStreams}
        >
          {titleMessageDiv}
        </h1>

        {this.props.streams === undefined ? (
          <div>
            <img
              style={{ height: "100px", marginLeft: "100px" }}
              src={"https://nflstream.web.app/loading.gif"}
              alt="loading"
            />
          </div>
        ) : (
          <div>
            <div>
              {this.props.streams
                .map((stream, i) => ({
                  stream,
                  i,
                }))
                .map((obj) => (
                  <div key={obj.i}>
                    <div
                      className={[style.bubble, style.hover].join(" ")}
                      onClick={(e) =>
                        e.metaKey
                          ? window.open(obj.stream.raw_url)
                          : this.props.addScreen(
                              streamToScreen(obj.stream, e.shiftKey)
                            )
                      }
                    >
                      <div title={obj.stream.raw_url}>
                        <span style={{ paddingRight: "10px" }}>➕</span>
                        <span>{obj.stream.name}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
        <Guide />
        <Options />
      </div>
    );
  }
}

function Guide() {
  return (
    <div className={style.bubble}>
      <h3>User Guide</h3>
      <ol>
        <li>This app is used to watch multiple NFL streams.</li>
        <li>
          Click a game to open a stream and place it on the multiscreen.
          (Streams are borrowed from other sources, so I can't do anything about
          broken links.)
        </li>
        <li>Click a minimized stream to move it to the spotlight.</li>
        <li>
          If you have the{" "}
          <a href="https://chrome.google.com/webstore/detail/nfl-stream/jjlokcmkcepehbfepbffkmkkbnggkmje?hl=en&u_producttype=chrome-extension-667709&u_country=au&funnel=convert-pdf&gclid=Cj0KCQjwwNWKBhDAARIsAJ8HkhfEFO3SAM6aK42aSfntfnUY6yIRKS6A7DiyPG00l1mf8743CELeGaQaAksoEALw_wcB">
            chrome extension
          </a>
          , streams will include a delayed play-by-play log. You can disable
          this by holding shift when opening a stream.
        </li>
        <li>
          Click a stream's title in the multiscreen to remove it, or the 🔄
          symbol to refresh it. (Streams by default automatically refresh)
        </li>
        <li>Click the log to refresh it.</li>
        <li>
          You can only use this tool if you legally have access to the stream
          and the game.
        </li>
      </ol>
    </div>
  );
}

export default Menu;
