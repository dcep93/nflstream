import Fetcher, { LogType } from ".";

class LogFetcher extends Fetcher<LogType, string> {
  intervalMs = 10 * 1000;
  getResponse() {
    return Promise.resolve({ timestamp: Date.now() });
  }
}

export default LogFetcher;
