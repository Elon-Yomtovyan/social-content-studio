import {
  callbackUrl,
  home,
  providerConfig,
  readJson,
  storeError,
  storeSession,
  unseal,
} from "../_social.js";

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });
  let { code, state, error, error_description: description } = req.query,
    saved = unseal("youtube", state);
  if (error)
    return res.redirect(
      302,
      home(req, "youtube", "failed", String(description || error)),
    );
  if (!code || !saved?.nonce || Date.now() - saved.createdAt > 600000)
    return res.redirect(302, home(req, "youtube", "failed", "session"));

  let stage = "token_exchange";
  try {
    let { clientId, clientSecret } = providerConfig("youtube"),
      token = await readJson(
        await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code: String(code),
            grant_type: "authorization_code",
            redirect_uri: callbackUrl(req, "youtube"),
          }),
        }),
        "Google could not exchange the authorization code",
      );
    stage = "channel";
    let channels = await readJson(
      await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
        { headers: { Authorization: `Bearer ${token.access_token}` } },
      ),
      "YouTube connected, but no channel could be read",
    );
    let channel = channels.items?.[0];
    if (!channel?.id)
      throw new Error(
        "No YouTube channel was found for this Google account. Create or select a channel, then reconnect.",
      );
    storeSession(
      res,
      "youtube",
      {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: Date.now() + (token.expires_in || 3600) * 1000,
        scope: token.scope,
        channelId: channel.id,
        channelTitle: channel.snippet?.title || "YouTube channel",
        picture:
          channel.snippet?.thumbnails?.default?.url ||
          channel.snippet?.thumbnails?.medium?.url ||
          "",
      },
      5184000,
    );
    return res.redirect(302, home(req, "youtube", "connected"));
  } catch (error) {
    console.error(`YouTube OAuth failed at ${stage}`, error);
    storeError(res, "youtube", stage, error);
    return res.redirect(302, home(req, "youtube", "failed", stage));
  }
}
