import { StreamType } from "../firebase";

export type ScreenType = StreamType & { title: string };

function Multiscreen(props: { delete: () => void; screen: ScreenType }) {
  return <pre>{JSON.stringify(props.screen)}</pre>;
  // return <iframe title={props.screen.title} src={props.screen.url}></iframe>;
}

export default Multiscreen;
