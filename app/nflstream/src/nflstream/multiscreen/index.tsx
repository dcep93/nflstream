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
  return (
    <MultiscreenStateful
      screens={props.screens.map((s, i) => ({
        e: (
          <Singlescreen
            key={s.iFrameTitle}
            screen={s}
            delete={() => props.removeScreen(i)}
          />
        ),
        s,
        i,
      }))}
    />
  );
}

function MultiscreenStateful(props: {
  screens: { e: JSX.Element; s: ScreenType; i: number }[];
}) {
  const [selected, updateSelected] = useState("");
  var spotlightIndex =
    props.screens.find((obj) => obj.s.iFrameTitle === selected)?.i || 0;
  return (
    <div className={msStyle.screens_wrapper}>
      {props.screens.length === 0 ? null : (
        <div className={msStyle.screens}>
          <div className={msStyle.spotlight}>
            {props.screens[spotlightIndex]!.e}
          </div>
          {props.screens.length <= 1 ? null : (
            <div className={msStyle.aux_screens}>
              {props.screens
                .map((w, i) => ({ w, i }))
                .filter((_, i) => i !== spotlightIndex)
                .map((obj) => (
                  <div
                    className={msStyle.aux_screen_wrapper}
                    key={obj.w.s.iFrameTitle}
                  >
                    <div
                      className={msStyle.aux_screen_cover}
                      onClick={() => updateSelected(obj.w.s.iFrameTitle)}
                    ></div>
                    {obj.w.e}
                  </div>
                ))}
            </div>
          )}
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
