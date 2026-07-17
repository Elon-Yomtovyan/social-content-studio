import { callbackUrl, configured, cookie, graphUrl, setCookie, unseal } from "../_facebook.js";

export default async function handler(req, res) {
  let action = String(req.query.action || "status"), ready = configured(), session = ready ? unseal(cookie(req, "scs_facebook")) : null;
  if (action === "status" && req.method === "GET") return res.status(200).json({ configured: ready, connected: Boolean(session?.accessToken), account: session ? { id: session.id, name: session.name, picture: session.picture } : null, callbackUrl: callbackUrl(req) });
  if (action === "disconnect" && req.method === "POST") { res.setHeader("Set-Cookie", setCookie("scs_facebook", "", 0)); return res.status(204).end(); }
  if (action === "test" && req.method === "GET") {
    if (!session?.accessToken) return res.status(401).json({ error: "Facebook is not connected" });
    try { let url = new URL(graphUrl(session.id)); url.searchParams.set("fields", "id,name"); url.searchParams.set("access_token", session.accessToken); let response = await fetch(url), body = await response.json(); if (!response.ok) throw new Error(body.error?.message || "Facebook rejected the connection"); return res.status(200).json({ valid: true, id: body.id, name: body.name }); }
    catch (error) { return res.status(502).json({ valid: false, error: error.message }); }
  }
  return res.status(405).json({ error: "Method or action not allowed" });
}
