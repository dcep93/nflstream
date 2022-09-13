import React from "react";
import { StreamType } from "./Fetcher";
import style from "./index.module.css";
import { ScreenType } from "./Multiscreen";
import recorded_sha from "./recorded_sha";

class Menu extends React.Component<
  {
    streams: StreamType[];
    addScreen: (screen: ScreenType) => void;
  },
  {}
> {
  render() {
    return (
      <div className={style.menu}>
        <h1 className={style.header} title={recorded_sha}>
          NFL Stream
        </h1>

        <div>
          {(this.props.streams || [])
            .map((stream, i) => ({
              stream,
              i,
              invalid:
                stream.url.startsWith("http://") &&
                window.location.protocol === "https:",
            }))
            .map((obj) => (
              <div key={obj.i}>
                <div
                  className={[
                    style.bubble,
                    style.hover,
                    obj.invalid && style.red,
                  ].join(" ")}
                  onClick={(e) => {
                    obj.invalid
                      ? fetch("iframe.html")
                          .then((response) => response.blob())
                          .then((blob) => {
                            const a = document.createElement("a");
                            a.href = window.URL.createObjectURL(blob);
                            a.download = "nflstream.html";
                            a.click();
                          })
                      : this.props.addScreen({
                          iFrameTitle: (Math.random() + 1)
                            .toString(36)
                            .substring(2),
                          skipLog: e.shiftKey,
                          ref: React.createRef() as React.RefObject<HTMLIFrameElement>,
                          ...obj.stream,
                        });
                  }}
                >
                  <div title={obj.stream.url}>{obj.stream.name}</div>
                </div>
              </div>
            ))}
        </div>
        <Guide />
      </div>
    );
  }
}

function Guide() {
  return (
    <div className={style.bubble}>
      <h3>User Guide</h3>
      <ol>
        <li>
          This app is used to watch multiple NFL streams free with no popups.
        </li>
        <li>
          Because of CORS policies, most streams will be colored in red. These
          http links cannot be loaded over https, so clicking one will instead
          download an HTML page that will work properly.
        </li>
        <li>
          Clicking a game will open a stream and place it on the multiscreen.
          Streams are borrowed from other sources, so I can't do anything about
          broken links.
        </li>
        <li>Clicking a minimized stream will move it to the spotlight.</li>
        <li>Clicking the title of a stream will delete it.</li>
        <li>
          Streams will include a delayed play-by-play log. You can disable this
          by holding shift when opening a stream.
        </li>
        <li>
          Downloading the{" "}
          <a href="https://chrome.google.com/webstore/detail/nfl-stream/jjlokcmkcepehbfepbffkmkkbnggkmje?hl=en&u_producttype=chrome-extension-667709&u_country=au&funnel=convert-pdf&gclid=Cj0KCQjwwNWKBhDAARIsAJ8HkhfEFO3SAM6aK42aSfntfnUY6yIRKS6A7DiyPG00l1mf8743CELeGaQaAksoEALw_wcB">
            chrome extension
          </a>{" "}
          offers additional functionality, like muting non-spotlighted streams.
          Click the chrome extension in the toolbar to open the stream-viewable
          page without downloading.
        </li>
      </ol>
    </div>
  );
}

export default Menu;
