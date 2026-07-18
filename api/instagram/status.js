import { cookie, unseal, callbackUrl } from "../_instagram.js";
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  let configured = Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET && process.env.INSTAGRAM_SESSION_SECRET), rawSession = configured ? cookie(req, "scs_instagram") : "", session = rawSession ? unseal(rawSession) : null;
  return res.status(200).json({
    configured,
    connected: Boolean(session?.accessToken),
    sessionState: !configured ? "not_configured" : !rawSession ? "missing_on_this_origin" : !session ? "unreadable" : "connected",
    account: session ? { username: session.username, accountType: session.accountType, profilePicture: session.profilePicture, mediaCount: session.mediaCount } : null,
    callbackUrl: callbackUrl(req),
  });
}
