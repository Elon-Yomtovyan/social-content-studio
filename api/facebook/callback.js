import { callbackUrl, graphUrl, home, seal, setCookie, unseal } from "../_facebook.js";

async function read(response) { let body = await response.json(); if (!response.ok) throw new Error(body.error?.message || "Meta request failed"); return body; }
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  let { code, state } = req.query, saved = unseal(String(state || ""));
  if (!code || !saved?.nonce || Date.now() - saved.createdAt > 600000) return res.redirect(302, home(req, "failed&reason=session"));
  let stage = "token_exchange";
  try {
    let tokenUrl = new URL(graphUrl("oauth/access_token"));
    tokenUrl.searchParams.set("client_id", process.env.FACEBOOK_APP_ID); tokenUrl.searchParams.set("client_secret", process.env.FACEBOOK_APP_SECRET); tokenUrl.searchParams.set("redirect_uri", callbackUrl(req)); tokenUrl.searchParams.set("code", String(code));
    let short = await read(await fetch(tokenUrl)), longUrl = new URL(graphUrl("oauth/access_token"));
    stage = "long_lived_token";
    longUrl.searchParams.set("grant_type", "fb_exchange_token"); longUrl.searchParams.set("client_id", process.env.FACEBOOK_APP_ID); longUrl.searchParams.set("client_secret", process.env.FACEBOOK_APP_SECRET); longUrl.searchParams.set("fb_exchange_token", short.access_token);
    let long = await read(await fetch(longUrl)), pagesUrl = new URL(graphUrl("me/accounts"));
    stage = "page_access";
    pagesUrl.searchParams.set("fields", "id,name,access_token,picture{url},tasks"); pagesUrl.searchParams.set("limit", "100"); pagesUrl.searchParams.set("access_token", long.access_token);
    let pages = (await read(await fetch(pagesUrl))).data || [], page = pages.find((p) => !p.tasks || p.tasks.includes("CREATE_CONTENT")) || pages[0];
    if (!page?.access_token) throw new Error("No Facebook Page with publishing access was found. Grant pages_show_list and pages_manage_posts, and confirm your Facebook profile has full control of the Page.");
    let maxAge = long.expires_in || 5184000, value = seal({ id: page.id, name: page.name, picture: page.picture?.data?.url || "", accessToken: page.access_token, userAccessToken: long.access_token, expiresAt: Date.now() + maxAge * 1000 });
    res.setHeader("Set-Cookie", [setCookie("scs_facebook", value, maxAge), setCookie("scs_facebook_error", "", 0)]);
    return res.redirect(302, home(req, "connected"));
  } catch (error) {
    console.error(`Facebook OAuth failed at ${stage}`, error);
    let safeMessage = String(error.message || "Meta authorization failed").replace(/EAA[A-Za-z0-9_-]+/g, "[redacted]").slice(0, 400), diagnostic = seal({ stage, message: safeMessage, at: Date.now() });
    res.setHeader("Set-Cookie", setCookie("scs_facebook_error", diagnostic, 600));
    return res.redirect(302, home(req, `failed&reason=${stage}`));
  }
}
