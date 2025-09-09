chrome.runtime.sendMessage({ type: "content_script_init" });

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "scoreboard") {
    const leagueId = new URLSearchParams(location.search).get("leagueId");
    fetch(
      `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${msg.year}/segments/0/leagues/${leagueId}?view=mMatchup&view=mMatchupScore&view=mRoster&view=mScoreboard&view=mSettings&view=mStatus&view=mTeam&view=modular&view=mNav`,
      { credentials: "include" }
    )
      .then((resp) => resp.json())
      .then((resp) => sendResponse(resp));
    return true;
  }
});
