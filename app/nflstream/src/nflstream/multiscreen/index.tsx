import { useState } from "react";
import { StreamType } from "../../firebase";
import { default as style } from "../index.module.css";
import ObjectFitIframe from "../ObjectFitIframe";
import { default as msStyle } from "./index.module.css";

export type ScreenType = StreamType & { iFrameTitle: string };

function Multiscreen(props: {
  screens: ScreenType[];
  removeScreen: (index: number) => void;
}) {
  const screens = props.screens.map((screen, i) => (
    <Singlescreen
      key={screen.iFrameTitle}
      screen={screen}
      delete={() => props.removeScreen(i)}
    />
  ));
  return (
    <MultiscreenStateful
      screens={screens}
      titleToIndex={Object.fromEntries(
        props.screens.map((screen, i) => [screen.iFrameTitle, i])
      )}
    />
  );
}

function MultiscreenStateful(props: {
  screens: JSX.Element[];
  titleToIndex: { [title: string]: number };
}) {
  const [selected, updateSelected] = useState("");
  const spotlightIndex = props.titleToIndex[selected] || 0;
  return (
    <div className={msStyle.screens}>
      <div className={msStyle.spotlight}>{props.screens[spotlightIndex]}</div>
      {props.screens.length <= 1 ? null : (
        <div className={msStyle.aux_screens}>
          {props.screens
            .map((screen, i) => ({ screen, i }))
            .filter((_, i) => i !== spotlightIndex)
            .map((obj) => (
              <div className={msStyle.aux_screen_wrapper}>
                <div
                  className={msStyle.aux_screen_cover}
                  onClick={() =>
                    updateSelected(
                      Object.entries(props.titleToIndex)
                        .map(([title, index]) => ({ title, index }))
                        .find((findObj) => findObj.index === obj.i)!.title
                    )
                  }
                ></div>
                {obj.screen}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function Singlescreen(props: { delete: () => void; screen: ScreenType }) {
  return (
    <div className={msStyle.screen_wrapper}>
      <div
        className={[msStyle.title, style.hover].join(" ")}
        onClick={props.delete}
      >
        {props.screen.name}
      </div>
      <div className={msStyle.screen}>
        <ObjectFitIframe
          url={props.screen.url}
          title={`${props.screen.name}\n${props.screen.iFrameTitle}`}
        />
      </div>
    </div>
  );
}

export default Multiscreen;
