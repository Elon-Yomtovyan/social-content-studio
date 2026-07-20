import { createHash, timingSafeEqual } from "node:crypto";

export const maxDuration = 300;

const SYSTEM_STYLE = `Create a polished social composition in the approved Snapio style: bright warm-white or ivory canvas, deep navy typography, saturated cobalt-blue emphasis, generous negative space, rounded editorial image panels, thin pale borders and extremely subtle blue-gray depth. Use a clean information hierarchy with one concise message and premium visual proof. Typography is bold, friendly and rounded, with strong scale contrast. Photography is warm, softly sunlit, commercially realistic and neutral. Keep the layout calm, spacious and immediately understandable.

Do not create dark studio scenes, navy or black full backgrounds, dramatic spotlights, smoky glows, neon, high-contrast gradients, sci-fi visuals, poster-like effects, floating objects, busy collages or generic ad templates. Avoid excessive panels, copy, icons, arrows and labels. Render no more than 12 words total: one short headline and, only when necessary, one short supporting line. Typography must be crisp and correctly spelled.`;

function allowedOrigin(req) {
  let origin = req.headers.origin || "",
    own = `https://${req.headers.host}`;
  return origin === own || origin === process.env.ALLOWED_ORIGIN ? origin : "";
}
function authorized(req) {
  let expected = process.env.GENERATION_ACCESS_KEY || "",
    cookie = (req.headers.cookie || "")
      .split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith("scs_auth="))
      ?.slice(9) || "",
    valid = expected
      ? createHash("sha256").update(expected).digest("hex")
      : "";
  if (!cookie || !valid) return false;
  let a = Buffer.from(cookie),
    b = Buffer.from(valid);
  return a.length === b.length && timingSafeEqual(a, b);
}
function storyRole(index, count) {
  if (index === 0) return "OPEN — establish the campaign promise";
  if (index === count - 1)
    return "RESOLVE — complete the promise with a confident final beat";
  let middle = [
    "TENSION — show the customer problem or unmet need",
    "DISCOVERY — reveal the feature or mechanism that changes the situation",
    "PROOF — show a credible detail, transformation or outcome",
    "APPLICATION — show the idea naturally in use or context",
  ];
  return middle[Math.min(index - 1, middle.length - 1)];
}
function layoutFor(index, count) {
  if (index === 0)
    return "Use an airy left-message/right-proof cover with one dominant rounded visual frame.";
  if (index === count - 1)
    return "Use a simplified resolution layout with one dominant visual and a confident closing beat.";
  return [
    "Use a refined problem-to-solution composition with a restrained cobalt transition cue.",
    "Use a clean editorial grid with no more than four spacious, consistently rounded cells.",
    "Use a proof-led layout with one visual fact and a precise supporting detail.",
    "Use an editorial story layout with one hero scene and one close detail.",
  ][Math.min(index - 1, 3)];
}
function promptFor({
  idea,
  template,
  platform,
  brand,
  refinement,
  masked,
  materialNames,
  slideIndex,
  slideCount,
  coverReference,
  userSourceCount,
  carouselPlan,
}) {
  let slidePlan = carouselPlan?.[slideIndex] || null,
    message = idea?.message || "Communicate one clear premium benefit",
    headline = (
      slidePlan?.copy ??
      idea?.imageHeadline ??
      idea?.hook ??
      idea?.title ??
      ""
    ).trim(),
    support = slidePlan ? "" : (idea?.imageSupportingText || "").trim(),
    sourceRules = userSourceCount
      ? `USER SOURCE IMAGES: References 1–${userSourceCount} are the user's actual product and raw materials. Treat them as the only authority for product identity. Preserve the exact silhouette, color, construction, texture, pattern, hardware, proportions and branded details. Never replace the product with a similar one or invent an alternate version.`
      : `TEXT-ONLY CREATION: No product reference was supplied. Create an original, product-agnostic Snapio campaign visual from the approved concept. Use clean workflow graphics, abstract commerce objects, unbranded neutral products or restrained interface-style evidence as appropriate. Never invent a logo, customer quote, statistic, price, performance result, product capability or realistic screenshot of a feature that was not supplied.`,
    carousel =
      slideCount > 1
        ? `CAROUSEL STORY — SLIDE ${slideIndex + 1} OF ${slideCount}
Narrative role: ${storyRole(slideIndex, slideCount)}.
The series progresses once through promise → tension → discovery → proof/application → resolution. This slide adds one new beat; it must not restart the story or repeat the cover.
APPROVED STORY BEAT: ${slidePlan?.beat || "Advance the narrative role above with one new idea."}
APPROVED VISUAL DIRECTION: ${slidePlan?.visual || layoutFor(slideIndex, slideCount)}
VISUAL STORYTELLING RULE: The scene, action, expression, product use or visible consequence must communicate this beat before any copy is read. The words support the image; they cannot be the entire idea. Show a relatable moment with cause and effect, not a product placed beside a headline.
Follow this approved slide plan precisely. Do not substitute a generic product montage, a repeated packshot grid or another slide's message.
Layout: ${layoutFor(slideIndex, slideCount)}
${
  coverReference
    ? `The final reference image is the immediately previous approved carousel slide. Continue its visual world: match the product identity, protagonist when present, environment, canvas color, navy/cobalt palette, type scale, border radius, line weight, lighting, spacing and photographic finish. Advance the action or consequence; do not duplicate its composition.`
    : "Define a precise campaign system that every later slide can follow."
}
CONTINUITY LOCK: identical warm-white background family, navy/cobalt palette, rounded geometry, typography character, spacing rhythm, lighting and image finish across the entire series.`
        : `LAYOUT: ${layoutFor(0, 1)}`;
  return `${SYSTEM_STYLE}

OUTPUT: ${platform || "Instagram Feed"}.
CREATIVE INTENT: ${template || "Product Spotlight"}.
${carousel}
CORE CAMPAIGN MESSAGE: ${message}
BRAND: ${brand?.name || "Snapio AI"}; voice: ${brand?.voice || "clean, confident and premium"}.
${sourceRules}
SOURCE MATERIALS: ${(materialNames || []).join(", ") || "none — text-only creation"}.

EXACT ON-IMAGE COPY:
Headline: ${headline || "[NO HEADLINE]"}
Supporting line: ${support || "[NONE]"}
${headline ? "Render the headline exactly as written." : "Render no headline or other text."} Add no other words.

FINAL CHECK: bright, spacious, premium, internally consistent and immediately understandable; no dark poster aesthetic; no clutter; no unsupported claims.${
    refinement
      ? ` EDIT REQUEST: The first uploaded image is the current approved composition. Refine it—not a fresh redesign—using this direction: ${refinement}. Preserve everything not requested to change.${
          masked
            ? " A transparent mask marks the edit area. Concentrate the change there and preserve everything outside it."
            : ""
        }`
      : ""
  }`;
}
function validImage(value, max = 6_000_000) {
  return (
    typeof value === "string" &&
    value.startsWith("data:image/") &&
    value.length <= max
  );
}
async function openAIImage({ payload, hasInputs, slideIndex }) {
  let endpoint = hasInputs ? "edits" : "generations",
    response = await fetch(`https://api.openai.com/v1/images/${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }),
    body = await response.json();
  if (!response.ok) {
    let error = new Error(
      body?.error?.message || `Slide ${slideIndex + 1} generation failed`,
    );
    error.status = /billing|quota|hard limit/i.test(error.message)
      ? 402
      : response.status === 429
        ? 429
        : 502;
    throw error;
  }
  let image = body.data?.[0];
  if (!image?.b64_json)
    throw new Error(`Slide ${slideIndex + 1} returned no image`);
  return image.b64_json;
}

export default async function handler(req, res) {
  let origin = allowedOrigin(req);
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  if (req.method === "OPTIONS") {
    if (!origin) return res.status(403).end();
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(204).end();
  }
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });
  if (!origin) return res.status(403).json({ error: "Origin not allowed" });
  if (!authorized(req))
    return res.status(401).json({ error: "Invalid generation access key" });
  if (!process.env.OPENAI_API_KEY || !process.env.GENERATION_ACCESS_KEY)
    return res.status(500).json({ error: "Backend secrets are not configured" });
  try {
    let {
        image,
        images,
        coverImage,
        mask,
        idea,
        template,
        platform,
        brand,
        refinement,
        materialNames,
        carouselPlan: requestedCarouselPlan,
        count: requestedCount,
        slideIndex: requestedSlideIndex,
        slideCount: requestedSlideCount,
      } = req.body || {},
      sources = (Array.isArray(images) ? images : [image])
        .filter(Boolean)
        .slice(0, 4),
      count = refinement
        ? 1
        : Math.max(1, Math.min(6, Number(requestedCount) || 1)),
      carouselPlan = Array.isArray(requestedCarouselPlan)
        ? requestedCarouselPlan.slice(0, 6).map((slide) => ({
            role: String(slide?.role || "").slice(0, 60),
            beat: String(slide?.beat || "").slice(0, 800),
            copy: String(slide?.copy || "").slice(0, 120),
            visual: String(slide?.visual || "").slice(0, 1000),
          }))
        : [],
      campaignSlides = refinement
        ? 1
        : Math.max(
            count,
            Math.min(6, Number(requestedSlideCount) || count),
          );
    if (sources.some((source) => !validImage(source)))
      return res
        .status(400)
        .json({ error: "Use up to four valid product-reference images" });
    if (coverImage && !validImage(coverImage))
      return res.status(400).json({ error: "The carousel cover reference is invalid" });
    if (refinement && !sources.length)
      return res
        .status(400)
        .json({ error: "A generated image is required for refinement" });
    if (
      mask &&
      (!refinement ||
        !mask.startsWith("data:image/png;base64,") ||
        mask.length > 5_500_000)
    )
      return res.status(400).json({
        error: "The marked edit area is invalid. Mark the area again and retry.",
      });

    const createSlide = async (localIndex, continuityCover = null) => {
      let slideIndex = Number.isInteger(requestedSlideIndex)
          ? Math.max(0, Math.min(campaignSlides - 1, requestedSlideIndex))
          : localIndex,
        cover = coverImage || continuityCover,
        ordered = [...sources, ...(cover ? [cover] : [])],
        payload = {
          model: "gpt-image-2",
          prompt: promptFor({
            idea,
            template,
            platform,
            brand,
            refinement,
            masked: !!mask,
            materialNames,
            slideIndex,
            slideCount: campaignSlides,
            coverReference: !!cover,
            userSourceCount: sources.length,
            carouselPlan,
          }),
          n: 1,
          size: "1024x1024",
          quality: "high",
          output_format: "jpeg",
          output_compression: 90,
        };
      if (ordered.length)
        payload.images = ordered.map((image_url) => ({ image_url }));
      if (mask) payload.mask = { image_url: mask };
      let encoded = await openAIImage({
        payload,
        hasInputs: ordered.length > 0,
        slideIndex,
      });
      return {
        slideIndex,
        src: `data:image/jpeg;base64,${encoded}`,
        width: 1024,
        height: 1024,
        style:
          campaignSlides > 1
            ? `${storyRole(slideIndex, campaignSlides).split(" — ")[0]} · slide ${slideIndex + 1}`
            : "Generated result",
        platform: platform || "Instagram",
      };
    };

    let settled = [],
      continuityCover = coverImage || null;
    for (let index = 0; index < count; index++) {
      let actualIndex = Number.isInteger(requestedSlideIndex)
        ? requestedSlideIndex
        : index;
      try {
        let result = await createSlide(index, continuityCover);
        if (!continuityCover && actualIndex === 0) continuityCover = result.src;
        settled.push({ status: "fulfilled", value: result, index: actualIndex });
      } catch (error) {
        settled.push({ status: "rejected", reason: error, index: actualIndex });
        if (error.status === 402 || error.status === 429) throw error;
        if (actualIndex === 0 && count > 1) throw error;
      }
    }
    let outputImages = settled
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value)
        .sort((a, b) => a.slideIndex - b.slideIndex),
      failedSlides = settled
        .filter((result) => result.status === "rejected")
        .map((result) => ({
          slide: result.index + 1,
          error: result.reason?.message || "Generation failed",
        }));
    if (!outputImages.length)
      throw new Error(failedSlides[0]?.error || "No requested images could be generated");
    return res.status(200).json({
      images: outputImages,
      requested: count,
      failedSlides,
      partial: failedSlides.length > 0,
      storyDriven: campaignSlides > 1,
    });
  } catch (error) {
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Generation failed" });
  }
}
