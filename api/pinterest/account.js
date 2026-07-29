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
  if (!session.refreshToken) throw new Error("Pinterest needs to be reconnected");
  let { clientId, clientSecret } = providerConfig("pinterest"),
    token = await readJson(
      await fetch("https://api.pinterest.com/v5/oauth/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: session.refreshToken,
        }),
      }),
      "Pinterest token refresh failed",
    );
  return {
    ...session,
    accessToken: token.access_token,
    refreshToken: token.refresh_token || session.refreshToken,
    expiresAt: Date.now() + (token.expires_in || 2592000) * 1000,
    scope: token.scope || session.scope,
  };
}

export default async function handler(req, res) {
  let action = String(req.query.action || "status"),
    { ready, raw, session, diagnostic } = providerStatus(req, "pinterest");
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
            id: session.id,
            username: session.username,
            accountType: session.accountType,
            picture: session.profileImage,
          }
        : null,
      lastError: diagnostic,
      callbackUrl: callbackUrl(req, "pinterest"),
      requiredEnvironment: [
        "PINTEREST_APP_ID",
        "PINTEREST_APP_SECRET",
        "SOCIAL_SESSION_SECRET",
      ],
    });
  if (action === "disconnect" && req.method === "POST") {
    clearSession(res, "pinterest");
    return res.status(204).end();
  }
  if (action === "test" && req.method === "GET") {
    if (!session?.accessToken)
      return res.status(401).json({ error: "Pinterest is not connected" });
    try {
      let active = await refresh(session);
      if (active.accessToken !== session.accessToken)
        res.setHeader(
          "Set-Cookie",
          setCookie(
            sessionCookie("pinterest"),
            seal("pinterest", active),
            5184000,
          ),
        );
      let profile = await readJson(
        await fetch("https://api.pinterest.com/v5/user_account", {
          headers: { Authorization: `Bearer ${active.accessToken}` },
        }),
        "Pinterest rejected the connection",
      );
      return res.status(200).json({
        valid: true,
        id: profile.id || active.id,
        name: profile.username || active.username,
      });
    } catch (error) {
      return res.status(502).json({ valid: false, error: error.message });
    }
  }
  return res.status(405).json({ error: "Method or action not allowed" });
}
