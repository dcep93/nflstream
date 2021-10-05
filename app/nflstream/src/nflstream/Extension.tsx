import React from "react";
import firebase from "../firebase";
import { menuWrapper } from "./Menu";

type MessageType = {
  version: string;
  streams: { href: string; title: string }[];
};

const url = "https://nflstream.web.app/";
const expected_version = "0.0.4";

export var version = "";

function MessageExtension() {
  const ref: React.RefObject<HTMLTextAreaElement> = React.createRef();
  const versionRef: React.RefObject<HTMLDivElement> = React.createRef();
  return (
    <div hidden>
      {window.location.href !== url && (
        // so that the chrome extension is loaded even on localhost or downloaded html
        <iframe title={"hidden_iframe"} hidden src={url}></iframe>
      )}
      <div
        ref={versionRef}
        id="extension_active"
        onClick={() => (version = versionRef.current!.innerText)}
      />
      <textarea
        hidden
        ref={ref}
        id={"message_extension"}
        onClick={() => {
          const message: MessageType = JSON.parse(ref.current!.value);
          console.log("update", message);
          if (message.version < expected_version) {
            console.log(
              `need chrome extension version ${expected_version} - rejecting`
            );
            return;
          }
          const nflStream = Object.assign(menuWrapper.state, {
            timestamp: new Date().getTime(),
            streams: message.streams.map((m) => ({
              url: m.href,
              name: m.title,
            })),
          });
          firebase.updateNFLStream(nflStream);
        }}
      />
    </div>
  );
}

export default MessageExtension;
