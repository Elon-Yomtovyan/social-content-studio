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
  if (!configured("youtube"))
    return res.redirect(302, home(req, "youtube", "setup-required"));
  let { clientId } = providerConfig("youtube"),
    state = seal("youtube", {
      nonce: randomUUID(),
      createdAt: Date.now(),
    }),
    url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", callbackUrl(req, "youtube"));
  url.searchParams.set("response_type", "code");
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
  url.searchParams.set("state", state);
  return res.redirect(302, url.toString());
}
