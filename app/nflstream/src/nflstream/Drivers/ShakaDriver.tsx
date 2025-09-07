import ReactDomServer from "react-dom/server";
import { StreamType } from "../Fetcher";
import { HOST } from "../Fetcher/StreamsFetcher";

const ShakaDriver = {
  getRawUrl: (stream_id: string) => HOST,
  getHostParams: (stream: StreamType, hardRefresh: boolean) =>
    Promise.resolve({}),
  getSrcDoc,
};
export default ShakaDriver;

function getSrcDoc(params: { [key: string]: string }) {
  return ReactDomServer.renderToStaticMarkup(
    <div style={{ color: "WHITE" }}>WIP</div>
  );
}
