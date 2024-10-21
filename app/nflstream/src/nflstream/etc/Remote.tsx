import { ScreenType } from "../Multiscreen";
import { titleMessageDiv } from "./Options";

type RemoteType = {
  src: string;
  timestamp: number;
  screens: ScreenType[];
  selected: string;
};

export default function Remote() {
  return (
    <div>
      <h1>{titleMessageDiv}</h1>
      <div>remote</div>
    </div>
  );
}

export function onUpdateRemote(callback: (remote: RemoteType) => void) {}

export function updateRemote(remote: RemoteType) {}
