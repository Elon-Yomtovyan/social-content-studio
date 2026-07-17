import { cookie, graphUrl, origin, unseal } from "../_facebook.js";
export const maxDuration = 120;

function sameOrigin(req) { return (req.headers.origin || "") === origin(req); }
async function read(response) { let body = await response.json(); if (!response.ok) throw new Error(body.error?.message || "Facebook publishing request failed"); return body; }
function decode(image, index) {
  if (!image?.startsWith("data:image/") || image.length > 12_000_000) throw new Error(`Image ${index + 1} is missing or too large`);
  let match = image.match(/^data:(image\/(?:jpeg|jpg|png));base64,(.+)$/);
  if (!match) throw new Error(`Image ${index + 1} must be JPG or PNG`);
  return { type: match[1].replace("jpg", "jpeg"), bytes: Buffer.from(match[2], "base64") };
}
async function uploadPhoto(pageId, accessToken, image, index, published, caption = "") {
  let decoded = decode(image, index), form = new FormData();
  form.set("source", new Blob([decoded.bytes], { type: decoded.type }), `social-content-${index + 1}.${decoded.type === "image/png" ? "png" : "jpg"}`);
  form.set("published", String(published));
  form.set("access_token", accessToken);
  if (caption) form.set("caption", caption.slice(0, 63206));
  return read(await fetch(graphUrl(`${pageId}/photos`), { method: "POST", body: form }));
}
async function createFeedPost(pageId, accessToken, message, photos) {
  let form = new URLSearchParams({ message: (message || "").slice(0, 63206), access_token: accessToken });
  photos.forEach((photo, i) => form.set(`attached_media[${i}]`, JSON.stringify({ media_fbid: photo.id })));
  return read(await fetch(graphUrl(`${pageId}/feed`), { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form }));
}
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!sameOrigin(req)) return res.status(403).json({ error: "Origin not allowed" });
  let session = unseal(cookie(req, "scs_facebook"));
  if (!session?.accessToken || !session?.id) return res.status(401).json({ error: "Connect a Facebook Page in Settings first" });
  try {
    let { image, images, caption } = req.body || {}, media = (Array.isArray(images) && images.length ? images : [image]).filter(Boolean).slice(0, 10);
    if (!media.length) return res.status(400).json({ error: "Finished media is required" });
    let published;
    if (media.length === 1) published = await uploadPhoto(session.id, session.accessToken, media[0], 0, true, caption || "");
    else {
      let photos = [];
      for (let i = 0; i < media.length; i++) photos.push(await uploadPhoto(session.id, session.accessToken, media[i], i, false));
      published = await createFeedPost(session.id, session.accessToken, caption || "", photos);
    }
    let postId = published.post_id || published.id;
    return res.status(200).json({ published: true, postId, mediaId: published.id, pageName: session.name, permalink: `https://www.facebook.com/${postId.replace("_", "/posts/")}`, timestamp: new Date().toISOString(), carousel: media.length > 1 });
  } catch (error) {
    console.error("Facebook publish failed", error);
    return res.status(502).json({ error: error.message || "Facebook publishing failed" });
  }
}
