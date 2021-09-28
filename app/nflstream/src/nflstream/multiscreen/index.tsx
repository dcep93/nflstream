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
            <Singlescreen
              key={screen.iFrameTitle}
              screen={screen}
              numScreens={props.screens.length}
              selected={selected}
              updateSelected={updateSelected}
              delete={() => props.removeScreen(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Singlescreen(props: {
  screen: ScreenType;
  numScreens: number;
  selected: string;
  updateSelected: (selected: string) => void;
  delete: () => void;
}) {
  return (
    <div
      style={{
        width:
          props.screen.iFrameTitle === props.selected
            ? undefined
            : `${100 / props.numScreens}%`,
      }}
      className={[
        props.screen.iFrameTitle === props.selected && msStyle.selected_screen,
        msStyle.screen_wrapper,
      ].join(" ")}
    >
      <div
        className={[msStyle.title, style.hover].join(" ")}
        onClick={props.delete}
      >
        {props.screen.name}
      </div>
      <div className={msStyle.screen}>
        <div
          hidden={props.screen.iFrameTitle === props.selected}
          className={msStyle.screen_mask}
          onClick={() => props.updateSelected(props.screen.iFrameTitle)}
        ></div>
        <ObjectFitIframe
          url={props.screen.url}
          title={`${props.screen.name}\n${props.screen.iFrameTitle}`}
        />
      </div>
    </div>
  );
}

export default Multiscreen;
