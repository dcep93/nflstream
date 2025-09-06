import { fetchE } from "../Fetcher/LogFetcher";

export const isClappr = process.env.NODE_ENV === "development";

const maxAgeMs = 10 * 60 * 1000;
export function getClapprParams(
  stream_id: string,
  hardRefresh: boolean
): Promise<{ [key: string]: string }> {
  return fetchE("https://icrackstreams.app/nflstreams/live", maxAgeMs)
    .then(
      (text) =>
        Array.from(text.matchAll(/href="(.*?-live-streaming-.*?)" class/))
          .map((m) => m[0])
          .find((m) => m.includes(stream_id))!
    )
    .then((raw_url) => fetchE(raw_url, hardRefresh ? 0 : maxAgeMs))
    .then((text) => ({ text }));
}

export default function getPayload(url: string): Promise<string | undefined> {
  //   if (
  //     url.includes("//.mp4") ||
  //     url.includes(".space/playlist/36343/red5.boostaether.shop/caxi")
  //   )
  return Promise.resolve(undefined);
}
