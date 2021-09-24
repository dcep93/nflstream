import { CSSProperties } from "react";
import { StreamType } from "../firebase";
import style from "./index.module.css";

export type ScreenType = StreamType & { iFrameTitle: string };

function Multiscreen(props: {
  delete: () => void;
  screen: ScreenType;
  numScreens: number;
}) {
  return (
    <div
      className={style.screen_wrapper}
      style={getStyle(props.numScreens)}
      onClick={props.delete}
    >
      <div>{props.screen.name}</div>
      <div className={style.screen}>
        <iframe
          className={style.iframe}
          title={props.screen.iFrameTitle}
          src={props.screen.url}
        ></iframe>
      </div>
    </div>
  );
}

function getStyle(numScreens: number): CSSProperties {
  const columns = Math.ceil(Math.sqrt(numScreens));
  const basis = `${Math.floor(100 / columns)}%`;
  return { flexBasis: basis, height: basis };
}

export default Multiscreen;
