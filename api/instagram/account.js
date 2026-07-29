import {
  callbackUrl,
  cookie,
  setCookie,
  unseal,
} from "../_instagram.js";

export default async function handler(req, res) {
  let action = String(req.query.action || "status");
  if (action === "status" && req.method === "GET") {
    let configured = Boolean(
        process.env.META_APP_ID &&
          process.env.META_APP_SECRET &&
          process.env.INSTAGRAM_SESSION_SECRET,
      ),
      rawSession = configured ? cookie(req, "scs_instagram") : "",
      session = rawSession ? unseal(rawSession) : null;
    return res.status(200).json({
      configured,
      connected: Boolean(session?.accessToken),
      sessionState: !configured
        ? "not_configured"
        : !rawSession
          ? "missing_on_this_origin"
          : !session
            ? "unreadable"
            : "connected",
      account: session
        ? {
            username: session.username,
            accountType: session.accountType,
            profilePicture: session.profilePicture,
            mediaCount: session.mediaCount,
          }
        : null,
      callbackUrl: callbackUrl(req),
    });
  }
  if (action === "disconnect" && req.method === "POST") {
    res.setHeader("Set-Cookie", setCookie("scs_instagram", "", 0));
    return res.status(204).end();
  }
  if (action === "test" && req.method === "GET") {
    let session = unseal(cookie(req, "scs_instagram"));
    if (!session?.accessToken)
      return res.status(401).json({ error: "Instagram is not connected" });
    try {
      let url = new URL("https://graph.instagram.com/me");
      url.searchParams.set("fields", "user_id,username");
      url.searchParams.set("access_token", session.accessToken);
      let response = await fetch(url),
        body = await response.json();
      if (!response.ok)
        throw new Error(
          body.error?.message || "Instagram rejected the connection",
        );
      return res.status(200).json({
        valid: true,
        username: body.username || session.username,
        userId: body.user_id || session.id,
      });
    } catch (error) {
      return res.status(502).json({
        valid: false,
        error: error.message || "Instagram connection test failed",
      });
    }
  }
  return res.status(405).json({ error: "Method or action not allowed" });
}
