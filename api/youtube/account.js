import {
  callbackUrl,
  clearSession,
  providerConfig,
  providerStatus,
  readJson,
  sessionCookie,
  setCookie,
  seal,
} from "../_social.js";

async function refresh(session) {
  if (session.expiresAt > Date.now() + 300000) return session;
  if (!session.refreshToken) throw new Error("YouTube needs to be reconnected");
  let { clientId, clientSecret } = providerConfig("youtube"),
    token = await readJson(
      await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
          refresh_token: session.refreshToken,
        }),
      }),
      "YouTube token refresh failed",
    );
  return {
    ...session,
    accessToken: token.access_token,
    expiresAt: Date.now() + (token.expires_in || 3600) * 1000,
    scope: token.scope || session.scope,
  };
}

export default async function handler(req, res) {
  let action = String(req.query.action || "status"),
    { ready, raw, session, diagnostic } = providerStatus(req, "youtube");
  if (action === "status" && req.method === "GET")
    return res.status(200).json({
      configured: ready,
      connected: Boolean(session?.accessToken && session?.channelId),
      sessionState: !ready
        ? "not_configured"
        : raw && !session
          ? "unreadable"
          : session?.accessToken
            ? "connected"
            : "missing",
      account: session
        ? {
            id: session.channelId,
            username: session.channelTitle,
            picture: session.picture,
            accountType: "YouTube channel",
          }
        : null,
      lastError: diagnostic,
      callbackUrl: callbackUrl(req, "youtube"),
      requiredEnvironment: [
        "YOUTUBE_CLIENT_ID",
        "YOUTUBE_CLIENT_SECRET",
        "SOCIAL_SESSION_SECRET",
      ],
    });
  if (action === "disconnect" && req.method === "POST") {
    clearSession(res, "youtube");
    return res.status(204).end();
  }
  if (action === "test" && req.method === "GET") {
    if (!session?.accessToken)
      return res.status(401).json({ error: "YouTube is not connected" });
    try {
      let active = await refresh(session);
      if (active.accessToken !== session.accessToken)
        res.setHeader(
          "Set-Cookie",
          setCookie(sessionCookie("youtube"), seal("youtube", active), 5184000),
        );
      let channels = await readJson(
        await fetch(
          "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
          { headers: { Authorization: `Bearer ${active.accessToken}` } },
        ),
        "YouTube rejected the connection",
      );
      let channel = channels.items?.[0];
      if (!channel?.id) throw new Error("No YouTube channel was found");
      return res.status(200).json({
        valid: true,
        id: channel.id,
        name: channel.snippet?.title || active.channelTitle,
      });
    } catch (error) {
      return res.status(502).json({ valid: false, error: error.message });
    }
  }
  return res.status(405).json({ error: "Method or action not allowed" });
}
