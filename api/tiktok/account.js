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
  if (!session.refreshToken) throw new Error("TikTok needs to be reconnected");
  let { clientId, clientSecret } = providerConfig("tiktok"),
    token = await readJson(
      await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_key: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
          refresh_token: session.refreshToken,
        }),
      }),
      "TikTok token refresh failed",
    );
  return {
    ...session,
    accessToken: token.access_token,
    refreshToken: token.refresh_token || session.refreshToken,
    expiresAt: Date.now() + (token.expires_in || 86400) * 1000,
    refreshExpiresAt:
      Date.now() + (token.refresh_expires_in || 31536000) * 1000,
    scope: token.scope || session.scope,
  };
}

export default async function handler(req, res) {
  let action = String(req.query.action || "status"),
    { ready, raw, session, diagnostic } = providerStatus(req, "tiktok");
  if (action === "status" && req.method === "GET")
    return res.status(200).json({
      configured: ready,
      connected: Boolean(session?.accessToken),
      sessionState: !ready
        ? "not_configured"
        : raw && !session
          ? "unreadable"
          : session?.accessToken
            ? "connected"
            : "missing",
      account: session
        ? {
            id: session.openId,
            username: session.displayName,
            picture: session.avatar,
            accountType: "TikTok creator",
          }
        : null,
      lastError: diagnostic,
      callbackUrl: callbackUrl(req, "tiktok"),
      requiredEnvironment: [
        "TIKTOK_CLIENT_KEY",
        "TIKTOK_CLIENT_SECRET",
        "SOCIAL_SESSION_SECRET",
      ],
    });
  if (action === "disconnect" && req.method === "POST") {
    clearSession(res, "tiktok");
    return res.status(204).end();
  }
  if (action === "test" && req.method === "GET") {
    if (!session?.accessToken)
      return res.status(401).json({ error: "TikTok is not connected" });
    try {
      let active = await refresh(session);
      if (active.accessToken !== session.accessToken)
        res.setHeader(
          "Set-Cookie",
          setCookie(sessionCookie("tiktok"), seal("tiktok", active), 5184000),
        );
      let profile = await readJson(
        await fetch(
          "https://open.tiktokapis.com/v2/user/info/?fields=open_id,avatar_url,display_name",
          { headers: { Authorization: `Bearer ${active.accessToken}` } },
        ),
        "TikTok rejected the connection",
      );
      return res.status(200).json({
        valid: true,
        id: profile.data?.user?.open_id || active.openId,
        name: profile.data?.user?.display_name || active.displayName,
      });
    } catch (error) {
      return res.status(502).json({ valid: false, error: error.message });
    }
  }
  return res.status(405).json({ error: "Method or action not allowed" });
}
