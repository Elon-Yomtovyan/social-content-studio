import { randomUUID } from "node:crypto";
import {
  callbackUrl,
  clearSession,
  configured,
  home,
  providerConfig,
  providerStatus,
  readJson,
  sessionCookie,
  setCookie,
  seal,
  storeError,
  storeSession,
  unseal,
} from "./_social.js";

const supported = new Set(["pinterest", "tiktok", "youtube"]);

function route(req) {
  let provider = String(req.query.provider || "").toLowerCase(),
    action = String(req.query.action || "").toLowerCase();
  if (!supported.has(provider)) throw new Error("Unsupported provider");
  return { provider, action };
}

function requiredEnvironment(provider) {
  return {
    pinterest: [
      "PINTEREST_APP_ID",
      "PINTEREST_APP_SECRET",
      "SOCIAL_SESSION_SECRET",
    ],
    tiktok: [
      "TIKTOK_CLIENT_KEY",
      "TIKTOK_CLIENT_SECRET",
      "SOCIAL_SESSION_SECRET",
    ],
    youtube: [
      "YOUTUBE_CLIENT_ID",
      "YOUTUBE_CLIENT_SECRET",
      "SOCIAL_SESSION_SECRET",
    ],
  }[provider];
}

function publicAccount(provider, session) {
  if (!session) return null;
  if (provider === "pinterest")
    return {
      id: session.id,
      username: session.username,
      accountType: session.accountType,
      picture: session.profileImage,
    };
  if (provider === "tiktok")
    return {
      id: session.openId,
      username: session.displayName,
      picture: session.avatar,
      accountType: "TikTok creator",
    };
  return {
    id: session.channelId,
    username: session.channelTitle,
    picture: session.picture,
    accountType: "YouTube channel",
  };
}

async function refresh(provider, session) {
  if (session.expiresAt > Date.now() + 300000) return session;
  if (!session.refreshToken)
    throw new Error(`${provider} needs to be reconnected`);
  let { clientId, clientSecret } = providerConfig(provider),
    token;
  if (provider === "pinterest")
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
  else if (provider === "tiktok")
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
  else
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
    refreshToken: token.refresh_token || session.refreshToken,
    expiresAt:
      Date.now() +
      (token.expires_in || (provider === "pinterest" ? 2592000 : 3600)) * 1000,
    refreshExpiresAt: token.refresh_expires_in
      ? Date.now() + token.refresh_expires_in * 1000
      : session.refreshExpiresAt,
    scope: token.scope || session.scope,
  };
}

async function profile(provider, accessToken) {
  if (provider === "pinterest")
    return readJson(
      await fetch("https://api.pinterest.com/v5/user_account", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
      "Pinterest rejected the connection",
    );
  if (provider === "tiktok")
    return readJson(
      await fetch(
        "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name",
        { headers: { Authorization: `Bearer ${accessToken}` } },
      ),
      "TikTok rejected the connection",
    );
  return readJson(
    await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    ),
    "YouTube rejected the connection",
  );
}

async function connect(req, res, provider) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });
  if (!configured(provider))
    return res.redirect(302, home(req, provider, "setup-required"));
  let { clientId } = providerConfig(provider),
    state = seal(provider, { nonce: randomUUID(), createdAt: Date.now() }),
    url;
  if (provider === "pinterest") {
    url = new URL("https://www.pinterest.com/oauth/");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("scope", "user_accounts:read,boards:read,pins:read,pins:write");
  } else if (provider === "tiktok") {
    url = new URL("https://www.tiktok.com/v2/auth/authorize/");
    url.searchParams.set("client_key", clientId);
    url.searchParams.set("scope", "user.info.basic,video.publish");
  } else {
    url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set(
      "scope",
      [
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/youtube.upload",
      ].join(" "),
    );
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("include_granted_scopes", "true");
    url.searchParams.set("prompt", "consent");
  }
  url.searchParams.set("redirect_uri", callbackUrl(req, provider));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  return res.redirect(302, url.toString());
}

async function exchange(provider, code, req) {
  let { clientId, clientSecret } = providerConfig(provider),
    endpoint =
      provider === "pinterest"
        ? "https://api.pinterest.com/v5/oauth/token"
        : provider === "tiktok"
          ? "https://open.tiktokapis.com/v2/oauth/token/"
          : "https://oauth2.googleapis.com/token",
    headers = { "Content-Type": "application/x-www-form-urlencoded" },
    values = {
      code: String(code),
      grant_type: "authorization_code",
      redirect_uri: callbackUrl(req, provider),
    };
  if (provider === "pinterest")
    headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
  else if (provider === "tiktok") {
    values.client_key = clientId;
    values.client_secret = clientSecret;
  } else {
    values.client_id = clientId;
    values.client_secret = clientSecret;
  }
  return readJson(
    await fetch(endpoint, {
      method: "POST",
      headers,
      body: new URLSearchParams(values),
    }),
    `${provider} could not exchange the authorization code`,
  );
}

async function callback(req, res, provider) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });
  let { code, state, error, error_description: description } = req.query,
    saved = unseal(provider, state);
  if (error)
    return res.redirect(
      302,
      home(req, provider, "failed", String(description || error)),
    );
  if (!code || !saved?.nonce || Date.now() - saved.createdAt > 600000)
    return res.redirect(302, home(req, provider, "failed", "session"));
  let stage = "token_exchange";
  try {
    let token = await exchange(provider, code, req);
    stage = provider === "youtube" ? "channel" : "profile";
    let details = await profile(provider, token.access_token),
      session,
      maxAge = 5184000;
    if (provider === "pinterest") {
      maxAge = Math.min(token.refresh_token_expires_in || maxAge, maxAge);
      session = {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: Date.now() + (token.expires_in || 2592000) * 1000,
        scope: token.scope,
        id: details.id || details.username,
        username: details.username || details.business_name || "Pinterest",
        accountType: details.account_type || "Pinterest account",
        profileImage: details.profile_image || "",
      };
    } else if (provider === "tiktok") {
      let user = details.data?.user || {};
      maxAge = Math.min(token.refresh_expires_in || 31536000, maxAge);
      session = {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: Date.now() + (token.expires_in || 86400) * 1000,
        refreshExpiresAt:
          Date.now() + (token.refresh_expires_in || 31536000) * 1000,
        scope: token.scope,
        openId: token.open_id || user.open_id,
        displayName: user.display_name || "TikTok creator",
        avatar: user.avatar_url || "",
      };
    } else {
      let channel = details.items?.[0];
      if (!channel?.id)
        throw new Error(
          "No YouTube channel was found for this Google account. Create or select a channel, then reconnect.",
        );
      session = {
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
      };
    }
    storeSession(res, provider, session, maxAge);
    return res.redirect(302, home(req, provider, "connected"));
  } catch (error) {
    console.error(`${provider} OAuth failed at ${stage}`, error);
    storeError(res, provider, stage, error);
    return res.redirect(302, home(req, provider, "failed", stage));
  }
}

async function account(req, res, provider) {
  let requested = String(req.query.mode || "status"),
    { ready, raw, session, diagnostic } = providerStatus(req, provider);
  if (requested === "status" && req.method === "GET")
    return res.status(200).json({
      configured: ready,
      connected: Boolean(
        session?.accessToken &&
          (provider !== "youtube" || session?.channelId),
      ),
      sessionState: !ready
        ? "not_configured"
        : raw && !session
          ? "unreadable"
          : session?.accessToken
            ? "connected"
            : "missing",
      account: publicAccount(provider, session),
      lastError: diagnostic,
      callbackUrl: callbackUrl(req, provider),
      requiredEnvironment: requiredEnvironment(provider),
    });
  if (requested === "disconnect" && req.method === "POST") {
    clearSession(res, provider);
    return res.status(204).end();
  }
  if (requested === "test" && req.method === "GET") {
    if (!session?.accessToken)
      return res.status(401).json({ error: `${provider} is not connected` });
    try {
      let active = await refresh(provider, session);
      if (active.accessToken !== session.accessToken)
        res.setHeader(
          "Set-Cookie",
          setCookie(
            sessionCookie(provider),
            seal(provider, active),
            5184000,
          ),
        );
      let details = await profile(provider, active.accessToken),
        current =
          provider === "pinterest"
            ? { id: details.id, name: details.username }
            : provider === "tiktok"
              ? {
                  id: details.data?.user?.open_id,
                  name: details.data?.user?.display_name,
                }
              : {
                  id: details.items?.[0]?.id,
                  name: details.items?.[0]?.snippet?.title,
                };
      if (!current.id) throw new Error(`No ${provider} account was found`);
      return res.status(200).json({ valid: true, ...current });
    } catch (error) {
      return res.status(502).json({ valid: false, error: error.message });
    }
  }
  return res.status(405).json({ error: "Method or action not allowed" });
}

export default async function handler(req, res) {
  try {
    let { provider, action } = route(req);
    if (action === "connect") return connect(req, res, provider);
    if (action === "callback") return callback(req, res, provider);
    if (action === "account") return account(req, res, provider);
    return res.status(404).json({ error: "Unknown social integration route" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
