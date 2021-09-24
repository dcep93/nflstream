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
      className={style.screen}
      style={getStyle(props.numScreens)}
      onClick={props.delete}
    >
      <div>{props.screen.name}</div>
      <iframe
        className={style.iframe}
        title={props.screen.iFrameTitle}
        src={props.screen.url}
      ></iframe>
    </div>
  );
}

function getStyle(numScreens: number): CSSProperties {
  const columns = Math.ceil(Math.sqrt(numScreens));
  return { flexBasis: `${Math.floor(100 / columns)}%` };
}

export default Multiscreen;
