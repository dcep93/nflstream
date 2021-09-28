import { CSSProperties } from "react";
import { StreamType } from "../../firebase";
import { default as style } from "../index.module.css";
import ObjectFitIframe from "../ObjectFitIframe";
import { default as msStyle } from "./index.module.css";

export type ScreenType = StreamType & { iFrameTitle: string };

function Multiscreen(props: {
  screens: ScreenType[];
  removeScreen: (index: number) => void;
}) {
  const basis = `${Math.floor(
    100 / Math.ceil(Math.sqrt(props.screens.length))
  )}%`;
  const wrapperStyle: CSSProperties = { width: basis, height: basis };
  return (
    <div className={msStyle.screens}>
      {props.screens.map((screen, i) => (
        <Singlescreen
          key={screen.iFrameTitle}
          screen={screen}
          delete={() => props.removeScreen(i)}
          wrapperStyle={Object.assign(
            { zIndex: props.screens.length - i },
            wrapperStyle
          )}
        />
      ))}
    </div>
  );
}

function Singlescreen(props: {
  delete: () => void;
  screen: ScreenType;
  wrapperStyle: CSSProperties;
}) {
  return (
    <div className={msStyle.screen_wrapper} style={props.wrapperStyle}>
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
