import { fetchE } from "../Fetcher/LogFetcher";

export const isClappr = process.env.NODE_ENV === "development";

export function getClapprParams(
  url: string,
  hardRefresh: boolean
): Promise<{ [key: string]: string }> {
  return fetchE(url, hardRefresh ? 0 : 10 * 60 * 1000).then((text) =>
    Promise.resolve().then(() =>
      Object.fromEntries(
        Object.entries({
          key: /var key= '(.*)';/,
          masterkey: /var masterkey= '(.*)'/,
          masterinf: /window.masterinf = (.*);/,
        })
          .map(([k, re]) => ({ k, matched: (text.match(re) || [])[1] }))
          .map(({ k, matched }) => [
            k,
            matched?.startsWith("{") ? btoa(matched) : matched,
          ])
      )
    )
  );
}

export default function getPayload(url: string): Promise<string | undefined> {
  if (
    url.includes("//.mp4") ||
    url.includes(".space/playlist/36343/red5.boostaether.shop/caxi")
  )
    return fetchExtension({ url: url.split("//.mp4")[0] });
  return Promise.resolve(undefined);
}

const extension_id = "dikaanhdjgmmeajanfokkalonmnpfidm";

declare global {
  interface Window {
    chrome: any;
  }
}

function extensionHelper(payload: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!window.chrome?.runtime) {
      return reject("no chrome runtime");
    }
    window.chrome.runtime.sendMessage(
      extension_id,
      payload,
      (response: any) => {
        if (response === undefined) {
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          window.chrome.runtime.lastError;
          return reject("empty response");
        }
        resolve(response);
      }
    );
  });
}

export function fetchExtension(request: {
  url: string;
  json?: boolean;
}): Promise<any> {
  return extensionHelper({ fetch: request });
}
