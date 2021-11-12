import React from "react";
import firebase, { LogType, StreamType } from "../firebase";
import { menuWrapper } from "./Menu";

type ScreenMessageType = { version: string; streams: StreamType[] };
type LogsMessageType = { version: string; logs: LogType[] };

const nflstream_url = "https://nflstream.web.app/";
const streamsVersion = "0.5.0";
const logsVersion = "0.5.0";

function MessageExtension() {
  const streamsRef: React.RefObject<HTMLTextAreaElement> = React.createRef();
  const logsRef: React.RefObject<HTMLTextAreaElement> = React.createRef();
  return (
    <div hidden>
      {window.location.href === nflstream_url ? (
        <>
          <textarea
            hidden
            ref={streamsRef}
            id={"extension_streams"}
            onClick={() => {
              const message: ScreenMessageType = JSON.parse(
                streamsRef.current!.value
              );
              if (message.version < streamsVersion) {
                console.log(
                  `need chrome extension version ${streamsVersion} - rejecting`
                );
                return;
              }
              if (isIdentical(message.streams, menuWrapper.state.streams)) {
                console.log(`identical updateStreams`);
                return;
              }
              console.log("updateStreams", message);
              firebase.updateStreams(message.streams);
            }}
          />
          <textarea
            hidden
            ref={logsRef}
            id={"extension_logs"}
            onClick={() => {
              const message: LogsMessageType = JSON.parse(
                logsRef.current!.value
              );
              if (message.version < logsVersion) {
                console.log(
                  `need chrome extension version ${logsVersion} - rejecting`
                );
                return;
              }
              if (isIdentical(message.logs, menuWrapper.state.logs)) {
                console.log(`identical updateStreams`);
                return;
              }
              console.log("updateStreams", message);
              firebase.updateLogs(message.logs);
            }}
          />
        </>
      ) : (
        // so that the chrome extension is loaded even on localhost or downloaded html
        <iframe title={"hidden_iframe"} hidden src={nflstream_url}></iframe>
      )}
    </div>
  );
}

// TODO implement isIdentical
function isIdentical<T>(a: T, b: T): boolean {
  return true;
}

export default MessageExtension;
