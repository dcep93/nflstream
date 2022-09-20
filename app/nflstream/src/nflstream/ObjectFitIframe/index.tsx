import Log from "../Log";
import { ScreenType } from "../Multiscreen";

function ObjectFitIframe(props: {
  screen: ScreenType;
  hiddenLog: boolean;
  updateDrivingTeam: (drivingTeam: string) => void;
  isSelected: boolean;
}) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
      }}
    >
      {props.screen.skipLog ? null : (
        <Log
          espnId={props.screen.espnId}
          updateDrivingTeam={props.updateDrivingTeam}
          hidden={props.hiddenLog}
          isSelected={props.isSelected}
        />
      )}
      <iframe
        ref={props.screen.ref}
        sandbox={"allow-scripts allow-same-origin"}
        style={{ flexGrow: 1 }}
        title={props.screen.name}
        srcDoc={`
          <meta data-url="${props.screen.url}" />
          <script src="${process.env.PUBLIC_URL}/objectfitiframe.js"></script>
        `}
      ></iframe>
    </div>
  );
}

export default ObjectFitIframe;
