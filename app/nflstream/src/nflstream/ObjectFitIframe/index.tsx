import Log from "../Log";
import { ScreenType } from "../Multiscreen";

function ObjectFitIframe(props: {
  screen: ScreenType;
  hiddenLog: boolean;
  updateDrivingTeam: (drivingTeam: string) => void;
}) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
      }}
    >
      {true || props.screen.skipLog ? null : (
        <Log
          espnId={props.screen.espnId}
          updateDrivingTeam={props.updateDrivingTeam}
          hidden={props.hiddenLog}
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
