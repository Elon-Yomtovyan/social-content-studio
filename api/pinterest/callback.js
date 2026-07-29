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
    saved = unseal("pinterest", state);
  if (error)
    return res.redirect(
      302,
      home(req, "pinterest", "failed", String(description || error)),
    );
  if (!code || !saved?.nonce || Date.now() - saved.createdAt > 600000)
    return res.redirect(302, home(req, "pinterest", "failed", "session"));

  let stage = "token_exchange";
  try {
    let { clientId, clientSecret } = providerConfig("pinterest"),
      token = await readJson(
        await fetch("https://api.pinterest.com/v5/oauth/token", {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code: String(code),
            redirect_uri: callbackUrl(req, "pinterest"),
          }),
        }),
        "Pinterest could not exchange the authorization code",
      );
    stage = "profile";
    let profile = await readJson(
      await fetch("https://api.pinterest.com/v5/user_account", {
        headers: { Authorization: `Bearer ${token.access_token}` },
      }),
      "Pinterest connected, but the profile could not be read",
    );
    let maxAge = Math.min(
      token.refresh_token_expires_in || 5184000,
      5184000,
    );
    storeSession(
      res,
      "pinterest",
      {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: Date.now() + (token.expires_in || 2592000) * 1000,
        scope: token.scope,
        id: profile.id || profile.username,
        username: profile.username || profile.business_name || "Pinterest",
        accountType: profile.account_type || "Pinterest account",
        profileImage: profile.profile_image || "",
      },
      maxAge,
    );
    return res.redirect(302, home(req, "pinterest", "connected"));
  } catch (error) {
    console.error(`Pinterest OAuth failed at ${stage}`, error);
    storeError(res, "pinterest", stage, error);
    return res.redirect(302, home(req, "pinterest", "failed", stage));
  }
}
