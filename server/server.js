import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

const {
  TWITCH_CLIENT_ID,
  TWITCH_CLIENT_SECRET,
  STREAMERS = "",
  PORT = "3001",
} = process.env;

// ─── Streamer list source (swap this later for DB/JSON/Google Sheet) ────────

function getStreamerList() {
  return STREAMERS.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

// ─── Token Manager ─────────────────────────────────────────────────────────

const tokenState = {
  accessToken: "",
  expiresAt: 0,
};

async function getToken() {
  // Refresh 5 min before expiry
  if (tokenState.accessToken && Date.now() < tokenState.expiresAt - 300_000) {
    return tokenState.accessToken;
  }

  console.log("[token] Refreshing Twitch access token...");

  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });
  console.log("[debug] CLIENT_ID:", TWITCH_CLIENT_ID ? "SET" : "MISSING");
console.log("[debug] STREAMERS:", STREAMERS);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token request failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  tokenState.accessToken = data.access_token;
  tokenState.expiresAt = Date.now() + data.expires_in * 1000;

  console.log(
    `[token] Got token, expires in ${Math.round(data.expires_in / 60)} min`
  );
  return tokenState.accessToken;
}

// ─── Twitch API helpers ────────────────────────────────────────────────────

async function twitchGet(endpoint, params) {
  const token = await getToken();
  const url = new URL(`https://api.twitch.tv/helix/${endpoint}`);
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) v.forEach((val) => url.searchParams.append(k, val));
    else url.searchParams.append(k, v);
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Client-Id": TWITCH_CLIENT_ID,
    },
  });

  if (res.status === 401) {
    // Token expired mid-request, force refresh and retry once
    console.log("[token] 401 received, forcing refresh...");
    tokenState.expiresAt = 0;
    const newToken = await getToken();
    const retry = await fetch(url, {
      headers: {
        Authorization: `Bearer ${newToken}`,
        "Client-Id": TWITCH_CLIENT_ID,
      },
    });
    return retry.json();
  }

  return res.json();
}

// ─── /api/streamers ────────────────────────────────────────────────────────

app.get("/api/streamers", async (req, res) => {
  try {
    const channelNames = getStreamerList();
    if (channelNames.length === 0) {
      return res.json({ streamers: [] });
    }

    // Fetch users (for avatars, display names)
    const usersData = await twitchGet("users", { login: channelNames });
    const users = usersData.data || [];

    // Fetch live streams
    const streamsData = await twitchGet("streams", {
      user_login: channelNames,
      first: "100",
    });
    const streams = streamsData.data || [];

    // Build live map: login -> stream info
    const liveMap = new Map();
    for (const stream of streams) {
      liveMap.set(stream.user_login.toLowerCase(), {
        viewerCount: stream.viewer_count,
        title: stream.title,
        gameName: stream.game_name,
      });
    }

    // Merge: users + live status, live first
    const streamers = users
      .map((user) => {
        const login = user.login.toLowerCase();
        const live = liveMap.get(login);
        return {
          channelName: login,
          displayName: user.display_name,
          avatarUrl: user.profile_image_url,
          isLive: !!live,
          viewerCount: live?.viewerCount ?? null,
          streamTitle: live?.title ?? null,
          gameName: live?.gameName ?? null,
        };
      })
      .sort((a, b) => {
        if (a.isLive && !b.isLive) return -1;
        if (!a.isLive && b.isLive) return 1;
        return (b.viewerCount ?? 0) - (a.viewerCount ?? 0);
      });

    res.json({ streamers });
  } catch (err) {
    console.error("[api/streamers] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Start ─────────────────────────────────────────────────────────────────

app.listen(Number(PORT), () => {
  console.log(`[server] Listening on http://localhost:${PORT}`);
  console.log(`[server] Tracking ${getStreamerList().length} streamers`);
});
