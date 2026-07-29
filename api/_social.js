import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const providers = {
  pinterest: {
    id: "PINTEREST_APP_ID",
    secret: "PINTEREST_APP_SECRET",
  },
  tiktok: {
    id: "TIKTOK_CLIENT_KEY",
    secret: "TIKTOK_CLIENT_SECRET",
  },
  youtube: {
    id: "YOUTUBE_CLIENT_ID",
    secret: "YOUTUBE_CLIENT_SECRET",
  },
};

export function providerConfig(provider) {
  let names = providers[provider];
  if (!names) throw new Error(`Unsupported provider: ${provider}`);
  return {
    clientId: process.env[names.id],
    clientSecret: process.env[names.secret],
    idVariable: names.id,
    secretVariable: names.secret,
  };
}

function sessionSecret(provider) {
  return (
    process.env[`${provider.toUpperCase()}_SESSION_SECRET`] ||
    process.env.SOCIAL_SESSION_SECRET ||
    process.env.INSTAGRAM_SESSION_SECRET
  );
}

function key(provider) {
  let value = sessionSecret(provider);
  if (!value)
    throw new Error(
      `SOCIAL_SESSION_SECRET or ${provider.toUpperCase()}_SESSION_SECRET is missing`,
    );
  return createHash("sha256").update(value).digest();
}

export function configured(provider) {
  let config = providerConfig(provider);
  return Boolean(config.clientId && config.clientSecret && sessionSecret(provider));
}

export function seal(provider, value) {
  let iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key(provider), iv),
    data = Buffer.concat([
      cipher.update(JSON.stringify(value), "utf8"),
      cipher.final(),
    ]),
    tag = cipher.getAuthTag();
  return [iv, tag, data]
    .map((part) => part.toString("base64url"))
    .join(".");
}

export function unseal(provider, value) {
  try {
    let [iv, tag, data] = String(value || "")
        .split(".")
        .map((part) => Buffer.from(part, "base64url")),
      decipher = createDecipheriv("aes-256-gcm", key(provider), iv);
    decipher.setAuthTag(tag);
    return JSON.parse(
      Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8"),
    );
  } catch {
    return null;
  }
}

export function cookie(req, name) {
  return (
    (req.headers.cookie || "")
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`))
      ?.slice(name.length + 1) || ""
  );
}

export function setCookie(name, value, maxAge) {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function origin(req) {
  let protocol = String(req.headers["x-forwarded-proto"] || "https").split(",")[0],
    host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${protocol}://${host}`;
}

export function callbackUrl(req, provider) {
  return `${origin(req)}/api/${provider}/callback`;
}

export function home(req, provider, result, reason = "") {
  let url = new URL(origin(req));
  url.searchParams.set(provider, result);
  if (reason) url.searchParams.set("reason", reason);
  return url.toString();
}

export function sessionCookie(provider) {
  return `scs_${provider}`;
}

export function errorCookie(provider) {
  return `scs_${provider}_error`;
}

export function safeMessage(error) {
  return String(error?.message || "Authorization failed")
    .replace(
      /(?:access|refresh|client)[_-]?token["'=:\s]+[A-Za-z0-9._~-]+/gi,
      "[redacted token]",
    )
    .slice(0, 450);
}

export async function readJson(response, fallback = "Platform request failed") {
  let body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      body.error_description ||
        body.error?.message ||
        body.message ||
        body.error ||
        fallback,
    );
  return body;
}

export function providerStatus(req, provider) {
  let ready = configured(provider),
    raw = ready ? cookie(req, sessionCookie(provider)) : "",
    session = raw ? unseal(provider, raw) : null,
    diagnostic = ready
      ? unseal(provider, cookie(req, errorCookie(provider)))
      : null;
  return {
    ready,
    raw,
    session,
    diagnostic:
      diagnostic && Date.now() - diagnostic.at < 600000 ? diagnostic : null,
  };
}

export function storeSession(res, provider, session, maxAge) {
  res.setHeader("Set-Cookie", [
    setCookie(sessionCookie(provider), seal(provider, session), maxAge),
    setCookie(errorCookie(provider), "", 0),
  ]);
}

export function storeError(res, provider, stage, error) {
  res.setHeader(
    "Set-Cookie",
    setCookie(
      errorCookie(provider),
      seal(provider, {
        stage,
        message: safeMessage(error),
        at: Date.now(),
      }),
      600,
    ),
  );
}

export function clearSession(res, provider) {
  res.setHeader("Set-Cookie", [
    setCookie(sessionCookie(provider), "", 0),
    setCookie(errorCookie(provider), "", 0),
  ]);
}
