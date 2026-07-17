import { setCookie } from "../_facebook.js";
export default async function handler(req, res) { if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" }); res.setHeader("Set-Cookie", setCookie("scs_facebook", "", 0)); return res.status(204).end(); }
