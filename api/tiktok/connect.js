import { randomUUID } from "node:crypto";
import {
  callbackUrl,
  configured,
  home,
  providerConfig,
  seal,
} from "../_social.js";

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });
  if (!configured("tiktok"))
    return res.redirect(302, home(req, "tiktok", "setup-required"));
  let { clientId } = providerConfig("tiktok"),
    state = seal("tiktok", {
      nonce: randomUUID(),
      createdAt: Date.now(),
    }),
    url = new URL("https://www.tiktok.com/v2/auth/authorize/");
  url.searchParams.set("client_key", clientId);
  url.searchParams.set("redirect_uri", callbackUrl(req, "tiktok"));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "user.info.basic,video.publish");
  url.searchParams.set("state", state);
  return res.redirect(302, url.toString());
}
