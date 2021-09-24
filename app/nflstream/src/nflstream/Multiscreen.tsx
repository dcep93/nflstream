import { StreamType } from "../firebase";

export type ScreenType = StreamType & { iFrameTitle: string };

function Multiscreen(props: { delete: () => void; screen: ScreenType }) {
  return (
    <div onClick={props.delete}>
      <div>{props.screen.name}</div>
      <iframe title={props.screen.iFrameTitle} src={props.screen.url}></iframe>
    </div>
  );
}

export default Multiscreen;
