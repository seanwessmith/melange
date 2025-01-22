import { arraysAreEqual } from "utils/array";

async function checkOnlineFriends(): Promise<void> {
  try {
    console.log("Checking online friends");
    const usernamesICareAbout = [
      "UAIreadyLost",
      "Excusemyblunder",
      "JPartridge",
      "like-a-knight",
      "cumingsa",
      "jamonies",
      "JBellRing",
      "twhite90",
      "edwarddalsanto",
    ];

    // Load the previously stored list of relevant online friends
    const { onlineFriends: prevRelevantOnlineFriends = [] } =
      await chrome.storage.local.get("onlineFriends");

    // Get cookies from local storage
    const { cookies } = await chrome.storage.local.get("cookies");
    if (!cookies) {
      console.log(
        "No Chess.com cookies found in local storage. Visit chess.com to update cookies."
      );
      return;
    }

    // Fetch Chess.com friends data
    const response = await fetch(
      "https://www.chess.com/callback/friends/seanwessmith/get-friends?avatarSize=128&user=33566197",
      {
        method: "GET",
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "en-US,en;q=0.9,ru;q=0.8",
          cookie: cookies,
        },
      }
    );

    if (!response.ok) {
      console.error("Chess.com fetch failed with status:", response.status);
      return;
    }

    const data = await response.json();
    // 2. Filter for users with presence == 3 (online),
    //    then further filter only the ones you care about.
    const allOnlineFriends = (data.friends || [])
      .filter((friend: any) => friend.presence === 3)
      .map((friend: any) => friend.userView.username) as string[];

    // Now only keep those who match usernamesICareAbout
    const relevantOnlineFriends = allOnlineFriends.filter((username) =>
      usernamesICareAbout.includes(username)
    );

    // 3. Compare old relevant list to the new relevant list:
    if (
      relevantOnlineFriends.length > 0 && // Only notify if we have at least one friend of interest
      !arraysAreEqual(prevRelevantOnlineFriends, relevantOnlineFriends)
    ) {
      const newFriends = relevantOnlineFriends.filter(
        (username) => !prevRelevantOnlineFriends.includes(username)
      );
      const chessFriendsTimestamps =
        (await chrome.storage.local.get("chessFriendsTimestamps"))
          .chessFriendsTimestamps || {};
      for (const username of newFriends) {
        if (!chessFriendsTimestamps[username]) {
          chessFriendsTimestamps[username] = [];
        }
        chessFriendsTimestamps[username].push(Date.now());
      }
      await chrome.storage.local.set({ chessFriendsTimestamps });
      // Send a Chrome notification listing only the relevant users
      chrome.notifications.create(
        "123",
        {
          type: "basic",
          iconUrl: "logo.png",
          title: "Chess.com",
          message: `Online friends: ${relevantOnlineFriends.join(", ")}`,
          isClickable: true,
        },
        () => {
          chrome.tabs.create({
            url: "https://www.chess.com/friends",
          });
        }
      );
      console.log("notification created");

      // Store the new relevant online friends in local storage
      await chrome.storage.local.set({ onlineFriends: relevantOnlineFriends });
      console.log(
        "notification created",
        prevRelevantOnlineFriends,
        relevantOnlineFriends
      );
    }
  } catch (error) {
    console.error("Failed to check online friends:", error);
  }
}

/**
 * Create an alarm to check every minute (adjust as needed),
 * plus handle extension icon clicks to run on-demand.
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("checkChessOnline", { periodInMinutes: 0.5 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkChessOnline") {
    checkOnlineFriends();
  }
});

// Also allow user to manually trigger a check by clicking on the extension icon
chrome.action.onClicked.addListener(() => {
  checkOnlineFriends();
});

// handle messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { type, payload } = request;

  if (type === "CHESS_COOKIES") {
    const cookies = payload;
    console.log(
      "updating cookies: ",
      cookies.split(";").map((c: string) => c.split("=")[0])
    );
    chrome.storage.local.set({ cookies });
    sendResponse({ success: true });
  }
});
