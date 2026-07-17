import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const version = process.env.META_GRAPH_VERSION || "v25.0";
function secret() { return process.env.FACEBOOK_SESSION_SECRET || process.env.INSTAGRAM_SESSION_SECRET; }
function key() { let value = secret(); if (!value) throw new Error("FACEBOOK_SESSION_SECRET is missing"); return createHash("sha256").update(value).digest(); }
export function seal(value) { let iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", key(), iv), data = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]), tag = cipher.getAuthTag(); return [iv, tag, data].map((x) => x.toString("base64url")).join("."); }
export function unseal(value) { try { let [iv, tag, data] = (value || "").split(".").map((x) => Buffer.from(x, "base64url")), decipher = createDecipheriv("aes-256-gcm", key(), iv); decipher.setAuthTag(tag); return JSON.parse(Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8")); } catch { return null; } }
export function cookie(req, name) { return (req.headers.cookie || "").split(";").map((x) => x.trim()).find((x) => x.startsWith(name + "="))?.slice(name.length + 1) || ""; }
export function setCookie(name, value, maxAge) { return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`; }
export function origin(req) { let protocol = (req.headers["x-forwarded-proto"] || "https").split(",")[0], host = req.headers["x-forwarded-host"] || req.headers.host; return `${protocol}://${host}`; }
export function callbackUrl(req) { return `${origin(req)}/api/facebook/callback`; }
export function home(req, result) { return `${origin(req)}/?facebook=${result}`; }
export function graphUrl(path) { return `https://graph.facebook.com/${version}/${path}`; }
export function configured() { return Boolean(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET && secret()); }
