import { randomUUID } from "node:crypto";
import { callbackUrl, configured, graphUrl, home, seal } from "../_facebook.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!configured()) return res.redirect(302, home(req, "setup-required"));
  let state = seal({ nonce: randomUUID(), createdAt: Date.now() }), url = new URL(graphUrl("dialog/oauth").replace("graph.facebook.com", "www.facebook.com"));
  url.searchParams.set("client_id", process.env.FACEBOOK_APP_ID);
  url.searchParams.set("redirect_uri", callbackUrl(req));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "pages_show_list,pages_read_engagement,pages_manage_posts");
  url.searchParams.set("state", state);
  return res.redirect(302, url.toString());
}
