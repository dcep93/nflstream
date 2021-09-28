import { useState } from "react";
import { StreamType } from "../../firebase";
import style from "../index.module.css";
import ObjectFitIframe from "../ObjectFitIframe";
import msStyle from "./index.module.css";

export type ScreenType = StreamType & { iFrameTitle: string };

function Multiscreen(props: {
  screens: ScreenType[];
  removeScreen: (index: number) => void;
}) {
  const [rawSelected, updateSelected] = useState("");
  const selected =
    props.screens.find((s) => s.iFrameTitle === rawSelected)?.iFrameTitle ||
    props.screens[0]?.iFrameTitle;
  return (
    <div className={msStyle.screens_wrapper}>
      {props.screens.length === 0 ? null : (
        <div className={msStyle.screens}>
          {props.screens.map((screen, i) => (
            <div
              key={screen.iFrameTitle}
              style={{
                width:
                  selected === screen.iFrameTitle
                    ? undefined
                    : `${100 / props.screens.length}%`,
              }}
              className={[
                selected === screen.iFrameTitle && msStyle.selected_screen,
                msStyle.screen_wrapper,
              ].join(" ")}
            >
              <div
                className={[msStyle.title, style.hover].join(" ")}
                onClick={() => props.removeScreen(i)}
              >
                {screen.name}
              </div>
              <div className={msStyle.screen}>
                <div
                  hidden={selected === screen.iFrameTitle}
                  className={msStyle.screen_mask}
                  onClick={() => updateSelected(screen.iFrameTitle)}
                ></div>
                <ObjectFitIframe
                  url={screen.url}
                  title={`${screen.name}\n${screen.iFrameTitle}`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Multiscreen;
