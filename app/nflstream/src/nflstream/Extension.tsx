import React from "react";
import firebase, { LogType, StreamType } from "../firebase";

type ScreenMessageType = { version: string; streams: StreamType[] };
type LogsMessageType = { version: string; logs: LogType[] };

const nflstream_url = "https://nflstream.web.app/";
const streamsVersion = "0.5.0";
const logsVersion = "0.5.0";

function MessageExtension(props: { streams: StreamType[]; logs: LogType[] }) {
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
              if (isIdentical(message.streams, props.streams)) {
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
              if (isIdentical(message.logs, props.logs)) {
                console.log(`identical updateLogs`);
                return;
              }
              console.log("updateLogs", message);
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

function isIdentical<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export default MessageExtension;
