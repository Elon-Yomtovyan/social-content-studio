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
    saved = unseal("tiktok", state);
  if (error)
    return res.redirect(
      302,
      home(req, "tiktok", "failed", String(description || error)),
    );
  if (!code || !saved?.nonce || Date.now() - saved.createdAt > 600000)
    return res.redirect(302, home(req, "tiktok", "failed", "session"));

  let stage = "token_exchange";
  try {
    let { clientId, clientSecret } = providerConfig("tiktok"),
      token = await readJson(
        await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_key: clientId,
            client_secret: clientSecret,
            code: String(code),
            grant_type: "authorization_code",
            redirect_uri: callbackUrl(req, "tiktok"),
          }),
        }),
        "TikTok could not exchange the authorization code",
      );
    stage = "profile";
    let profile = await readJson(
      await fetch(
        "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name",
        { headers: { Authorization: `Bearer ${token.access_token}` } },
      ),
      "TikTok connected, but the profile could not be read",
    );
    let user = profile.data?.user || {},
      maxAge = Math.min(token.refresh_expires_in || 31536000, 5184000);
    storeSession(
      res,
      "tiktok",
      {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: Date.now() + (token.expires_in || 86400) * 1000,
        refreshExpiresAt:
          Date.now() + (token.refresh_expires_in || 31536000) * 1000,
        scope: token.scope,
        openId: token.open_id || user.open_id,
        displayName: user.display_name || "TikTok creator",
        avatar: user.avatar_url || "",
      },
      maxAge,
    );
    return res.redirect(302, home(req, "tiktok", "connected"));
  } catch (error) {
    console.error(`TikTok OAuth failed at ${stage}`, error);
    storeError(res, "tiktok", stage, error);
    return res.redirect(302, home(req, "tiktok", "failed", stage));
  }
}
