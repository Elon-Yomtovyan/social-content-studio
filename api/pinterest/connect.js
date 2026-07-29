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
  if (!configured("pinterest"))
    return res.redirect(302, home(req, "pinterest", "setup-required"));

  let { clientId } = providerConfig("pinterest"),
    state = seal("pinterest", {
      nonce: randomUUID(),
      createdAt: Date.now(),
    }),
    url = new URL("https://www.pinterest.com/oauth/");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", callbackUrl(req, "pinterest"));
  url.searchParams.set("response_type", "code");
  url.searchParams.set(
    "scope",
    "user_accounts:read,boards:read,pins:read,pins:write",
  );
  url.searchParams.set("state", state);
  return res.redirect(302, url.toString());
}
