"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as I from "lucide-react";
import { unzip } from "fflate";
import "./enhanced.css";
import "./ai.css";
import "./backend.css";
import "./security.css";
import "./session.css";
import "./calendar.css";
import "./calendar-actions.css";
import "./settings.css";
import "./jobs.css";
import "./refinement.css";
import "./workflow.css";
import "./facebook.css";
import "./placements.css";
import "./storage.css";
// Client persistence is unavailable during the server-rendering pass.
// A no-op server shim keeps the initial render deterministic; the browser
// immediately uses its native localStorage implementation during hydration.
if (typeof globalThis.localStorage === "undefined")
  globalThis.localStorage = { getItem: () => null, setItem: () => {} };
if (typeof Storage !== "undefined" && !globalThis.__scsSafeStorage) {
  globalThis.__scsSafeStorage = true;
  let original = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    try {
      return original.call(this, key, value);
    } catch (error) {
      if (
        error?.name === "QuotaExceededError" ||
        error?.name === "NS_ERROR_DOM_QUOTA_REACHED"
      ) {
        console.warn(
          "Browser storage is full; the current session remains available.",
        );
        return;
      }
      throw error;
    }
  };
}
// Keep dismissal behavior consistent for drawers, dialogs and nested pickers.
// The guard prevents duplicate listeners during development hot reloads.
if (typeof document !== "undefined" && !globalThis.__scsOutsideDismiss) {
  globalThis.__scsOutsideDismiss = true;
  document.addEventListener("mousedown", (e) => {
    let picker = document.querySelector(".assetPicker");
    if (picker && !picker.contains(e.target)) {
      picker.querySelector(".icon")?.click();
      return;
    }
    let backdrop = e.target.closest?.(".overlay,.modalback");
    if (!backdrop || backdrop !== e.target) return;
    let close = backdrop.querySelector(
      ".workspace .workHead .icon,.publishDetail .publishHead .icon,.drawer .drawerHead .icon,.assetPreview>.icon,.modal button",
    );
    close?.click();
  });
}
const platforms = [
  "Instagram",
  "LinkedIn",
  "Facebook",
  "TikTok",
  "X",
  "YouTube Shorts",
];
const ideaPlacements = {
  Instagram: ["Instagram Feed", "Instagram Story", "Instagram Reel"],
  Facebook: ["Facebook Feed", "Facebook Story"],
  LinkedIn: ["LinkedIn"],
  TikTok: ["TikTok"],
  X: ["X"],
  "YouTube Shorts": ["YouTube Shorts"],
};
const firstPlacement = (platform) => ideaPlacements[platform]?.[0] || platform;
const ideaPillars = [
  "Education",
  "Social proof",
  "Product feature",
  "Culture / BTS",
  "Promo",
  "Trend-jack",
];
const ideaFormats = [
  "Single image",
  "Carousel",
  "Story frame",
  "Quote card",
  "Screenshot / UI mock",
  "Meme",
];
function hashtagToken(value) {
  return String(value || "")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}
function placementDimensions(placement) {
  let specs = {
    "Instagram Feed": "1080 × 1350 px · 4:5 portrait",
    "Instagram Story": "1080 × 1920 px · 9:16 vertical",
    "Instagram Reel": "1080 × 1920 px · 9:16 vertical",
    "Facebook Feed": "1080 × 1350 px · 4:5 portrait",
    "Facebook Story": "1080 × 1920 px · 9:16 vertical",
    LinkedIn: "1200 × 1500 px · 4:5 portrait",
    TikTok: "1080 × 1920 px · 9:16 vertical",
    X: "1600 × 900 px · 16:9 landscape",
    "YouTube Shorts": "1080 × 1920 px · 9:16 vertical",
  };
  return specs[placement] || "1080 × 1350 px · 4:5 portrait";
}
const runtimeId =
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `runtime-${Date.now()}-${Math.random()}`;
const seedIdeas = [
  [
    "Turn one product photo into a full campaign",
    "One photo. Six campaign-ready visuals.",
    "Show how a single upload becomes a complete, consistent content kit.",
    "Range or kit reveal",
    "Carousel",
    "Kit Grid",
  ],
  [
    "The 15-minute product launch",
    "Your next launch does not need a studio day.",
    "Contrast a traditional shoot with an AI-led launch workflow.",
    "Pain point to transformation",
    "Short video",
    "Proof Split",
  ],
  [
    "What consistency actually looks like",
    "Same product. Every channel. Still unmistakably you.",
    "Demonstrate brand consistency across multiple social formats.",
    "Quantified proof",
    "Carousel",
    "Quantified Proof",
  ],
  [
    "Stop settling for flat product shots",
    "Your product deserves context, not clutter.",
    "Reveal a plain packshot transformed into an editorial scene.",
    "Before and after",
    "Single image",
    "Before and After Reveal",
  ],
  [
    "The feature behind faster creative testing",
    "Create more directions before choosing one.",
    "Explain how rapid variations improve creative decisions.",
    "Feature breakdown",
    "Carousel",
    "Feature Breakdown",
  ],
  [
    "From rough input to ready-to-post",
    "Watch an unfinished idea become tomorrow’s post.",
    "A simple walkthrough of the content creation flow.",
    "Tutorial",
    "Short video",
    "How It Works",
  ],
];
const mk = (a, i) => ({
  id: "i" + i,
  title: a[0],
  hook: a[1],
  message: a[2],
  angle: a[3],
  format: a[4],
  template: a[5],
  platforms: i % 2 ? ["LinkedIn", "Instagram"] : ["Instagram", "TikTok"],
  materials: ["Product image", "Logo", "CTA"],
  why: "A clear visual contrast makes the value immediate and easy to remember.",
  status: i < 3 ? "approved" : "review",
  created: Date.now() - i * 9e6,
  revisions: [],
});

const strategicRecipes = [
  {
    role: "Decision guide",
    angle: "Comparison",
    format: "Carousel",
    template: "Comparison",
    title: (f) => `How to know when ${f.product} is the right choice`,
    insight: (f) => `${f.audience} need decision criteria, not another list of features.`,
    message: (f) => `Give ${f.audience} a practical way to recognize the situations where ${f.product} adds the most value.`,
    hook: () => "Is this right for you?",
    support: () => "Use these three decision signals.",
    direction: (f) => `A clean decision tree built around three real use situations. Each slide answers one question and shows the relevant ${f.product} evidence beside it.`,
    why: () => "Decision criteria earn saves and shares because they help the audience make a real choice without forcing a sales claim.",
  },
  {
    role: "Objection reversal",
    angle: "Myth versus fact",
    format: "Carousel",
    template: "Proof Split",
    title: (f) => `The strongest objection to ${f.product}—answered visually`,
    insight: (f) => `${f.audience} are likely holding back because one risk feels larger than the promised benefit.`,
    message: (f) => `Address the most credible hesitation about ${f.product} with a transparent side-by-side demonstration.`,
    hook: () => "The concern is valid.",
    support: () => "Here is what actually changes.",
    direction: (f) => `Open with the objection in the audience's words, then show a controlled before/after or process comparison using the same ${f.product} source material throughout.`,
    why: () => "Acknowledging a real concern builds more trust than dismissing it, while the controlled comparison makes the answer believable.",
  },
  {
    role: "Practical tutorial",
    angle: "Tutorial",
    format: "Carousel",
    template: "How It Works",
    title: (f) => `A repeatable ${f.product} workflow for ${f.audience}`,
    insight: (f) => `${f.audience} value a usable process they can try today more than broad inspiration.`,
    message: (f) => `Turn ${f.product} into a short, repeatable workflow with a clear input, decision point, and finished output.`,
    hook: () => "Use this workflow.",
    support: () => "Input → decision → finished result.",
    direction: (f) => `A sequential four-beat carousel: raw input, the important choice, the transformation, and the finished ${f.product} outcome. Keep each slide focused on one action.`,
    why: () => "A compact process demonstrates competence and gives the audience an immediate reason to save the post.",
  },
  {
    role: "Proof experiment",
    angle: "Quantified proof",
    format: "Single image",
    template: "Quantified Proof",
    title: (f) => `Put one ${f.product} claim to a visible test`,
    insight: (f) => `${f.audience} trust evidence they can inspect more than unsupported performance language.`,
    message: (f) => `Choose one outcome connected to ${f.objective.toLowerCase()} and show the inputs, constraint, and observable result without invented numbers.`,
    hook: () => "One input. One test.",
    support: () => "Judge the result for yourself.",
    direction: (f) => `A spacious proof board showing the original input, the test condition, and the ${f.product} output. Use labels only for evidence the user actually supplied.`,
    why: () => "A transparent test creates credibility and conversation without relying on fabricated statistics or exaggerated claims.",
  },
  {
    role: "Diagnostic",
    angle: "Problem and solution",
    format: "Carousel",
    template: "Feature Breakdown",
    title: (f) => `Three signs your current approach needs ${f.product}`,
    insight: (f) => `${f.audience} often feel the symptoms of a problem before they know how to name it.`,
    message: (f) => `Help the audience diagnose three observable friction points, then connect each one to a specific ${f.product} use.`,
    hook: () => "Spot the bottleneck.",
    support: () => "Three signals to look for.",
    direction: (f) => `Three diagnostic cards with a concrete symptom, what it costs the workflow, and the corresponding ${f.product} action. Finish with a simple self-check.`,
    why: () => "Diagnostic content creates recognition before presenting the solution, making the product feel relevant rather than interruptive.",
  },
  {
    role: "Behind the decision",
    angle: "Behind the scenes",
    format: "Short video",
    template: "Feature Breakdown",
    title: (f) => `What we would check before using ${f.product}`,
    insight: (f) => `${f.audience} want to see the judgment behind a polished result, not only the result itself.`,
    message: (f) => `Reveal the quality criteria and tradeoffs that guide a strong ${f.product} outcome.`,
    hook: () => "The result starts here.",
    support: () => "Three choices that shape the outcome.",
    direction: (f) => `A concise behind-the-scenes sequence that pauses on three decision points. Pair each choice with a visual example from the supplied ${f.product} materials.`,
    why: () => "Showing expert judgment makes the content educational and differentiates the product through process rather than hype.",
  },
  {
    role: "Use-case reveal",
    angle: "Pain point to transformation",
    format: "Single image",
    template: "Before and After Reveal",
    title: (f) => `${f.product} at the exact moment it becomes useful`,
    insight: (f) => `${f.audience} understand value fastest when they recognize a specific moment from their own work.`,
    message: (f) => `Show one high-friction moment and the concrete before/after change created by ${f.product}.`,
    hook: () => "When the brief changes late.",
    support: () => "Turn the constraint into the next version.",
    direction: (f) => `A premium split composition: the recognizable constraint on the left and the resolved ${f.product} outcome on the right, connected by one restrained transition cue.`,
    why: () => "A precise use moment is easier to identify with and remember than a broad product promise.",
  },
  {
    role: "Contrarian insight",
    angle: "Industry insight",
    format: "Text-led post",
    template: "Product Spotlight",
    title: (f) => `The ${f.product} mistake that looks productive`,
    insight: (f) => `${f.audience} may be optimizing visible output while overlooking the decision that determines quality.`,
    message: (f) => `Challenge one common but counterproductive habit, then offer a more useful principle connected to ${f.product}.`,
    hook: () => "More output is not the goal.",
    support: () => "Better decisions are.",
    direction: (f) => `A minimal editorial composition with one confident statement and a single supporting visual contrast drawn from the user's ${f.product} materials.`,
    why: () => "A defensible contrarian point creates discussion while giving the audience a principle they can apply beyond this post.",
  },
];

// Snapio-native concepts are built around real commerce production moments,
// not generic social prompts with a product name inserted into them.
const snapioRecipes = [
  {
    role: "Reshoot replacement",
    categories: ["Product feature", "Promo"],
    angle: "Problem and solution",
    format: "Single image",
    template: "Before and After Reveal",
    title: () => "The reshoot you do not need",
    insight: () => "Commerce teams lose momentum when a finished product photo no longer fits a changed campaign brief.",
    message: () => "Snapio can keep the approved product intact while changing the scene around it for the new campaign direction.",
    hook: () => "Brief changed?",
    support: () => "Change the scene. Keep the product.",
    direction: () => "Use one supplied packshot twice: original studio source on the left, polished campaign scene on the right. Keep the exact product silhouette, color and details unchanged. One restrained arrow; no decorative filler.",
    caption: () => "Open with the familiar late-brief-change moment. Explain that the product remains the source of truth while the setting adapts. Close by asking which scene the audience would build next.",
    why: () => "It connects a specific painful production moment to a visible, believable Snapio capability.",
  },
  {
    role: "Source-to-campaign proof",
    categories: ["Social proof", "Product feature"],
    angle: "Range or kit reveal",
    format: "Carousel",
    template: "Kit Grid",
    title: () => "One product photo, four campaign jobs",
    insight: () => "Teams do not need another isolated image; they need a coherent set that can cover the campaign.",
    message: () => "Show how the same supplied product can become a clean packshot, lifestyle scene, on-model visual and detail image without changing its identity.",
    hook: () => "Start with one product.",
    support: () => "Build the campaign around it.",
    direction: () => "Cover: the user's original upload connected to a four-panel result grid. Following slides each give one output room to breathe: packshot, lifestyle, on-model and detail. Keep identical product color, construction and branded details throughout.",
    caption: () => "Name the four distinct content jobs and explain why each exists in the buying journey. Avoid speed or volume claims; let the visual range provide the proof.",
    why: () => "It demonstrates the value proposition with inspectable outputs instead of abstract promises.",
  },
  {
    role: "Product fidelity principle",
    categories: ["Education", "Social proof"],
    angle: "Myth versus fact",
    format: "Carousel",
    template: "Proof Split",
    title: () => "AI should change the scene—not the product",
    insight: () => "Brand teams worry that AI imagery will quietly alter the details customers are actually buying.",
    message: () => "Product fidelity is the constraint: silhouette, materials, color, hardware and proportions must remain true while the creative environment changes.",
    hook: () => "The product is the constraint.",
    support: () => "Everything around it can change.",
    direction: () => "Create a clean annotated comparison using the supplied product: lock five identity details, then show two different scenes that preserve them. Use precise callouts only; never invent technical measurements.",
    caption: () => "Explain the five product details that must remain consistent in generated commerce imagery. Invite the audience to add the detail they inspect first.",
    why: () => "It directly addresses the biggest trust objection to AI product photography with a useful quality standard.",
  },
  {
    role: "Input quality lesson",
    categories: ["Education"],
    angle: "Tutorial",
    format: "Carousel",
    template: "How It Works",
    title: () => "What to upload for a stronger product result",
    insight: () => "Better raw materials give creative teams more control over fidelity and usable angles.",
    message: () => "Teach a practical source-image checklist: clear silhouette, honest color, visible detail and useful alternate angles.",
    hook: () => "Before you generate, check this.",
    support: () => "Four inputs that protect product truth.",
    direction: () => "Four-slide checklist built from the user's own uploads. Each slide isolates one criterion with a good crop and a short label. Finish with a simple ready/not-ready summary.",
    caption: () => "Turn the checklist into a saveable mini-guide. Explain what each input helps the AI preserve, without implying that every product requires the same number of photos.",
    why: () => "It gives the audience an immediately useful workflow and positions Snapio as a practical production partner.",
  },
  {
    role: "Catalog consistency",
    categories: ["Product feature", "Social proof"],
    angle: "Feature breakdown",
    format: "Carousel",
    template: "Kit Grid",
    title: () => "Every SKU. One visual system.",
    insight: () => "Catalog content feels expensive and fragmented when each product is framed, lit or styled differently.",
    message: () => "Reusable templates and bulk generation can apply one approved visual direction across a product range while each SKU remains recognizable.",
    hook: () => "Consistency is a system.",
    support: () => "Not another round of manual fixes.",
    direction: () => "Show a row of supplied products inside the same bright template system, then zoom into the shared spacing, camera angle and background treatment. Do not duplicate a single product to fake a catalog.",
    caption: () => "Frame consistency as a production design problem. Explain which visual rules should stay fixed and which product details must remain unique.",
    why: () => "It speaks to a costly operational problem and shows the role of templates and bulk workflows clearly.",
  },
  {
    role: "Placement adaptation",
    categories: ["Education", "Product feature"],
    angle: "Comparison",
    format: "Carousel",
    template: "Comparison",
    title: () => "One idea is not one crop",
    insight: () => "A feed composition often fails when it is merely cropped into a story or vertical placement.",
    message: () => "The same campaign idea should be recomposed for each placement, with product scale, whitespace and copy hierarchy adjusted intentionally.",
    hook: () => "Do not just crop it.",
    support: () => "Recompose for the placement.",
    direction: () => "Place feed and story versions side by side using the exact same supplied product. Add safe-area guides and show how product scale and copy position change while the campaign system stays consistent.",
    caption: () => "Explain the difference between resizing and recomposing. Give three placement checks: safe area, product prominence and readable copy.",
    why: () => "It solves a common daily content problem and naturally demonstrates platform-aware generation.",
  },
  {
    role: "On-model bridge",
    categories: ["Product feature", "Social proof"],
    angle: "Pain point to transformation",
    format: "Single image",
    template: "Product Spotlight",
    title: () => "From packshot to worn context",
    insight: () => "A clean product image explains what an item is; on-model context helps shoppers understand how it lives.",
    message: () => "Use the supplied product as the anchor and generate an on-model scene that preserves its cut, color, texture and proportions.",
    hook: () => "Show the product in context.",
    support: () => "Without losing the product.",
    direction: () => "A spacious two-panel composition: clean source packshot and premium on-model result. Match the supplied product exactly; use a warm neutral setting, natural posture and minimal copy.",
    caption: () => "Explain the different jobs of packshot and on-model imagery. Keep the focus on context and product fidelity rather than replacing a physical shoot in every situation.",
    why: () => "It makes the on-model feature concrete while addressing the audience's fidelity concern.",
  },
  {
    role: "Creative iteration",
    categories: ["Product feature", "Culture / BTS"],
    angle: "Behind the scenes",
    format: "Carousel",
    template: "Feature Breakdown",
    title: () => "The first result is a direction—not the finish line",
    insight: () => "Creative teams need room to evaluate and refine, not a black-box image they must accept or discard.",
    message: () => "Show the Snapio workflow as a creative loop: generate, review, mark the exact area, refine and approve.",
    hook: () => "Generate. Direct. Refine.",
    support: () => "The creative decision stays with you.",
    direction: () => "A four-beat process using one real result: first generation, marked edit area, focused refinement and approved output. Use the same canvas and product throughout so the change is obvious.",
    caption: () => "Describe the user's role as creative director. Focus on controlled iteration and preserving what already works.",
    why: () => "It differentiates Snapio as a working creative environment instead of a one-shot generator.",
  },
  {
    role: "Template reuse",
    categories: ["Education", "Product feature"],
    angle: "Tutorial",
    format: "Carousel",
    template: "How It Works",
    title: () => "Turn a winning layout into a repeatable system",
    insight: () => "Teams waste time rebuilding compositions that already have an approved hierarchy.",
    message: () => "A reusable template should preserve layout, spacing, typography and brand rules while allowing the product and message to change.",
    hook: () => "Keep the system. Change the campaign.",
    support: () => "Reuse what is already approved.",
    direction: () => "Show one approved bright Snapio layout, then three legitimate variations using different supplied products or messages. Lock the same grid, navy/cobalt hierarchy and rounded panels.",
    caption: () => "Explain what belongs in the template and what should remain editable. End with a prompt to identify the layout the team repeats most often.",
    why: () => "It translates templates into a clear operational benefit without relying on a vague productivity claim.",
  },
  {
    role: "Workflow bottleneck",
    categories: ["Promo", "Product feature"],
    angle: "Problem and solution",
    format: "Single image",
    template: "Proof Split",
    title: () => "The campaign is waiting on one missing image",
    insight: () => "Launch plans often stall because the content set is almost complete but one placement or scene is still missing.",
    message: () => "Snapio helps teams create the missing visual from approved raw materials while staying inside the existing campaign direction.",
    hook: () => "One missing image should not hold the launch.",
    support: () => "Build it from what is already approved.",
    direction: () => "A clean campaign-board composition with one obvious empty slot, then the resolved board using the user's product. Keep every existing visual element consistent and highlight only the filled gap.",
    caption: () => "Tell the story of the almost-complete campaign. Name the approved materials used and avoid promising a specific turnaround time.",
    why: () => "It captures a recognizable high-intent moment where the product's value is immediate.",
  },
  {
    role: "Production meme",
    categories: ["Trend-jack"],
    angle: "Meme",
    format: "Meme",
    template: "Comparison",
    title: () => "final_final_THIS-ONE product image",
    insight: () => "Creative and ecommerce teams recognize the chaos of endless versions and unclear approval states.",
    message: () => "Make the joke about version chaos, then connect it lightly to one organized create-review-approve workflow.",
    hook: () => "final_final_USE_THIS_ONE_v7",
    support: () => "There has to be a better approval system.",
    direction: () => "Use a restrained two-panel meme: chaotic file names on the left, one clearly approved Snapio result on the right. Keep it brand-clean and instantly legible; no unrelated stock meme imagery.",
    caption: () => "Keep the caption conversational and short. Ask the audience for the worst version name they have received; mention the organized workflow only in the closing line.",
    why: () => "It is native to the audience's daily reality and earns engagement without forcing a product pitch.",
  },
  {
    role: "Behind quality review",
    categories: ["Culture / BTS", "Education"],
    angle: "Behind the scenes",
    format: "Carousel",
    template: "Feature Breakdown",
    title: () => "What we inspect before an AI product image is approved",
    insight: () => "Polished output is not enough if the product details or selling context are wrong.",
    message: () => "Reveal a practical review order: product identity, physical plausibility, composition, brand fit and placement readiness.",
    hook: () => "Looks good is not the final check.",
    support: () => "Review the product before the polish.",
    direction: () => "Five clean review cards applied to one supplied product result. Use subtle zooms and precise annotations; show a pass or revise decision without inventing automated scores.",
    caption: () => "Walk through the review order and explain why product identity comes first. Invite teams to compare it with their own approval checklist.",
    why: () => "It makes Snapio's quality philosophy useful, credible and transparent.",
  },
];

function fallbackIdeas(form, count, existingIdeas = []) {
  const usedRoles = new Set(existingIdeas.slice(0, 12).map((idea) => idea.strategicRole).filter(Boolean));
  const categoryMatches = snapioRecipes.filter((recipe) => recipe.categories.includes(form.pillar));
  const categoryOthers = snapioRecipes.filter((recipe) => !recipe.categories.includes(form.pillar));
  const ordered = [
    ...categoryMatches.filter((recipe) => !usedRoles.has(recipe.role)),
    ...categoryMatches.filter((recipe) => usedRoles.has(recipe.role)),
    ...categoryOthers.filter((recipe) => !usedRoles.has(recipe.role)),
    ...categoryOthers.filter((recipe) => usedRoles.has(recipe.role)),
  ];
  const start = 0;
  return Array.from({ length: count }, (_, index) => {
    const recipe = ordered[(start + index) % ordered.length];
    const f = { ...form, audience: form.audience || "the target audience" };
    const format = form.formatType || recipe.format,
      formatCount = Number(form.formatCount) || (format === "Carousel" ? 4 : format === "Story frame" ? 3 : 1),
      formatSpec = format === "Carousel"
        ? `Carousel · ${formatCount} slides`
        : format === "Story frame"
          ? `Story sequence · ${formatCount} frames`
          : format,
      destinations = form.placements || [],
      pillarTag = form.pillar || "Product feature",
      captionDirection = `${recipe.caption?.(f) || `Lead with “${recipe.hook(f)}”, then explain the concept in one concise platform-native caption.`} ${form.brand?.messagingRule || "Communicate one primary message."} ${form.brand?.claimsRestriction || "Do not invent claims or proof."}`,
      hashtags = [
        `#${hashtagToken(form.product) || "ProductContent"}`,
        `#${hashtagToken(pillarTag) || "ContentMarketing"}`,
        "#VisualContent",
      ],
      cta = form.objective === "Engagement"
        ? "Comment prompt"
        : destinations.some((placement) => placement.includes("Story"))
          ? "Swipe-up / link sticker"
          : ["Conversion", "Lead generation", "Product launch"].includes(form.objective)
            ? "Link in bio"
            : "None",
      brandStyle = form.brand?.visualGuidelines || "Clean light background, navy text, blue accents, generous whitespace, rounded panels and premium product photography.",
      formatExecution = format === "Carousel"
        ? `Build exactly ${formatCount} connected slides: a sharp cover, a progressive middle and a resolved final beat.`
        : format === "Story frame"
          ? `Build exactly ${formatCount} connected vertical story frames with safe-area-aware copy.`
          : format === "Single image"
            ? "Resolve the whole concept in one immediately understandable composition."
            : format === "Quote card"
              ? "Use one short, defensible statement as the visual anchor with a restrained product cue."
              : format === "Screenshot / UI mock"
                ? "Make the supplied interface or workflow evidence the hero; annotate only what is necessary."
                : "Keep the meme instantly legible, audience-specific and visually consistent with Snapio.",
      visualBrief = `${formatExecution} ${recipe.direction(f)} Use the ${recipe.template} template system. On-image headline: “${recipe.hook(f)}”. Supporting copy: “${recipe.support(f)}”. Style: ${brandStyle} ${form.brand?.defaultVisualStyle || "Keep the result modern, minimal and product-focused."}${form.context?.trim() ? ` Campaign constraint supplied by the user: ${form.context.trim()}` : ""}`;
    return {
      id: `i${Date.now()}-${index}`,
      title: recipe.title(f),
      finalConceptTitle: recipe.title(f),
      audienceInsight: recipe.insight(f),
      message: recipe.message(f),
      hook: recipe.hook(f),
      imageHeadline: recipe.hook(f),
      imageSupportingText: recipe.support(f),
      angle: recipe.angle,
      pillar: pillarTag,
      pillarTag,
      format,
      formatSpec,
      formatCount,
      template: recipe.template,
      creativeDirection: recipe.direction(f),
      platforms: form.platforms,
      destinations,
      platformPlacement: destinations,
      visualBrief,
      captionDirection,
      hashtags,
      cta,
      dimensionSpecs: destinations.map((placement) => ({
        placement,
        spec: placementDimensions(placement),
      })),
      materials: ["Product image", "Brand assets", "Supporting copy"],
      why: recipe.why(f),
      strategicRole: recipe.role,
      status: "review",
      created: Date.now() + index,
      revisions: [],
    };
  });
}
const defaultBrand = {
  name: "Snapio AI",
  description: "AI visual-content platform for modern commerce teams.",
  voice: "Confident, clear, practical and optimistic.",
  cta: "Create your first visual",
  avoid: "Revolutionary, game-changing, effortless",
  targetAudiences: "Ecommerce brands, online retailers, creative teams, marketing teams, agencies and product photographers.",
  valueProposition: "Create more high-quality product content from fewer raw materials.",
  productsFeatures: "AI product photography, packshots, background replacement, lifestyle scenes, on-model generation, ghost fit, bulk generation, product variations, canvas editor and reusable templates.",
  contentPillars: "Product transformations, feature education, tutorials, customer pain points, visual proof, workflow efficiency, creative inspiration and product announcements.",
  visualGuidelines: "Clean white or very light backgrounds, navy text, Snapio blue accents, Fredoka headings, generous whitespace, rounded image panels and premium product photography.",
  messagingRule: "Every post should communicate one primary message and use minimal on-image copy.",
  claimsRestriction: "Never invent statistics, customer quotes, prices, performance results or product capabilities.",
  defaultVisualStyle: "Modern, premium, AI-native, minimal, friendly, clean and content-focused. Avoid dark poster designs, excessive gradients, decorative clutter and dense text.",
  preferredPlatforms: ["Instagram", "LinkedIn", "Facebook"],
};
const initial = {
  ideas: seedIdeas.map(mk),
  production: seedIdeas
    .slice(0, 3)
    .map((a, i) => ({
      id: "p" + i,
      ideaId: "i" + i,
      title: a[0],
      format: a[4],
      platforms: i ? ["Instagram"] : ["Instagram", "LinkedIn"],
      campaign: "Always-on growth",
      materials: i ? 67 : 100,
      status: ["Approved", "Waiting for Materials", "Ready to Publish"][i],
      date: i === 2 ? "2026-07-20" : "",
    })),
  assets: [
    ["Product packshot", "Product image"],
    ["Dashboard overview", "Screenshot"],
    ["Blue brand mark", "Logo"],
    ["Creator workspace", "Lifestyle image"],
  ],
  brand: defaultBrand,
  rejected: [],
};
const nav = [
  ["Dashboard", I.LayoutDashboard],
  ["Ideas", I.Lightbulb],
  ["Production", I.Columns3],
  ["Calendar", I.CalendarDays],
  ["Asset Library", I.Images],
  ["Templates", I.LayoutTemplate],
  ["Settings", I.Settings2],
];
const mediaReferenceCache = typeof globalThis !== "undefined" ? (globalThis.__scsMediaKeys ||= new Map()) : new Map();
function openWorkspaceDB() {
  return new Promise((resolve, reject) => {
    let request = indexedDB.open("social-content-studio", 2);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("workspace")) request.result.createObjectStore("workspace");
      if (!request.result.objectStoreNames.contains("media")) request.result.createObjectStore("media");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function readWorkspace() {
  let db = await openWorkspaceDB();
  let saved = await new Promise((resolve, reject) => {
    let request = db
      .transaction("workspace")
      .objectStore("workspace")
      .get("data");
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
  return saved ? hydrateMediaReferences(saved, db) : null;
}
let workspaceWriteQueue = Promise.resolve();
function mediaKey(src) {
  let cached = mediaReferenceCache.get(src);
  if (cached) return cached;
  let a = 2166136261, b = 5381;
  for (let i = 0; i < src.length; i++) { let code = src.charCodeAt(i); a = Math.imul(a ^ code, 16777619); b = Math.imul(b, 33) ^ code; }
  let key = `${(a >>> 0).toString(36)}-${(b >>> 0).toString(36)}-${src.length}`;
  mediaReferenceCache.set(src, key);
  return key;
}
function dataUrlBlob(src) {
  let comma = src.indexOf(","), header = src.slice(0, comma), binary = atob(src.slice(comma + 1)), bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: header.match(/^data:([^;]+)/)?.[1] || "image/jpeg" });
}
async function externalizeMedia(value, blobs) {
  if (typeof value === "string" && value.startsWith("data:image/")) {
    let key = mediaKey(value); if (!blobs.has(key)) blobs.set(key, dataUrlBlob(value)); return `idb-media://${key}`;
  }
  if (Array.isArray(value)) return Promise.all(value.map((item) => externalizeMedia(item, blobs)));
  if (value && typeof value === "object") { let output = {}; for (let [key, item] of Object.entries(value)) output[key] = await externalizeMedia(item, blobs); return output; }
  return value;
}
function blobDataUrl(blob) { return new Promise((resolve, reject) => { let reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob); }); }
async function hydrateMediaReferences(value, db) {
  if (typeof value === "string" && value.startsWith("idb-media://")) {
    let key = value.slice(12), blob = await new Promise((resolve, reject) => { let request = db.transaction("media").objectStore("media").get(key); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    // Preserve the reference when a media record is temporarily unavailable.
    // Cloud and local indexes can repair it without losing asset metadata.
    if (!blob) return value;
    let src = await blobDataUrl(blob); mediaReferenceCache.set(src, key); return src;
  }
  if (Array.isArray(value)) return Promise.all(value.map((item) => hydrateMediaReferences(item, db)));
  if (value && typeof value === "object") { let output = {}; for (let [key, item] of Object.entries(value)) output[key] = await hydrateMediaReferences(item, db); return output; }
  return value;
}
function writeWorkspace(data) {
  workspaceWriteQueue = workspaceWriteQueue
    .catch(() => {})
    .then(async () => {
      let db = await openWorkspaceDB(), blobs = new Map(), snapshot = await externalizeMedia(data, blobs);
      return new Promise((resolve, reject) => {
        let transaction = db.transaction(["workspace", "media"], "readwrite"), media = transaction.objectStore("media");
        blobs.forEach((blob, key) => media.put(blob, key));
        transaction.objectStore("workspace").put(snapshot, "data");
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error || new Error("Workspace storage failed"));
        transaction.onabort = () => reject(transaction.error || new Error("Workspace storage was interrupted"));
      });
    });
  return workspaceWriteQueue;
}
function assetIdentity(asset, index = 0) {
  return Array.isArray(asset)
    ? `legacy:${asset[0]}`
    : asset?.id || `${asset?.name || "asset"}:${asset?.created || index}`;
}
function mergeAssetLists(...lists) {
  let merged = new Map();
  lists.flat().filter(Boolean).forEach((asset, index) => {
    let key = assetIdentity(asset, index), previous = merged.get(key);
    if (!previous || (!previous?.src && asset?.src) || String(asset?.src || "").startsWith("https://"))
      merged.set(key, previous && !Array.isArray(previous) && !Array.isArray(asset) ? { ...previous, ...asset } : asset);
  });
  return [...merged.values()];
}
function cachedAssetIndex() {
  try { return JSON.parse(localStorage.getItem("scs-assets-index") || "[]"); }
  catch { return []; }
}
const ASSET_CACHE = "social-content-studio-assets-v1";
async function cacheAssetMedia(asset) {
  if (!("caches" in globalThis) || !asset?.id || !asset?.src?.startsWith("data:image/")) return;
  let response = await fetch(asset.src), cache = await caches.open(ASSET_CACHE);
  await cache.put(`/__scs_asset/${encodeURIComponent(asset.id)}`, response);
}
async function hydrateCachedAssets(index) {
  if (!("caches" in globalThis)) return index;
  let cache = await caches.open(ASSET_CACHE);
  return Promise.all(index.map(async (asset) => {
    if (asset.src || !asset.id) return asset;
    let response = await cache.match(`/__scs_asset/${encodeURIComponent(asset.id)}`);
    return response ? { ...asset, src: await blobDataUrl(await response.blob()) } : asset;
  }));
}
async function deleteCachedAsset(id) {
  if ("caches" in globalThis)
    await (await caches.open(ASSET_CACHE)).delete(`/__scs_asset/${encodeURIComponent(id)}`);
}
function mergeWorkspace(saved, current) {
  let deleted = new Set([...(saved?.deletedAssetIds || []), ...(current?.deletedAssetIds || [])]);
  return {
    ...current,
    ...saved,
    deletedAssetIds: [...deleted],
    assets: mergeAssetLists(saved?.assets || [], current?.assets || [], cachedAssetIndex())
      .filter((asset, index) => !deleted.has(assetIdentity(asset, index))),
  };
}
function App() {
  const [data, setData] = useState(
      () => {
        let cached;
        try { cached = JSON.parse(localStorage.getItem("scs-data") || "null"); } catch { cached = null; }
        let base = cached || initial;
        return { ...base, assets: mergeAssetLists(base.assets || [], cachedAssetIndex()) };
      },
    ),
    [dbReady, setDbReady] = useState(false),
    [storageState, setStorageState] = useState({ status: "opening", message: "Opening workspace…" }),
    [page, setPage] = useState(() =>
      typeof location !== "undefined" &&
      /(?:instagram|facebook)=/.test(location.search)
        ? "Settings"
        : "Ideas",
    ),
    [jobs, setJobs] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem("scs-jobs") || "[]");
      } catch {
        return [];
      }
    }),
    [drawer, setDrawer] = useState(null),
    [toast, setToast] = useState(""),
    [reject, setReject] = useState(null);
  useEffect(() => {
    let active = true;
    readWorkspace()
      .then(async (saved) => {
        let cacheAssets = await hydrateCachedAssets(cachedAssetIndex());
        if (active)
          setData((current) => mergeWorkspace(saved || {}, { ...current, assets: mergeAssetLists(current.assets || [], cacheAssets) }));
        if (active) { setDbReady(true); setStorageState({ status: "saved", message: "All changes saved" }); }
      })
      .catch((error) => { if (active) setStorageState({ status: "error", message: `Storage unavailable: ${error.message || "browser access failed"}` }); });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!dbReady) return;
    setStorageState({ status: "saving", message: "Saving changes…" });
    writeWorkspace(data)
      .then(() => setStorageState({ status: "saved", message: "All changes saved" }))
      .catch((error) => setStorageState({ status: "error", message: error?.name === "QuotaExceededError" ? "Storage is full — export or remove unused media" : `Save failed: ${error.message || "unknown error"}` }));
  }, [data, dbReady]);
  useEffect(() => {
    // Keep a lightweight redundant index. Cloud URLs fit safely in
    // localStorage; large browser-only data URLs remain in IndexedDB.
    let index = (data.assets || [])
      .filter((asset) => !Array.isArray(asset))
      .map((asset) => ({ ...asset, src: /^https:\/\//.test(asset.src || "") ? asset.src : "" }));
    try { localStorage.setItem("scs-assets-index", JSON.stringify(index)); } catch {}
    Promise.allSettled((data.assets || []).filter((asset) => !Array.isArray(asset)).map(cacheAssetMedia));
  }, [data.assets]);
  useEffect(
    () => localStorage.setItem("scs-jobs", JSON.stringify(jobs.slice(0, 20))),
    [jobs],
  );
  useEffect(() => {
    let onJob = (e) => {
      let job = e.detail;
      setJobs((js) =>
        js.some((x) => x.id === job.id)
          ? js.map((x) => (x.id === job.id ? { ...x, ...job } : x))
          : [job, ...js],
      );
    };
    window.addEventListener("scs-job", onJob);
    return () => window.removeEventListener("scs-job", onJob);
  }, []);
  useResumeGeneration(data, setData, jobs, setJobs, dbReady);
  const notify = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2400);
  };
  const approve = (id) => {
    setData((d) => {
      let idea = d.ideas.find((x) => x.id === id);
      return {
        ...d,
        ideas: d.ideas.map((x) =>
          x.id === id
            ? { ...x, status: "approved", approvedAt: Date.now() }
            : x,
        ),
        production: d.production.some((x) => x.ideaId === id)
          ? d.production
          : [
              ...d.production,
              {
                id: "p" + Date.now(),
                ideaId: id,
                title: idea.title,
                format: idea.format,
                formatSpec: idea.formatSpec,
                formatCount: idea.formatCount,
                pillar: idea.pillarTag || idea.pillar,
                visualBrief: idea.visualBrief,
                captionDirection: idea.captionDirection,
                hashtags: idea.hashtags,
                cta: idea.cta,
                dimensionSpecs: idea.dimensionSpecs,
                platforms: idea.destinations?.length ? idea.destinations : idea.platforms,
                destinations: idea.destinations?.length ? idea.destinations : idea.platforms,
                campaign: "AI Growth",
                materials: 0,
                status: "Approved",
                date: "",
              },
            ],
      };
    });
    notify("Idea approved and moved to Production");
  };
  return (
    <div className="app">
      <aside>
        <div className="logo">
          <span>SC</span>
          <b>
            Social Content
            <br />
            Studio
          </b>
        </div>
        <nav>
          {nav.map(([n, C]) => (
            <button
              className={page === n ? "active" : ""}
              onClick={() => setPage(n)}
            >
              <C size={18} />
              {n}
              {n === "Ideas" && (
                <em>
                  {data.ideas.filter((x) => x.status === "review").length}
                </em>
              )}
            </button>
          ))}
        </nav>
        <div className="sidefoot">
          <div className="avatar">EY</div>
          <div>
            <b>Personal workspace</b>
            <small>
              {storageState.message}
            </small>
          </div>
        </div>
      </aside>
      <main>
        <Header page={page} setPage={setPage} />
        {page === "Ideas" ? (
          <Ideas
            data={data}
            setData={setData}
            approve={approve}
            refine={setDrawer}
            reject={setReject}
            notify={notify}
          />
        ) : page === "Dashboard" ? (
          <Dashboard data={data} setPage={setPage} />
        ) : page === "Production" ? (
          <Production data={data} setData={setData} notify={notify} />
        ) : page === "Calendar" ? (
          <Calendar data={data} setData={setData} notify={notify} />
        ) : page === "Asset Library" ? (
          <Assets data={data} setData={setData} />
        ) : page === "Templates" ? (
          <Templates />
        ) : (
          <SettingsV2 data={data} setData={setData} notify={notify} />
        )}
      </main>
      <JobCenter
        jobs={jobs}
        openProduction={() => setPage("Production")}
        dismiss={(id) => setJobs((js) => js.filter((x) => x.id !== id))}
      />
      {drawer && (
        <Refine
          idea={drawer}
          close={() => setDrawer(null)}
          save={(idea) => {
            setData((d) => ({
              ...d,
              ideas: d.ideas.map((x) => (x.id === idea.id ? idea : x)),
            }));
            setDrawer(idea);
            notify("Idea refined — revision saved");
          }}
        />
      )}
      {reject && (
        <Reject
          close={() => setReject(null)}
          save={(reason) => {
            setData((d) => ({
              ...d,
              ideas: d.ideas.map((x) =>
                x.id === reject.id ? { ...x, status: "rejected", reason } : x,
              ),
            }));
            setReject(null);
            notify("Idea moved to Rejected");
          }}
        />
      )}
      {toast && (
        <div className="toast">
          <I.CheckCircle2 size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}
function applyFinishedJob(data, job) {
  let meta = job.meta || {},
    results = job.result?.images || [];
  return {
    ...data,
    production: data.production.map((item) => {
      if (item.id !== meta.productionId) return item;
      if (job.status === "failed")
        return {
          ...item,
          status: item.rendered ? "Ready for Review" : "Ready to Create",
          generationProgress: {
            completed: 0,
            total: meta.total || 1,
            state: "failed",
          },
          generationError: job.error || "Generation failed",
        };
      if (!results.length) return item;
      if (meta.kind === "refine") {
        let current = item.carouselImages?.length
            ? item.carouselImages
            : item.generatedVariants || [],
          index = Math.max(
            0,
            Math.min(current.length - 1, meta.selectedIndex || 0),
          ),
          next = current.map((v, i) => (i === index ? results[0] : v)),
          history = [
            ...(item.creativeRevisions || []),
            {
              id: job.id,
              prompt: meta.prompt,
              maskRegion: meta.maskRegion || null,
              previousSrc: meta.previousSrc,
              resultSrc: results[0].src,
              at: new Date(job.finishedAt || Date.now()).toISOString(),
              from: index,
            },
          ];
        return {
          ...item,
          generatedVariants: next,
          carouselImages: next,
          rendered: next[0]?.src || item.rendered,
          selectedVariant: index,
          creativeRevisions: history,
          status: "Ready for Review",
          generationProgress: { completed: 1, total: 1, state: "ready" },
          generationFinishedAt: job.finishedAt,
          generationError: "",
        };
      }
      if (meta.kind === "generate-slide") {
        let current = item.carouselImages?.length
            ? item.carouselImages
            : item.generatedVariants || [],
          incoming = results[0],
          index = Number.isInteger(meta.slideIndex)
            ? meta.slideIndex
            : incoming.slideIndex || 0,
          byIndex = new Map(
            current.map((slide, slideIndex) => [
              Number.isInteger(slide.slideIndex)
                ? slide.slideIndex
                : slideIndex,
              slide,
            ]),
          );
        byIndex.set(index, { ...incoming, slideIndex: index });
        let merged = [...byIndex.values()].sort(
            (a, b) => (a.slideIndex || 0) - (b.slideIndex || 0),
          ),
          total = meta.total || merged.length,
          complete = merged.length >= total;
        return {
          ...item,
          generatedVariants: merged,
          carouselImages: merged,
          rendered: merged[0]?.src || item.rendered,
          selectedVariant: index,
          format: total > 1 ? "Carousel" : item.format,
          status: "Ready for Review",
          materials: 100,
          generationWarning: complete
            ? ""
            : `${merged.length} of ${total} slides completed — retry to finish the series`,
          generationProgress: {
            completed: merged.length,
            total,
            state: complete ? "ready" : "partial",
          },
          generationFinishedAt: job.finishedAt,
          generationError: "",
        };
      }
      let warning = job.result?.failedSlides?.length
        ? `${results.length} of ${meta.total || results.length} slides completed`
        : "";
      return {
        ...item,
        generatedVariants: results,
        carouselImages: results,
        rendered: results[0].src,
        selectedVariant: 0,
        format: results.length > 1 ? "Carousel" : item.format,
        status: "Ready for Review",
        materials: 100,
        generationWarning: warning,
        failedSlides: job.result?.failedSlides || [],
        generationProgress: {
          completed: results.length,
          total: meta.total || results.length,
          state: "ready",
        },
        generationFinishedAt: job.finishedAt,
        generationError: "",
      };
    }),
  };
}
function useResumeGeneration(data, setData, jobs, setJobs, ready) {
  useEffect(() => {
    if (!ready) return;
    let pending = data.production.filter(
      (item) =>
        item.status === "In Creation" &&
        item.generationRequest &&
        item.generationRequest.owner !== runtimeId,
    );
    if (!pending.length) return;
    setData((current) => ({
      ...current,
      production: current.production.map((item) =>
        pending.some((x) => x.id === item.id)
          ? {
              ...item,
              generationRequest: {
                ...item.generationRequest,
                owner: runtimeId,
                resumedAt: Date.now(),
              },
            }
          : item,
      ),
    }));
    pending.forEach(async (item) => {
      let request = item.generationRequest,
        meta = request.meta || { productionId: item.id, total: 1 };
      try {
        let response = await fetch("/api/generate", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request.payload),
          }),
          body = await response.json();
        if (!response.ok) throw new Error(body.error || "Generation failed");
        let job = {
          id: request.id,
          status: "ready",
          result: body,
          meta,
          finishedAt: Date.now(),
        };
        setData((current) => {
          let next = applyFinishedJob(current, job);
          return {
            ...next,
            production: next.production.map((x) =>
              x.id === item.id ? { ...x, generationRequest: null } : x,
            ),
          };
        });
        setJobs((list) =>
          list.map((j) =>
            j.id === request.id
              ? {
                  ...j,
                  status: "ready",
                  error: "",
                  title: `${item.title} · recovered after refresh`,
                }
              : j,
          ),
        );
      } catch (error) {
        let job = {
          id: request.id,
          status: "failed",
          error: error.message,
          meta,
          finishedAt: Date.now(),
        };
        setData((current) => {
          let next = applyFinishedJob(current, job);
          return {
            ...next,
            production: next.production.map((x) =>
              x.id === item.id ? { ...x, generationRequest: null } : x,
            ),
          };
        });
        setJobs((list) =>
          list.map((j) =>
            j.id === request.id
              ? { ...j, status: "failed", error: error.message }
              : j,
          ),
        );
      }
    });
  }, [ready]);
}
function Header({ page, setPage }) {
  return (
    <header>
      <div>
        <small>CONTENT WORKSPACE</small>
        <h1>{page}</h1>
        <p>
          {page === "Ideas"
            ? "Generate, refine and approve your next best content ideas."
            : "Keep every piece of content moving forward."}
        </p>
      </div>
      <div className="headBtns">
        <button className="icon">
          <I.Search size={18} />
        </button>
        <button className="icon">
          <I.Bell size={18} />
        </button>
        <button className="primary" onClick={() => setPage("Ideas")}>
          <I.Sparkles size={17} />
          Generate ideas
        </button>
      </div>
    </header>
  );
}
function Ideas({ data, setData, approve, refine, reject, notify }) {
  const [open, setOpen] = useState(true),
    [rejected, setRejected] = useState(false),
    [generating, setGenerating] = useState(false),
    [form, setForm] = useState({
      product: "AI product photography",
      objective: "Feature adoption",
      audience: "Ecommerce marketing teams",
      pillar: "Product feature",
      formatType: "Carousel",
      formatCount: 4,
      platforms: ["Instagram", "LinkedIn"],
      placements: ["Instagram Feed", "LinkedIn"],
      count: 3,
      context: "",
    });
  const gen = () => {
    if (!form.product.trim()) return notify("Add a product or feature first");
    if (!form.audience.trim()) return notify("Add the target audience first");
    if (!form.platforms.length) return notify("Select at least one platform");
    if (!form.placements.length) return notify("Select at least one placement");
    setGenerating(true);
    const created = fallbackIdeas({ ...form, brand: data.brand }, Number(form.count), data.ideas);
    setData((d) => ({ ...d, ideas: [...created, ...d.ideas] }));
    setGenerating(false);
    notify(`${created.length} distinct strategic concepts are ready`);
  };
  return (
    <>
      <section className="generator">
        <div className="sectiontitle" onClick={() => setOpen(!open)}>
          <div>
            <span className="spark">
              <I.Sparkles size={18} />
            </span>
            <div>
              <h2>Generate your next ideas</h2>
              <p>
                Tell the AI what you want to achieve. You stay in creative
                control.
              </p>
            </div>
          </div>
          <I.ChevronUp className={!open ? "flip" : ""} />
        </div>
        {open && (
          <div className="formgrid">
            <label>
              Product or feature
              <input
                value={form.product}
                onChange={(e) => setForm({ ...form, product: e.target.value })}
              />
            </label>
            <label>
              Campaign objective
              <select
                value={form.objective}
                onChange={(e) =>
                  setForm({ ...form, objective: e.target.value })
                }
              >
                {[
                  "Awareness",
                  "Engagement",
                  "Education",
                  "Lead generation",
                  "Conversion",
                  "Product launch",
                  "Feature adoption",
                ].map((x) => (
                  <option>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Target audience
              <input
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value })}
              />
            </label>
            <label>
              Content pillar / category
              <select
                value={form.pillar}
                onChange={(e) => setForm({ ...form, pillar: e.target.value })}
              >
                {ideaPillars.map((x) => (
                  <option>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Format type
              <select
                value={form.formatType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    formatType: e.target.value,
                    formatCount: e.target.value === "Carousel" ? 4 : e.target.value === "Story frame" ? 3 : 1,
                  })
                }
              >
                {ideaFormats.map((x) => (
                  <option>{x}</option>
                ))}
              </select>
            </label>
            {(form.formatType === "Carousel" || form.formatType === "Story frame") && (
              <label>
                {form.formatType === "Carousel" ? "Slide count" : "Story frame count"}
                <select
                  value={form.formatCount}
                  onChange={(e) => setForm({ ...form, formatCount: Number(e.target.value) })}
                >
                  {(form.formatType === "Carousel" ? [2, 3, 4, 5, 6, 7, 8, 9, 10] : [1, 2, 3, 4, 5, 6]).map((x) => (
                    <option value={x}>{x}</option>
                  ))}
                </select>
              </label>
            )}
            <label className="wide">
              Preferred platforms
              <div className="chips">
                {platforms.map((x) => (
                  <button
                    className={form.platforms.includes(x) ? "selected" : ""}
                    onClick={() =>
                      setForm((current) => {
                        let removing = current.platforms.includes(x), platforms = removing ? current.platforms.filter((y) => y !== x) : [...current.platforms, x], placements = removing ? current.placements.filter((p) => !ideaPlacements[x]?.includes(p)) : [...new Set([...current.placements, firstPlacement(x)])];
                        return { ...current, platforms, placements };
                      })
                    }
                  >
                    {x}
                  </button>
                ))}
              </div>
            </label>
            <div className="wide placementSelector">
              <div className="placementHeading"><span>Placements</span><small>Choose exactly where each idea is intended to appear.</small></div>
              <div className="placementGroups">
                {form.platforms.map((platform) => <section key={platform}><b>{platform}</b><div className="chips">{ideaPlacements[platform].map((placement) => <button key={placement} className={form.placements.includes(placement) ? "selected" : ""} onClick={() => setForm((current) => ({ ...current, placements: current.placements.includes(placement) ? current.placements.filter((p) => p !== placement) : [...current.placements, placement] }))}>{placement.replace(`${platform} `, "")}</button>)}</div></section>)}
              </div>
            </div>
            <label>
              Number of ideas
              <select
                value={form.count}
                onChange={(e) => setForm({ ...form, count: e.target.value })}
              >
                {[3, 5, 6].map((x) => (
                  <option>{x}</option>
                ))}
              </select>
            </label>
            <label className="wide">
              Additional context
              <textarea
                placeholder="Add a launch date, offer, message constraint or creative direction…"
                value={form.context}
                onChange={(e) => setForm({ ...form, context: e.target.value })}
              />
            </label>
            <div className="generateRow">
              <span>Private brainstorm: each concept uses a different insight, creative mechanic and strategic job.</span>
              <button className="primary" onClick={gen} disabled={generating}>
                {generating ? <I.LoaderCircle className="spin" size={17} /> : <I.Sparkles size={17} />}
                {generating ? "Building distinct concepts…" : "Generate Ideas"}
              </button>
            </div>
          </div>
        )}
      </section>
      <div className="listHead">
        <div>
          <h2>Ideas awaiting review</h2>
          <p>
            {data.ideas.filter((x) => x.status === "review").length} ideas ready
            for your direction
          </p>
        </div>
        <select>
          <option>Newest first</option>
          <option>Oldest first</option>
        </select>
      </div>
      <div className="ideaGrid">
        {data.ideas
          .filter((x) => x.status === "review")
          .map((x) => (
            <Idea
              idea={x}
              approve={approve}
              refine={refine}
              reject={reject}
              similar={() => {
                let [n] = fallbackIdeas({ ...form, brand: data.brand }, 1, data.ideas);
                n = {
                  ...n,
                  audienceInsight: x.audienceInsight || n.audienceInsight,
                  message: `Explore the same audience insight as “${x.title}” through a different ${n.angle.toLowerCase()} execution. ${n.message}`,
                };
                setData((d) => ({ ...d, ideas: [n, ...d.ideas] }));
                notify("A related idea with a different execution is ready");
              }}
            />
          ))}
      </div>
      <button className="rejected" onClick={() => setRejected(!rejected)}>
        <I.ChevronRight className={rejected ? "turn" : ""} size={18} />
        Rejected ideas{" "}
        <span>{data.ideas.filter((x) => x.status === "rejected").length}</span>
      </button>
      {rejected &&
        data.ideas
          .filter((x) => x.status === "rejected")
          .map((x) => (
            <div className="rejectRow">
              <div>
                <b>{x.title}</b>
                <small>{x.reason || "No reason provided"}</small>
              </div>
              <button
                onClick={() =>
                  setData((d) => ({
                    ...d,
                    ideas: d.ideas.map((y) =>
                      y.id === x.id ? { ...y, status: "review" } : y,
                    ),
                  }))
                }
              >
                Restore
              </button>
            </div>
          ))}
    </>
  );
}
function Idea({ idea, approve, refine, reject, similar }) {
  let headline = idea.imageHeadline || idea.hook,
    support = idea.imageSupportingText || "";
  return (
    <article className="idea">
      <div className="ideaTop">
        <span>AI IDEA</span>
        <button>
          <I.MoreHorizontal />
        </button>
      </div>
      <small className="conceptLabel">FINAL CONCEPT TITLE</small>
      <h3>{idea.finalConceptTitle || idea.title}</h3>
      {idea.audienceInsight && (
        <div className="ideaInsight">
          <small>AUDIENCE INSIGHT</small>
          <p>{idea.audienceInsight}</p>
        </div>
      )}
      <div className="ideaMessage">
        <small>CORE CAMPAIGN MESSAGE</small>
        <p>{idea.message}</p>
      </div>
      <div className="imageCopyPlan">
        <small>TEXT PLANNED FOR THE IMAGE</small>
        <div>
          <span>Headline</span>
          <b>“{headline}”</b>
        </div>
        <div>
          <span>Supporting line</span>
          <p>{support || "None — keep the image clean and product-led."}</p>
        </div>
      </div>
      {idea.creativeDirection && (
        <div className="creativeDirection">
          <small>VISUAL BRIEF</small>
          <p>{idea.visualBrief || idea.creativeDirection}</p>
        </div>
      )}
      <div className="deliveryBrief">
        <div>
          <small>PLATFORM + PLACEMENT</small>
          <b>{(idea.platformPlacement || idea.destinations || idea.platforms || []).join(" · ")}</b>
        </div>
        <div>
          <small>PILLAR / CATEGORY</small>
          <b>{idea.pillarTag || idea.pillar || idea.angle}</b>
        </div>
        <div>
          <small>FORMAT SPEC</small>
          <b>{idea.formatSpec || idea.format}</b>
        </div>
        <div className="briefWide">
          <small>CAPTION COPY / DIRECTION</small>
          <p>{idea.captionDirection || idea.message}</p>
        </div>
        <div>
          <small>HASHTAGS / TAGS</small>
          <p>{Array.isArray(idea.hashtags) ? idea.hashtags.join(" ") : idea.hashtags || "Set during distribution"}</p>
        </div>
        <div>
          <small>CTA</small>
          <b>{idea.cta || "None"}</b>
        </div>
        <div className="briefWide dimensionList">
          <small>PLATFORM-SPECIFIC DIMENSIONS</small>
          {(idea.dimensionSpecs?.length
            ? idea.dimensionSpecs
            : (idea.destinations || idea.platforms || []).map((placement) => ({ placement, spec: placementDimensions(placement) }))
          ).map((item) => (
            <span key={item.placement}><b>{item.placement}</b>{item.spec}</span>
          ))}
        </div>
      </div>
      <div className="meta">
        <div>
          <small>{idea.strategicRole ? "STRATEGIC JOB" : "CONTENT ANGLE"}</small>
          <b>{idea.strategicRole || idea.angle}</b>
        </div>
        <div>
          <small>FORMAT</small>
          <b>{idea.format}</b>
        </div>
        <div>
          <small>TEMPLATE</small>
          <b>{idea.template}</b>
        </div>
      </div>
      <div className="tags">
        {(idea.destinations?.length ? idea.destinations : idea.platforms).map((x) => (
          <span>{x}</span>
        ))}
      </div>
      <div className="why">
        <I.TrendingUp size={16} />
        <div>
          <b>Why this should work</b>
          <p>{idea.why}</p>
        </div>
      </div>
      <footer>
        <button className="approve" onClick={() => approve(idea.id)}>
          <I.Check size={16} />
          Approve
        </button>
        <button onClick={() => refine(idea)}>
          <I.SlidersHorizontal size={16} />
          Refine
        </button>
        <button onClick={similar}>
          <I.CopyPlus size={16} />
          Similar
        </button>
        <button className="danger" onClick={() => reject(idea)}>
          <I.X size={16} />
        </button>
      </footer>
    </article>
  );
}
function Refine({ idea, close, save }) {
  const [ins, setIns] = useState(""),
    [view, setView] = useState("current");
  const chips = [
    "More premium",
    "Less promotional",
    "Stronger hook",
    "More educational",
    "More direct",
    "More surprising",
    "Simpler visual",
    "Focus on conversion",
    "Focus on engagement",
  ];
  const go = () => {
    if (!ins) return;
    let prev = {
      title: idea.title,
      hook: idea.hook,
      message: idea.message,
      at: Date.now(),
    };
    save({
      ...idea,
      hook: ins.includes("hook") ? `Stop scrolling: ${idea.hook}` : idea.hook,
      message: `${idea.message} Refined to feel ${ins.toLowerCase()}.`,
      revisions: [...idea.revisions, prev],
    });
    setIns("");
  };
  return (
    <div
      className="overlay"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <aside className="drawer">
        <div className="drawerHead">
          <div>
            <small>REFINE IDEA</small>
            <h2>{idea.title}</h2>
          </div>
          <button className="icon" onClick={close}>
            <I.X />
          </button>
        </div>
        <div className="tabs">
          <button
            className={view === "current" ? "on" : ""}
            onClick={() => setView("current")}
          >
            Current revision
          </button>
          <button
            className={view === "history" ? "on" : ""}
            onClick={() => setView("history")}
          >
            History ({idea.revisions.length})
          </button>
        </div>
        {view === "current" ? (
          <>
            <div className="current">
              <small>HOOK</small>
              <h3>“{idea.hook}”</h3>
              <small>CORE MESSAGE</small>
              <p>{idea.message}</p>
            </div>
            <label>
              How should this idea change?
              <textarea
                value={ins}
                onChange={(e) => setIns(e.target.value)}
                placeholder="E.g. Make it feel more premium and lead with the time saved…"
              />
            </label>
            <small>QUICK DIRECTIONS</small>
            <div className="quick">
              {chips.map((x) => (
                <button onClick={() => setIns(x)}>{x}</button>
              ))}
            </div>
            <button className="primary full" onClick={go}>
              <I.Sparkles size={17} />
              Refine Idea
            </button>
          </>
        ) : (
          <div className="history">
            {idea.revisions.length ? (
              idea.revisions.map((r, i) => (
                <div>
                  <span>Revision {i + 1}</span>
                  <b>{r.hook}</b>
                  <p>{r.message}</p>
                  <button
                    onClick={() =>
                      save({ ...idea, hook: r.hook, message: r.message })
                    }
                  >
                    Restore this version
                  </button>
                </div>
              ))
            ) : (
              <p>No previous revisions yet.</p>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
function Reject({ close, save }) {
  const [r, setR] = useState("");
  return (
    <div className="modalback">
      <div className="modal">
        <h2>Reject this idea?</h2>
        <p>
          You can restore it later. A reason helps future idea generation avoid
          similar directions.
        </p>
        <textarea
          placeholder="Optional rejection reason…"
          value={r}
          onChange={(e) => setR(e.target.value)}
        />
        <div>
          <button onClick={close}>Cancel</button>
          <button className="red" onClick={() => save(r)}>
            Reject idea
          </button>
        </div>
      </div>
    </div>
  );
}
function Dashboard({ data, setPage }) {
  let cards = [
    [
      "Awaiting review",
      data.ideas.filter((x) => x.status === "review").length,
      I.Lightbulb,
    ],
    [
      "Approved ideas",
      data.ideas.filter((x) => x.status === "approved").length,
      I.CheckCircle2,
    ],
    ["Waiting for materials", 1, I.PackageOpen],
    ["Ready to publish", 1, I.Send],
    ["Scheduled this week", 2, I.CalendarClock],
    ["Published this month", 1, I.BadgeCheck],
  ];
  return (
    <>
      <div className="stats">
        {cards.map(([n, v, C]) => (
          <div>
            <C />
            <small>{n}</small>
            <b>{v}</b>
          </div>
        ))}
      </div>
      <section className="panel">
        <div className="listHead">
          <div>
            <h2>This week</h2>
            <p>Your content schedule at a glance</p>
          </div>
          <button onClick={() => setPage("Calendar")}>Open calendar</button>
        </div>
        <Week />
      </section>
    </>
  );
}
function Week() {
  return (
    <div className="week">
      {["MON 20", "TUE 21", "WED 22", "THU 23", "FRI 24"].map((x, i) => (
        <div>
          <b>{x}</b>
          {i === 1 && (
            <span>
              Product launch proof<small>Instagram · 10:00</small>
            </span>
          )}
          {i === 3 && (
            <span>
              From input to impact<small>LinkedIn · 13:30</small>
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
function Production({ data, setData, notify }) {
  let cols = [
    "Approved",
    "Waiting for Materials",
    "Ready to Create",
    "In Creation",
    "Ready for Review",
    "Ready to Publish",
    "Published",
  ];
  const move = (id, status) => {
    setData((d) => ({
      ...d,
      production: d.production.map((x) => (x.id === id ? { ...x, status } : x)),
    }));
    notify(`Moved to ${status}`);
  };
  return (
    <div className="kanban">
      {cols.map((c) => (
        <section
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => move(e.dataTransfer.getData("id"), c)}
        >
          <h3>
            {c}
            <span>{data.production.filter((x) => x.status === c).length}</span>
          </h3>
          {data.production
            .filter((x) => x.status === c)
            .map((x) => (
              <article
                draggable
                onDragStart={(e) => e.dataTransfer.setData("id", x.id)}
              >
                <div className="thumb">
                  <I.Image />
                </div>
                <b>{x.title}</b>
                <p>
                  {x.format} · {x.platforms.join(", ")}
                </p>
                <small>Materials</small>
                <div className="progress">
                  <i style={{ width: x.materials + "%" }} />
                </div>
                <em>{x.materials}% complete</em>
              </article>
            ))}
        </section>
      ))}
    </div>
  );
}
function Calendar({ data }) {
  return (
    <section className="panel calendar">
      <div className="calTop">
        <div>
          <button>Month</button>
          <button>Week</button>
          <button>List</button>
        </div>
        <h2>July 2026</h2>
        <div>
          <select>
            <option>All platforms</option>
          </select>
          <select>
            <option>All statuses</option>
          </select>
        </div>
      </div>
      <div className="month">
        {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((x) => (
          <b>{x}</b>
        ))}
        {Array.from({ length: 35 }, (_, i) => (
          <div>
            <small>{i < 3 ? 29 + i : i - 2}</small>
            {i === 8 && <span>10:00 · Product launch proof</span>}
            {i === 10 && (
              <span className="purple">13:30 · Input to impact</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
function Assets({ data, setData }) {
  const [q, setQ] = useState("");
  return (
    <>
      <div className="toolbar">
        <div>
          <I.Search size={17} />
          <input
            placeholder="Search assets"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select>
          <option>All asset types</option>
        </select>
        <label className="primary upload">
          <I.Upload size={17} />
          Upload asset
          <input
            type="file"
            onChange={(e) => {
              if (e.target.files[0])
                setData((d) => ({
                  ...d,
                  assets: [[e.target.files[0].name, "Uploaded"], ...d.assets],
                }));
            }}
          />
        </label>
      </div>
      <div className="assets">
        {data.assets
          .filter((x) => x[0].toLowerCase().includes(q.toLowerCase()))
          .map((x, i) => (
            <article>
              <div>
                <I.Image size={38} />
              </div>
              <b>{x[0]}</b>
              <small>{x[1]}</small>
              <button
                onClick={() =>
                  confirm("Delete this asset?") &&
                  setData((d) => ({
                    ...d,
                    assets: d.assets.filter((_, j) => j !== i),
                  }))
                }
              >
                <I.Trash2 size={16} />
              </button>
            </article>
          ))}
      </div>
    </>
  );
}
const templates = [
  "Proof Split",
  "Kit Grid",
  "Quantified Proof",
  "Feature Breakdown",
  "Before and After Reveal",
  "Product Spotlight",
  "How It Works",
  "Comparison",
  "Social Proof",
];
function Templates() {
  return (
    <div className="templateGrid">
      {templates.map((x, i) => (
        <article>
          <span>0{i + 1}</span>
          <h3>{x}</h3>
          <p>
            {
              [
                "Show a visible transformation",
                "Reveal a complete product range",
                "Make one number the whole pitch",
              ][i % 3]
            }
          </p>
          <div>
            <small>FORMATS</small>
            <b>Image · Carousel</b>
          </div>
          <div>
            <small>REQUIRED</small>
            <b>Product image · Logo · CTA</b>
          </div>
          <button>Edit template</button>
        </article>
      ))}
    </div>
  );
}
function Brand({ data, setData, notify }) {
  const [b, setB] = useState({ ...defaultBrand, ...(data.brand || {}) });
  const fields = [
    ["name", "Brand name", false],
    ["description", "Brand description", true],
    ["targetAudiences", "Target audiences", true],
    ["valueProposition", "Primary value proposition", true],
    ["productsFeatures", "Products and features", true],
    ["contentPillars", "Content pillars", true],
    ["voice", "Brand voice", true],
    ["visualGuidelines", "Visual guidelines", true],
    ["messagingRule", "Messaging rule", true],
    ["claimsRestriction", "Claims restriction", true],
    ["defaultVisualStyle", "Default visual style", true],
    ["cta", "Default CTA", false],
    ["avoid", "Words to avoid", false],
  ];
  return (
    <section className="settings">
      <h2>Brand foundation</h2>
      <p>Used to keep every generated idea and caption consistent.</p>
      {fields.map(([k, n, multiline]) => (
        <label key={k}>
          {n}
          {multiline ? (
            <textarea
              value={b[k] || ""}
              onChange={(e) => setB({ ...b, [k]: e.target.value })}
            />
          ) : (
            <input
              value={b[k] || ""}
              onChange={(e) => setB({ ...b, [k]: e.target.value })}
            />
          )}
        </label>
      ))}
      <label>
        Preferred platforms
        <div className="chips">
          {platforms.map((x) => (
            <button
              key={x}
              className={(b.preferredPlatforms || []).includes(x) ? "selected" : ""}
              onClick={() =>
                setB((current) => ({
                  ...current,
                  preferredPlatforms: (current.preferredPlatforms || []).includes(x)
                    ? current.preferredPlatforms.filter((platform) => platform !== x)
                    : [...(current.preferredPlatforms || []), x],
                }))
              }
            >
              {x}
            </button>
          ))}
        </div>
      </label>
      <button
        className="primary"
        onClick={() => {
          setData((current) => ({ ...current, brand: b }));
          notify("Brand settings saved");
        }}
      >
        Save brand settings
      </button>
    </section>
  );
}
function SettingsV2({ data, setData, notify }) {
  const [tab, setTab] = useState("Connections"),
    [state, setState] = useState({
      loading: true,
      configured: false,
      connected: false,
    }),
    [disconnecting, setDisconnecting] = useState(false);
  const refresh = async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      let r = await fetch("/api/instagram/status", { credentials: "include" }),
        body = await r.json();
      setState({ ...body, loading: false });
    } catch {
      setState({
        loading: false,
        configured: false,
        connected: false,
        error: "Connection service is unavailable.",
      });
    }
  };
  useEffect(() => {
    refresh();
    let q = new URLSearchParams(location.search),
      result = q.get("instagram"),
      reason = q.get("reason"),
      labels = {
        session: "The secure login session expired. Please try once more.",
        token:
          "Meta rejected the authorization code. Check the Instagram app secret and redirect URL.",
        "long-token": "Meta could not create a long-lived Instagram token.",
        profile: "Instagram connected, but its profile could not be read.",
      };
    if (result) {
      notify(
        result === "connected"
          ? "Instagram connected successfully"
          : labels[reason] || "Instagram connection was not completed",
      );
      history.replaceState({}, "", location.pathname);
    }
  }, []);
  const test = async () => {
    try {
      let r = await fetch("/api/instagram/test", { credentials: "include" }),
        body = await r.json();
      if (!r.ok) throw new Error(body.error || "Connection test failed");
      notify(`Instagram connection verified for @${body.username}`);
    } catch (e) {
      notify(e.message);
    }
  };
  const disconnect = async () => {
    if (
      !confirm(
        "Disconnect this Instagram account? Scheduled content will stay in your calendar.",
      )
    )
      return;
    setDisconnecting(true);
    try {
      let r = await fetch("/api/instagram/disconnect", {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) throw new Error();
      await refresh();
      notify("Instagram disconnected");
    } catch {
      notify("Could not disconnect Instagram");
    } finally {
      setDisconnecting(false);
    }
  };
  return (
    <div className="settingsV2">
      <div className="settingsTabs">
        <button
          className={tab === "Connections" ? "on" : ""}
          onClick={() => setTab("Connections")}
        >
          <I.Link2 size={16} />
          Connections
        </button>
        <button
          className={tab === "Brand" ? "on" : ""}
          onClick={() => setTab("Brand")}
        >
          <I.Palette size={16} />
          Brand
        </button>
      </div>
      {tab === "Brand" ? (
        <Brand data={data} setData={setData} notify={notify} />
      ) : (
        <section className="connections">
          <div className="settingsIntro">
            <div>
              <small>CHANNEL CONNECTIONS</small>
              <h2>Connect your publishing accounts</h2>
              <p>
                Authorize accounts once, then publish approved content from the
                calendar.
              </p>
            </div>
            <button onClick={refresh} disabled={state.loading}>
              <I.RefreshCw className={state.loading ? "spin" : ""} size={16} />
              Refresh
            </button>
          </div>
          <article className="connectionCard">
            <div className="connectionBrand">
              <span className="instagramLogo">
                <I.Camera />
              </span>
              <div>
                <h3>Instagram</h3>
                <p>
                  Publish feed images and carousels to a professional account.
                </p>
              </div>
              <span
                className={`connectionStatus ${state.connected ? "connected" : state.configured ? "ready" : "setup"}`}
              >
                {state.loading
                  ? "Checking…"
                  : state.connected
                    ? "Connected"
                    : state.configured
                      ? "Ready to connect"
                      : "Setup required"}
              </span>
            </div>
            {state.loading ? (
              <div className="connectionLoading">
                <I.LoaderCircle className="spin" />
                Checking Instagram connection…
              </div>
            ) : state.connected ? (
              <div className="connectedAccount">
                <div className="profileRow">
                  {state.account?.profilePicture ? (
                    <img src={state.account.profilePicture} />
                  ) : (
                    <span className="profilePlaceholder">
                      <I.UserRound />
                    </span>
                  )}
                  <div>
                    <small>CONNECTED ACCOUNT</small>
                    <h3>@{state.account?.username || "instagram"}</h3>
                    <p>
                      {state.account?.accountType || "Professional account"}
                      {state.account?.mediaCount != null
                        ? ` · ${state.account.mediaCount} posts`
                        : ""}
                    </p>
                  </div>
                  <I.BadgeCheck className="verifiedConnection" />
                </div>
                <div className="permissionGrid">
                  <span>
                    <I.CheckCircle2 />
                    Profile access
                  </span>
                  <span>
                    <I.CheckCircle2 />
                    Content publishing
                  </span>
                  <span>
                    <I.CheckCircle2 />
                    Secure token storage
                  </span>
                </div>
                <div className="connectionActions">
                  <button onClick={test}>Test connection</button>
                  <button
                    className="dangerOutline"
                    onClick={disconnect}
                    disabled={disconnecting}
                  >
                    {disconnecting ? "Disconnecting…" : "Disconnect"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="connectPrompt">
                <div className="oauthNote">
                  <I.ShieldCheck />
                  <div>
                    <b>Secure sign-in through Instagram</b>
                    <p>
                      You will sign in on Instagram and choose the professional
                      account to authorize. This app never sees or stores your
                      Instagram password.
                    </p>
                  </div>
                </div>
                {state.error && (
                  <p className="connectionError">{state.error}</p>
                )}
                {state.configured && state.sessionState === "missing_on_this_origin" && (
                  <p className="connectionWarning"><b>No Instagram session exists on this site address.</b> Browser connections are hostname-specific. If you opened a different Vercel URL, return to the original address or connect once on this permanent address.</p>
                )}
                {state.sessionState === "unreadable" && (
                  <p className="connectionError">The stored Instagram session can no longer be decrypted. Confirm that INSTAGRAM_SESSION_SECRET was not changed, then reconnect.</p>
                )}
                {state.configured ? (
                  <a
                    className="primary connectInstagram"
                    href="/api/instagram/connect"
                  >
                    <I.Camera />
                    Connect Instagram
                  </a>
                ) : (
                  <div className="setupChecklist">
                    <h4>One-time setup needed</h4>
                    <ol>
                      <li>
                        Create a Meta developer app with Instagram API access.
                      </li>
                      <li>
                        Add the app ID, app secret and session secret to the
                        host settings.
                      </li>
                      <li>
                        Add the callback URL shown below to Meta’s OAuth
                        redirect list.
                      </li>
                    </ol>
                    <label>
                      OAuth callback URL
                      <div>
                        <code>
                          {state.callbackUrl ||
                            `${location.origin}/api/instagram/callback`}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              state.callbackUrl ||
                                `${location.origin}/api/instagram/callback`,
                            );
                            notify("Callback URL copied");
                          }}
                        >
                          <I.Copy size={15} />
                        </button>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            )}
          </article>
          <FacebookConnection notify={notify} />
          <div className="publishingNotice">
            <I.Info />
            <div>
              <b>Account requirement</b>
              <p>
                Instagram direct publishing is available for professional
                Business or Creator accounts. Personal accounts need to be
                converted in Instagram first.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
function FacebookConnection({ notify }) {
  const [state, setState] = useState({ loading: true, configured: false, connected: false }),
    [disconnecting, setDisconnecting] = useState(false);
  const refresh = async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      let response = await fetch("/api/facebook/account?action=status", { credentials: "include" }),
        body = await response.json();
      setState({ ...body, loading: false });
    } catch {
      setState({ loading: false, configured: false, connected: false, error: "Facebook connection service is unavailable." });
    }
  };
  useEffect(() => {
    refresh();
    let query = new URLSearchParams(location.search), result = query.get("facebook");
    if (result) {
      notify(result === "connected" ? "Facebook Page connected successfully" : "Facebook connection was not completed");
      history.replaceState({}, "", location.pathname);
    }
  }, []);
  const test = async () => {
    try {
      let response = await fetch("/api/facebook/account?action=test", { credentials: "include" }), body = await response.json();
      if (!response.ok) throw new Error(body.error || "Connection test failed");
      notify(`Facebook connection verified for ${body.name}`);
    } catch (error) { notify(error.message); }
  };
  const disconnect = async () => {
    if (!confirm("Disconnect this Facebook Page? Scheduled content will stay in your calendar.")) return;
    setDisconnecting(true);
    try {
      let response = await fetch("/api/facebook/account?action=disconnect", { method: "POST", credentials: "include" });
      if (!response.ok) throw new Error();
      await refresh();
      notify("Facebook Page disconnected");
    } catch { notify("Could not disconnect Facebook"); }
    finally { setDisconnecting(false); }
  };
  return <article className="connectionCard facebookConnection">
    <div className="connectionBrand"><span className="facebookLogo">f</span><div><h3>Facebook Page</h3><p>Publish photos and multi-image posts to a Page feed.</p></div><span className={`connectionStatus ${state.connected ? "connected" : state.configured ? "ready" : "setup"}`}>{state.loading ? "Checking…" : state.connected ? "Connected" : state.configured ? "Ready to connect" : "Setup required"}</span></div>
    {state.loading ? <div className="connectionLoading"><I.LoaderCircle className="spin"/>Checking Facebook connection…</div> : state.connected ? <div className="connectedAccount"><div className="profileRow">{state.account?.picture ? <img src={state.account.picture}/> : <span className="profilePlaceholder facebookProfile">f</span>}<div><small>CONNECTED PAGE</small><h3>{state.account?.name || "Facebook Page"}</h3><p>Page ID {state.account?.id}</p></div><I.BadgeCheck className="verifiedConnection"/></div><div className="permissionGrid"><span><I.CheckCircle2/>Page access</span><span><I.CheckCircle2/>Feed publishing</span><span><I.CheckCircle2/>Secure token storage</span></div><div className="connectionActions"><button onClick={test}>Test connection</button><button className="dangerOutline" onClick={disconnect} disabled={disconnecting}>{disconnecting ? "Disconnecting…" : "Disconnect"}</button></div></div> : <div className="connectPrompt"><div className="oauthNote"><I.ShieldCheck/><div><b>Secure sign-in through Facebook</b><p>Sign in with the Facebook profile that manages the Page, then grant Page publishing access.</p></div></div>{state.error && <p className="connectionError">{state.error}</p>}{state.lastError && <p className="connectionError"><b>Facebook authorization failed at {state.lastError.stage.replaceAll("_", " ")}.</b><br/>{state.lastError.message}</p>}{state.configured ? <a className="primary connectInstagram" href="/api/facebook/connect"><span className="facebookButtonMark">f</span>Connect Facebook Page</a> : <div className="setupChecklist"><h4>One-time Facebook setup</h4><ol><li>Add Facebook Login to the Meta developer app.</li><li>Add FACEBOOK_APP_ID, FACEBOOK_APP_SECRET and FACEBOOK_SESSION_SECRET in Vercel.</li><li>Add the exact callback URL below to Valid OAuth Redirect URIs.</li></ol><label>OAuth callback URL<div><code>{state.callbackUrl || `${location.origin}/api/facebook/callback`}</code><button onClick={() => { navigator.clipboard.writeText(state.callbackUrl || `${location.origin}/api/facebook/callback`); notify("Facebook callback URL copied"); }}><I.Copy size={15}/></button></div></label></div>}</div>}
  </article>;
}
function normalizeAsset(a, i) {
  return Array.isArray(a)
    ? { id: "legacy-" + i, name: a[0], type: a[1], tags: [a[1]], src: "" }
    : a;
}
function fileData(file) {
  return new Promise((resolve, reject) => {
    let r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
function loadUploadImage(src) {
  return new Promise((resolve, reject) => {
    let image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("An image in this upload could not be decoded"));
    image.src = src;
  });
}
async function optimizedFileData(file, max = 1500, quality = 0.82) {
  if (file.size > 25_000_000)
    throw new Error(`${file.name} is larger than 25 MB`);
  let src = await fileData(file),
    image = await loadUploadImage(src),
    scale = Math.min(1, max / Math.max(image.width, image.height)),
    canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/webp", quality);
}
async function optimizedJpegData(file, max = 1800, quality = 0.9) {
  if (file.size > 25_000_000)
    throw new Error(`${file.name} is larger than 25 MB`);
  let src = await fileData(file),
    image = await loadUploadImage(src),
    scale = Math.min(1, max / Math.max(image.width, image.height)),
    canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  let context = canvas.getContext("2d");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}
async function zipImageFiles(file) {
  if (file.size > 50_000_000)
    throw new Error("ZIP files must be smaller than 50 MB");
  let bytes = new Uint8Array(await file.arrayBuffer()),
    archive = await new Promise((resolve, reject) =>
      unzip(
        bytes,
        {
          filter: (f) =>
            !/\/$/.test(f.name) &&
            !f.name.includes("__MACOSX") &&
            /\.(png|jpe?g|webp)$/i.test(f.name) &&
            (f.originalSize || 0) <= 25_000_000,
        },
        (error, data) => (error ? reject(error) : resolve(data)),
      ),
    ),
    rows = Object.entries(archive).slice(0, 50),
    total = rows.reduce((sum, [, data]) => sum + data.length, 0);
  if (total > 200_000_000)
    throw new Error(
      "The extracted images are too large; split this ZIP into smaller batches",
    );
  return rows.map(([path, data]) => {
    let ext = path.split(".").pop().toLowerCase(),
      type =
        ext === "png"
          ? "image/png"
          : ext === "webp"
            ? "image/webp"
            : "image/jpeg";
    return { path, file: new File([data], path.split("/").pop(), { type }) };
  });
}
const materialDefaults = {
  "Proof Split": ["Before image", "After image", "Logo", "CTA"],
  "Kit Grid": ["Product image", "Lifestyle image", "Logo", "CTA"],
  "Quantified Proof": ["Product image", "Supporting copy", "Logo", "CTA"],
  "Feature Breakdown": [
    "Product screenshot",
    "Product image",
    "Logo",
    "Supporting copy",
  ],
  "Before and After Reveal": ["Before image", "After image", "Logo", "CTA"],
  "How It Works": ["Product screenshot", "Product image", "Logo", "CTA"],
};
function ProductionV2({ data, setData, notify }) {
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    let open = (e) =>
      data.production.some((x) => x.id === e.detail?.id) &&
      setSelected(e.detail.id);
    window.addEventListener("scs-open-production", open);
    return () => window.removeEventListener("scs-open-production", open);
  }, [data.production]);
  let cols = [
    "Approved",
    "Waiting for Materials",
    "Ready to Create",
    "In Creation",
    "Ready for Review",
    "Ready to Publish",
    "Published",
  ];
  const move = (id, status) => {
    setData((d) => ({
      ...d,
      production: d.production.map((x) => (x.id === id ? { ...x, status } : x)),
    }));
    notify(`Moved to ${status}`);
  };
  return (
    <>
      <div className="kanban">
        {cols.map((c) => (
          <section
            key={c}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => move(e.dataTransfer.getData("id"), c)}
          >
            <h3>
              {c}
              <span>
                {data.production.filter((x) => x.status === c).length}
              </span>
            </h3>
            {data.production
              .filter((x) => x.status === c)
              .map((x) => {
                let mats = x.materialItems || [],
                  pct = mats.length
                    ? Math.round(
                        (mats.filter(
                          (m) =>
                            m.state === "complete" ||
                            m.state === "not-required",
                        ).length /
                          mats.length) *
                          100,
                      )
                    : x.materials || 0,
                  g = x.generationProgress;
                return (
                  <article
                    key={x.id}
                    className={x.status === "In Creation" ? "creatingCard" : ""}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("id", x.id)}
                    onClick={() => setSelected(x.id)}
                  >
                    <div className="thumb">
                      {x.rendered ? <img src={x.rendered} /> : <I.Image />}
                      {x.status === "In Creation" && (
                        <span className="creatingOverlay">
                          <I.LoaderCircle className="spin" />
                        </span>
                      )}
                    </div>
                    <b>{x.title}</b>
                    <p>
                      {x.format} · {x.platforms.join(", ")}
                    </p>
                    {x.status === "In Creation" ? (
                      <div className="cardGeneration">
                        <span>
                          <I.Sparkles />
                          AI is creating
                        </span>
                        <b>
                          {g?.completed || 0}/{g?.total || 1} ready
                        </b>
                        <div className="progress">
                          <i
                            style={{
                              width: `${Math.round(((g?.completed || 0) / (g?.total || 1)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <small>Materials</small>
                        <div className="progress">
                          <i style={{ width: pct + "%" }} />
                        </div>
                        <em>{pct}% complete</em>
                      </>
                    )}
                    {x.generationError && x.status !== "In Creation" && (
                      <small className="cardError">{x.generationError}</small>
                    )}
                    <button className="openWork">
                      {x.status === "In Creation"
                        ? "View progress"
                        : "Open workspace"}
                    </button>
                  </article>
                );
              })}
          </section>
        ))}
      </div>
      {selected && (
        <ContentWorkspace
          item={data.production.find((x) => x.id === selected)}
          idea={data.ideas.find(
            (x) =>
              x.id === data.production.find((p) => p.id === selected)?.ideaId,
          )}
          data={data}
          close={() => setSelected(null)}
          notify={notify}
          update={(patch) =>
            setData((d) => ({
              ...d,
              production: d.production.map((x) =>
                x.id === selected ? { ...x, ...patch } : x,
              ),
            }))
          }
        />
      )}
    </>
  );
}
function CreativeBrief({ item, idea, update, notify }) {
  let original = item.creativeBrief || {},
    [draft, setDraft] = useState({
      message: original.message ?? idea?.message ?? "",
      imageHeadline:
        original.imageHeadline ?? idea?.imageHeadline ?? idea?.hook ?? "",
      imageSupportingText:
        original.imageSupportingText ?? idea?.imageSupportingText ?? "",
    });
  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  return (
    <section className="creativeBrief">
      <div className="briefHeading">
        <div>
          <span className="sectionIcon">
            <I.MessageSquareText />
          </span>
          <div>
            <small>CREATIVE BRIEF</small>
            <h2>Message and on-image copy</h2>
            <p>
              These are the exact instructions the image generator will receive.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            update({ creativeBrief: draft });
            notify("Creative brief saved");
          }}
        >
          <I.Save size={15} />
          Save brief
        </button>
      </div>
      <div className="briefFields">
        <label>
          Core campaign message
          <textarea
            value={draft.message}
            onChange={(e) => set("message", e.target.value)}
          />
          <small>The meaning the audience should understand.</small>
        </label>
        <label>
          Exact headline on image
          <input
            value={draft.imageHeadline}
            maxLength={48}
            onChange={(e) => set("imageHeadline", e.target.value)}
          />
          <small>
            {draft.imageHeadline.length}/48 characters · rendered exactly as
            written.
          </small>
        </label>
        <label>
          Optional supporting line
          <input
            value={draft.imageSupportingText}
            maxLength={70}
            placeholder="Leave empty for no supporting text"
            onChange={(e) => set("imageSupportingText", e.target.value)}
          />
          <small>
            {draft.imageSupportingText.length}/70 characters · no other copy
            will be added.
          </small>
        </label>
      </div>
    </section>
  );
}
function ContentWorkspace({ item, idea, data, close, update, notify }) {
  const [tab, setTab] = useState("materials");
  let materials = item.materialItems || [],
    imageCount = materials.filter((m) => m.src).length;
  return (
    <div className="overlay workspaceOverlay">
      <div className="workspace">
        <div className="workHead">
          <div>
            <small>CONTENT WORKSPACE</small>
            <h2>{item.title}</h2>
            <p>
              {idea?.template || "Content template"} ·{" "}
              {item.carouselImages?.length > 1
                ? `${item.carouselImages.length}-slide carousel`
                : item.format}
            </p>
          </div>
          <button className="icon" onClick={close}>
            <I.X />
          </button>
        </div>
        <div className="workTabs">
          <button
            className={tab === "materials" ? "on" : ""}
            onClick={() => setTab("materials")}
          >
            <I.PackageOpen size={16} />
            Materials & creation <span>{imageCount}</span>
          </button>
          <button
            className={tab === "distribution" ? "on" : ""}
            onClick={() => setTab("distribution")}
          >
            <I.Send size={16} />
            Distribution
          </button>
        </div>
        {tab === "materials" ? (
          <>
            <CreativeBrief
              item={item}
              idea={idea}
              update={update}
              notify={notify}
            />
            <MaterialsPanel
              materials={materials}
              assets={data.assets.map(normalizeAsset)}
              item={item}
              idea={idea}
              update={update}
              notify={notify}
              close={close}
            />
          </>
        ) : (
          <DistributionPanel
            item={item}
            idea={idea}
            update={update}
            notify={notify}
          />
        )}
      </div>
    </div>
  );
}
function MaterialsPanel({
  materials,
  assets,
  item,
  idea,
  update,
  notify,
  close,
}) {
  const [dragging, setDragging] = useState(false),
    [choose, setChoose] = useState(false),
    [uploading, setUploading] = useState(false);
  let images = materials.filter((m) => m.src);
  const filesToEntries = async (files) => {
    let entries = [];
    for (let file of files) {
      let rows = file.type.startsWith("image/")
        ? [{ path: file.name, file }]
        : /\.zip$/i.test(file.name) || /zip/i.test(file.type)
          ? await zipImageFiles(file)
          : [];
      for (let row of rows) {
        entries.push({
          id: `raw-${Date.now()}-${entries.length}`,
          name: row.path,
          state: "complete",
          src: await optimizedFileData(row.file),
          value: row.path,
          required: false,
        });
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
    return entries;
  };
  const add = async (files) => {
    setUploading(true);
    try {
      let fresh = await filesToEntries(files);
      if (!fresh.length) return notify("No supported images were found");
      update({
        materialItems: [...images, ...fresh],
        materials: 100,
        status: "Ready to Create",
        generationError: "",
      });
      notify(
        `${fresh.length} source image${fresh.length === 1 ? "" : "s"} added · ready to create`,
      );
    } catch (e) {
      notify(`Upload failed: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };
  const remove = (id) => {
    let next = images.filter((m) => m.id !== id);
    update({
      materialItems: next,
      materials: next.length ? 100 : 0,
      status: "Ready to Create",
    });
  };
  const addAsset = (a) => {
    let fresh = {
      id: `raw-${Date.now()}`,
      name: a.name,
      state: "complete",
      src: a.src,
      value: a.name,
      required: false,
    };
    update({
      materialItems: [...images, fresh],
      materials: 100,
      status: "Ready to Create",
      generationError: "",
    });
    setChoose(false);
    notify("Asset added · ready to create");
  };
  const uploadFinal = async (files) => {
    let slides = [];
    for (let file of files
      .filter((x) => x.type.startsWith("image/"))
      .slice(0, 10))
      slides.push({
        src: await optimizedJpegData(file),
        width: 1080,
        height: 1080,
        style: `Uploaded slide ${slides.length + 1}`,
        platform: "Instagram",
      });
    if (!slides.length) return notify("Choose at least one finished image");
    update({
      rendered: slides[0].src,
      carouselImages: slides,
      generatedVariants: slides,
      selectedVariant: 0,
      format: slides.length > 1 ? "Carousel" : item.format,
      status: "Ready to Publish",
      materials: 100,
    });
    notify(
      slides.length > 1
        ? `${slides.length}-slide carousel is ready to publish`
        : "Finished content is ready to publish",
    );
  };
  return (
    <div className="materialsUnified">
      <section className="sourceSection">
        <div className="sectionHeading">
          <div>
            <span className="sectionIcon">
              <I.Images />
            </span>
            <div>
              <h2>Source materials</h2>
              <p>
                Optional: add product photos or brand references for fidelity,
                or start from the approved concept with no images.
              </p>
            </div>
          </div>
          <button onClick={() => setChoose(true)}>
            <I.Library size={16} />
            Choose from library
          </button>
        </div>
        <label
          className={`sourceDrop ${dragging ? "dragging" : ""}`}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            add([...e.dataTransfer.files]);
          }}
        >
          <input
            multiple
            type="file"
            accept="image/*,.zip,application/zip"
            onChange={(e) => add([...e.target.files])}
          />
          <I.UploadCloud />
          <b>
            {uploading
              ? "Importing your materials…"
              : "Drop as many images as you want"}
          </b>
          <p>or click to browse · PNG, JPG, WEBP or ZIP</p>
          {!images.length && (
            <small>No source image required — text-only generation is ready.</small>
          )}
        </label>
        {images.length > 0 && (
          <div className="sourceGrid">
            {images.map((m, i) => (
              <article key={m.id}>
                <img src={m.src} />
                <span>{i + 1}</span>
                <div>
                  <b>{m.name.split("/").pop()}</b>
                  <small>Source image</small>
                </div>
                <button onClick={() => remove(m.id)} title="Remove">
                  <I.X />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
      <ImageComposerBackend
        item={item}
        idea={idea}
        materials={images}
        update={update}
        notify={notify}
        close={close}
      />
      <section className="finalUpload">
        <div>
          <span>
            <I.Upload size={18} />
          </span>
          <div>
            <h3>Already have finished content?</h3>
            <p>
              Upload one image or a complete carousel and move it straight to
              Ready to Publish.
            </p>
          </div>
        </div>
        <label>
          <I.Send size={16} />
          Upload final result
          <input
            multiple
            type="file"
            accept="image/*"
            onChange={(e) => uploadFinal([...e.target.files])}
          />
        </label>
      </section>
      {choose && (
        <div className="assetPicker">
          <div>
            <h3>Select from Asset Library</h3>
            <button className="icon" onClick={() => setChoose(false)}>
              <I.X />
            </button>
          </div>
          <div>
            {assets
              .filter((a) => a.src)
              .map((a) => (
                <button key={a.id} onClick={() => addAsset(a)}>
                  <img src={a.src} />
                  <span>{a.name}</span>
                </button>
              ))}
            {!assets.some((a) => a.src) && (
              <p>Upload an image in Asset Library first.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
function ImageComposer({ item, idea, materials, update, notify }) {
  const canvas = React.useRef(null);
  const [settings, setSettings] = useState(
    item.composer || {
      headline: idea?.hook || item.title,
      subline: idea?.message || "",
      cta: materials.find((m) => m.name === "CTA")?.value || "Learn more",
      bg: "#eef4ff",
      accent: "#276df0",
      size: "1080x1080",
      layout: "split",
    },
  );
  let [width, height] = settings.size.split("x").map(Number);
  let images = materials.filter((m) => m.src);
  const draw = () => {
    let c = canvas.current;
    if (!c) return;
    c.width = width;
    c.height = height;
    let x = c.getContext("2d");
    x.fillStyle = settings.bg;
    x.fillRect(0, 0, width, height);
    let pad = 70;
    if (images[0]) {
      let im = new Image();
      im.onload = () => {
        let iw = settings.layout === "split" ? width * 0.48 : width - pad * 2,
          ih = settings.layout === "split" ? height : height * 0.54;
        let ix = settings.layout === "split" ? width - iw : pad,
          iy = settings.layout === "split" ? 0 : pad;
        x.save();
        x.beginPath();
        x.roundRect(ix, iy, iw, ih, settings.layout === "split" ? 0 : 28);
        x.clip();
        let scale = Math.max(iw / im.width, ih / im.height),
          sw = im.width * scale,
          sh = im.height * scale;
        x.drawImage(im, ix + (iw - sw) / 2, iy + (ih - sh) / 2, sw, sh);
        x.restore();
        paintText(x);
      };
      im.src = images[0].src;
    } else paintText(x);
  };
  const paintText = (x) => {
    let area = settings.layout === "split" ? width * 0.48 : width;
    x.fillStyle = "#172033";
    x.font = `600 ${Math.round(width * 0.052)}px Fredoka, sans-serif`;
    wrap(
      x,
      settings.headline,
      pad,
      settings.layout === "split" ? height * 0.27 : height * 0.7,
      area - pad * 1.5,
      Math.round(width * 0.065),
    );
    x.fillStyle = "#617087";
    x.font = `400 ${Math.round(width * 0.021)}px sans-serif`;
    wrap(
      x,
      settings.subline,
      pad,
      settings.layout === "split" ? height * 0.56 : height * 0.83,
      area - pad * 1.5,
      Math.round(width * 0.032),
    );
    x.fillStyle = settings.accent;
    x.roundRect(pad, height - 145, Math.min(300, area - pad * 2), 62, 16);
    x.fill();
    x.fillStyle = "white";
    x.font = `600 ${Math.round(width * 0.019)}px sans-serif`;
    x.fillText(settings.cta, pad + 27, height - 105);
  };
  const wrap = (x, text, left, top, max, line) => {
    let words = (text || "").split(" "),
      row = "";
    for (let w of words) {
      let test = row + w + " ";
      if (x.measureText(test).width > max && row) {
        x.fillText(row, left, top);
        row = w + " ";
        top += line;
      } else row = test;
    }
    x.fillText(row, left, top);
  };
  React.useEffect(draw, [settings, item.materialItems]);
  const save = () => {
    draw();
    setTimeout(() => {
      let url = canvas.current.toDataURL("image/png");
      update({
        rendered: url,
        composer: settings,
        status: "Ready for Review",
        materials: 100,
      });
      notify("Image rendered and saved");
    }, 100);
  };
  const download = () => {
    let a = document.createElement("a");
    a.download = (
      item.title.replace(/[^a-z0-9]+/gi, "-") + ".png"
    ).toLowerCase();
    a.href = canvas.current.toDataURL("image/png");
    a.click();
  };
  return (
    <div className="composer">
      <aside>
        <label>
          Headline
          <textarea
            value={settings.headline}
            onChange={(e) =>
              setSettings({ ...settings, headline: e.target.value })
            }
          />
        </label>
        <label>
          Supporting copy
          <textarea
            value={settings.subline}
            onChange={(e) =>
              setSettings({ ...settings, subline: e.target.value })
            }
          />
        </label>
        <label>
          CTA
          <input
            value={settings.cta}
            onChange={(e) => setSettings({ ...settings, cta: e.target.value })}
          />
        </label>
        <div className="two">
          <label>
            Format
            <select
              value={settings.size}
              onChange={(e) =>
                setSettings({ ...settings, size: e.target.value })
              }
            >
              <option value="1080x1080">Square 1:1</option>
              <option value="1080x1350">Portrait 4:5</option>
              <option value="1080x1920">Story 9:16</option>
              <option value="1200x627">LinkedIn 1.91:1</option>
            </select>
          </label>
          <label>
            Layout
            <select
              value={settings.layout}
              onChange={(e) =>
                setSettings({ ...settings, layout: e.target.value })
              }
            >
              <option value="split">Proof split</option>
              <option value="stack">Editorial stack</option>
            </select>
          </label>
        </div>
        <div className="two">
          <label>
            Background
            <input
              type="color"
              value={settings.bg}
              onChange={(e) => setSettings({ ...settings, bg: e.target.value })}
            />
          </label>
          <label>
            Accent
            <input
              type="color"
              value={settings.accent}
              onChange={(e) =>
                setSettings({ ...settings, accent: e.target.value })
              }
            />
          </label>
        </div>
        <div className="composerActions">
          <button onClick={draw}>Refresh preview</button>
          <button className="primary" onClick={save}>
            <I.WandSparkles size={16} />
            Render & save
          </button>
          <button onClick={download}>
            <I.Download size={16} />
            Download PNG
          </button>
        </div>
      </aside>
      <div className="canvasStage">
        <div>
          <canvas ref={canvas} />
        </div>
        <small>
          {width} × {height}px · {idea?.template}
        </small>
      </div>
    </div>
  );
}
function DistributionPanel({ item, idea, update, notify }) {
  let current = item.versions || {};
  const destinations = [
    "Instagram Feed",
    "Instagram Story",
    "LinkedIn",
    "Facebook",
    "TikTok",
    "X",
  ];
  const [selected, setSelected] = useState(item.destinations || item.platforms);
  const [versions, setVersions] = useState(current);
  const toggle = (p) =>
    setSelected(
      selected.includes(p) ? selected.filter((x) => x !== p) : [...selected, p],
    );
  const sample = (p) =>
    p.includes("LinkedIn")
      ? `${idea?.hook}\n\n${idea?.message}\n\nA practical way for commerce teams to create more without losing consistency.`
      : `${idea?.hook} ✨\n\n${idea?.message}\n\nCreate it. Refine it. Publish it.`;
  return (
    <div className="distribution">
      <h3>Publishing destinations</h3>
      <div className="chips">
        {destinations.map((p) => (
          <button
            className={selected.includes(p) ? "selected" : ""}
            onClick={() => toggle(p)}
          >
            {p}
          </button>
        ))}
      </div>
      {selected.map((p) => {
        let v = versions[p] || {
          caption: sample(p),
          cta: "Learn more",
          hashtags: p.includes("LinkedIn")
            ? "#AI #Ecommerce #CreativeOps"
            : "#AIContent #ProductPhotography #Ecommerce",
          date: "",
          time: "10:00",
        };
        let set = (k, val) =>
          setVersions({ ...versions, [p]: { ...v, [k]: val } });
        return (
          <section>
            <h3>{p}</h3>
            <label>
              Caption
              <textarea
                value={v.caption}
                onChange={(e) => set("caption", e.target.value)}
              />
            </label>
            <div>
              <label>
                CTA
                <input
                  value={v.cta}
                  onChange={(e) => set("cta", e.target.value)}
                />
              </label>
              <label>
                Hashtags
                <input
                  value={v.hashtags}
                  onChange={(e) => set("hashtags", e.target.value)}
                />
              </label>
              <label>
                Date
                <input
                  type="date"
                  value={v.date}
                  onChange={(e) => set("date", e.target.value)}
                />
              </label>
              <label>
                Time
                <input
                  type="time"
                  value={v.time}
                  onChange={(e) => set("time", e.target.value)}
                />
              </label>
            </div>
          </section>
        );
      })}
      <button
        className="primary"
        onClick={() => {
          update({
            destinations: selected,
            versions,
            status: selected.some((p) => versions[p]?.date)
              ? "Ready to Publish"
              : item.status,
          });
          notify("Platform versions saved");
        }}
      >
        Save platform versions
      </button>
    </div>
  );
}
function AssetsV2({ data, setData }) {
  const [q, setQ] = useState(""),
    [type, setType] = useState("All"),
    [preview, setPreview] = useState(null),
    [dragging, setDragging] = useState(false),
    [importing, setImporting] = useState(false),
    [importMessage, setImportMessage] = useState("");
  let assets = data.assets.map(normalizeAsset);
  const assetType = (name) =>
    /logo/i.test(name)
      ? "Logo"
      : /screen|capture|ui/i.test(name)
        ? "Screenshot"
        : /lifestyle|model|scene/i.test(name)
          ? "Lifestyle image"
          : /graphic|banner|brand/i.test(name)
            ? "Brand graphic"
            : "Product image";
  const addImages = async (entries, fromZip = "") => {
    let fresh = [];
    for (let entry of entries.slice(0, 50)) {
      let file = entry.file || entry;
      if (!file.type.startsWith("image/")) continue;
      let path = entry.path || file.name,
        folder = path.includes("/") ? path.split("/").slice(0, -1).pop() : "";
      let asset = {
        id: "a" + Date.now() + fresh.length,
        name: file.name.replace(/\.[^.]+$/, ""),
        type: assetType(path),
        tags: [fromZip ? "ZIP import" : "Uploaded", folder].filter(Boolean),
        src: await optimizedFileData(file, 1200, 0.78),
        created: Date.now(),
      };
      fresh.push(asset);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    if (fresh.length)
      setData((d) => ({
        ...d,
        deletedAssetIds: (d.deletedAssetIds || []).filter((id) => !fresh.some((asset) => asset.id === id)),
        assets: mergeAssetLists(fresh, d.assets || []),
      }));
    return fresh.length;
  };
  const upload = async (files) => {
    setImporting(true);
    setImportMessage("");
    let count = 0,
      skipped = 0;
    try {
      for (let file of files) {
        if (file.type.startsWith("image/")) count += await addImages([file]);
        else if (/\.zip$/i.test(file.name) || /zip/i.test(file.type)) {
          let entries = await zipImageFiles(file);
          count += await addImages(entries, file.name);
        } else skipped++;
      }
      setImportMessage(
        count
          ? `${count} optimized asset${count === 1 ? "" : "s"} imported${skipped ? " · unsupported files skipped" : ""}`
          : "No supported images were found.",
      );
    } catch (e) {
      setImportMessage(`ZIP import failed: ${e.message}`);
    } finally {
      setImporting(false);
    }
  };
  const remove = async (id) => {
    if (!confirm("Delete this asset permanently?")) return;
    await deleteCachedAsset(id);
    setData((d) => ({
      ...d,
      deletedAssetIds: [...new Set([...(d.deletedAssetIds || []), id])],
      assets: d.assets.filter((a, i) => normalizeAsset(a, i).id !== id),
    }));
  };
  return (
    <>
      <div className="toolbar">
        <div>
          <I.Search size={17} />
          <input
            placeholder="Search by name or tag"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option>All</option>
          {[
            "Logo",
            "Product image",
            "Screenshot",
            "Lifestyle image",
            "Brand graphic",
            "Video",
          ].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <label className="primary upload">
          <I.Upload size={17} />
          {importing ? "Importing…" : "Upload assets or ZIP"}
          <input
            multiple
            accept="image/*,.zip,application/zip"
            type="file"
            onChange={(e) => upload([...e.target.files])}
          />
        </label>
      </div>
      <div
        className={`dropzone ${dragging ? "dragging" : ""}`}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          upload([...e.dataTransfer.files]);
        }}
      >
        <I.ArchiveRestore />
        <div>
          <b>Drop images or a ZIP archive</b>
          <p>
            Folders inside ZIP files become searchable tags. Supports PNG, JPG
            and WEBP.
          </p>
          {importMessage && (
            <small
              className={
                importMessage.startsWith("ZIP import failed")
                  ? "importError"
                  : ""
              }
            >
              {importMessage}
            </small>
          )}
        </div>
      </div>
      <div className="assets">
        {assets
          .filter(
            (a) =>
              (type === "All" || a.type === type) &&
              `${a.name} ${(a.tags || []).join(" ")}`
                .toLowerCase()
                .includes(q.toLowerCase()),
          )
          .map((a) => (
            <article key={a.id}>
              <div onClick={() => a.src && setPreview(a)}>
                {a.src ? <img src={a.src} /> : <I.Image size={38} />}
              </div>
              <b>{a.name}</b>
              <small>{a.type}</small>
              <div className="assetTags">
                {(a.tags || []).slice(0, 2).map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <button onClick={() => remove(a.id)}>
                <I.Trash2 size={16} />
              </button>
            </article>
          ))}
      </div>
      {!assets.length && (
        <div className="empty">
          <I.Images />
          <h3>Your asset library is empty</h3>
          <p>Upload images directly or drop a ZIP with organized folders.</p>
        </div>
      )}
      {preview && (
        <div className="modalback" onClick={() => setPreview(null)}>
          <div className="assetPreview" onClick={(e) => e.stopPropagation()}>
            <button className="icon" onClick={() => setPreview(null)}>
              <I.X />
            </button>
            <img src={preview.src} />
            <h3>{preview.name}</h3>
            <p>{preview.type}</p>
          </div>
        </div>
      )}
    </>
  );
}
function loadCanvasImage(src) {
  return new Promise((resolve, reject) => {
    let im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = src;
  });
}
function fitImage(ctx, img, x, y, w, h) {
  let scale = Math.max(w / img.width, h / img.height),
    sw = img.width * scale,
    sh = img.height * scale;
  ctx.drawImage(img, x + (w - sw) / 2, y + (h - sh) / 2, sw, sh);
}
function textLines(ctx, text, maxWidth, maxLines = 4) {
  let words = (text || "").split(/\s+/),
    lines = [],
    line = "";
  for (let word of words) {
    let test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    } else line = test;
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}
async function aiRenderVisual({ idea, item, materials, variant }) {
  let platform = item.platforms?.[0] || "Instagram";
  let size = platform.includes("LinkedIn")
    ? [1200, 627]
    : platform.includes("Story") || platform.includes("TikTok")
      ? [1080, 1920]
      : [1080, 1080];
  let [w, h] = size,
    c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  let x = c.getContext("2d"),
    styles = [
      { bg: "#f4f7ff", accent: "#276df0", ink: "#14213d" },
      { bg: "#151d2e", accent: "#78a7ff", ink: "#ffffff" },
      { bg: "#f5f1eb", accent: "#ea6b45", ink: "#1d2738" },
    ],
    s = styles[variant % styles.length];
  x.fillStyle = s.bg;
  x.fillRect(0, 0, w, h);
  let imageMats = materials.filter((m) => m.src && !/logo/i.test(m.name)),
    logo = materials.find((m) => m.src && /logo/i.test(m.name)),
    main = imageMats[0]?.src ? await loadCanvasImage(imageMats[0].src) : null,
    second = imageMats[1]?.src ? await loadCanvasImage(imageMats[1].src) : null,
    pad = Math.round(w * 0.065),
    split = variant !== 1;
  if (main) {
    if (split) {
      let ix = w * 0.52,
        iw = w * 0.48;
      x.save();
      x.beginPath();
      x.rect(ix, 0, iw, h);
      x.clip();
      fitImage(x, main, ix, 0, iw, h);
      x.restore();
      x.fillStyle = s.accent;
      x.fillRect(ix - 10, 0, 10, h);
    } else {
      x.save();
      x.beginPath();
      x.roundRect(pad, pad, w - pad * 2, h * 0.48, 32);
      x.clip();
      fitImage(x, main, pad, pad, w - pad * 2, h * 0.48);
      x.restore();
    }
  }
  if (second && variant === 2) {
    let d = Math.round(w * 0.23);
    x.save();
    x.beginPath();
    x.arc(w * 0.77, h * 0.74, d / 2, 0, Math.PI * 2);
    x.clip();
    fitImage(x, second, w * 0.77 - d / 2, h * 0.74 - d / 2, d, d);
    x.restore();
    x.strokeStyle = s.accent;
    x.lineWidth = 8;
    x.stroke();
  }
  let textWidth = split ? w * 0.39 : w - pad * 2,
    textTop = split ? h * 0.22 : h * 0.6;
  x.fillStyle = s.accent;
  x.font = `700 ${Math.round(w * 0.018)}px Arial`;
  x.fillText((idea?.angle || "PRODUCT STORY").toUpperCase(), pad, textTop - 48);
  x.fillStyle = s.ink;
  x.font = `600 ${Math.round(w * (split ? 0.055 : 0.05))}px Fredoka,Arial`;
  let title = textLines(x, idea?.hook || item.title, textWidth, 4);
  title.forEach((l, i) =>
    x.fillText(l, pad, textTop + i * Math.round(w * 0.064)),
  );
  let bodyY = textTop + title.length * Math.round(w * 0.064) + 32;
  x.globalAlpha = 0.72;
  x.font = `400 ${Math.round(w * 0.019)}px Arial`;
  textLines(x, idea?.message || "", textWidth, 3).forEach((l, i) =>
    x.fillText(l, pad, bodyY + i * Math.round(w * 0.029)),
  );
  x.globalAlpha = 1;
  let cta =
    materials.find((m) => m.name === "CTA")?.value || "Create your next visual";
  x.fillStyle = s.accent;
  x.beginPath();
  x.roundRect(pad, h - 125, Math.min(textWidth, 330), 60, 16);
  x.fill();
  x.fillStyle = variant === 1 ? "#14213d" : "#fff";
  x.font = `700 ${Math.round(w * 0.017)}px Arial`;
  x.fillText(cta, pad + 25, h - 87);
  if (logo) {
    let li = await loadCanvasImage(logo.src),
      lw = 120,
      lh = (li.height / li.width) * lw;
    x.drawImage(li, pad, pad, lw, lh);
  } else {
    x.fillStyle = s.ink;
    x.globalAlpha = 0.5;
    x.font = `600 ${Math.round(w * 0.014)}px Arial`;
    x.fillText("SOCIAL CONTENT STUDIO", pad, pad);
    x.globalAlpha = 1;
  }
  return {
    src: c.toDataURL("image/png"),
    width: w,
    height: h,
    style: ["Clean split", "Editorial dark", "Warm campaign"][variant],
    platform,
  };
}
function ImageComposerAI({ item, idea, materials, update, notify }) {
  const [busy, setBusy] = useState(false),
    [variants, setVariants] = useState(item.generatedVariants || []),
    [error, setError] = useState("");
  let images = materials.filter((m) => m.src && !/logo/i.test(m.name));
  const generate = async () => {
    if (!images.length) {
      setError(
        "Upload at least one product, before, after or lifestyle image.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      let out = [];
      for (let i = 0; i < 3; i++)
        out.push(await aiRenderVisual({ idea, item, materials, variant: i }));
      setVariants(out);
      update({
        generatedVariants: out,
        rendered: out[0].src,
        status: "Ready for Review",
        materials: 100,
      });
      notify("AI created 3 finished image directions");
    } catch (e) {
      setError(
        "One of the uploaded images could not be rendered. Try uploading it again as PNG or JPG.",
      );
    } finally {
      setBusy(false);
    }
  };
  const select = (v, i) => {
    update({ rendered: v.src, selectedVariant: i, status: "Ready for Review" });
    notify(`Variant ${i + 1} selected as final`);
  };
  const download = (v, i) => {
    let a = document.createElement("a");
    a.download = `${item.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${i + 1}.png`;
    a.href = v.src;
    a.click();
  };
  return (
    <div className="aiCreator">
      <section className="aiBrief">
        <div className="aiBadge">
          <I.Sparkles size={17} />
          AI CREATIVE DIRECTION
        </div>
        <h2>Your materials are ready. The AI handles the rest.</h2>
        <p>
          Copy, hierarchy, layout, colors, platform dimensions and image
          placement are generated automatically from the approved idea and
          selected template.
        </p>
        <div className="rawSummary">
          <b>Raw materials received</b>
          <div>
            {materials
              .filter((m) => m.state === "complete")
              .map((m) => (
                <span>
                  {m.src && <img src={m.src} />}
                  <I.CheckCircle2 size={13} />
                  {m.name}
                </span>
              ))}
          </div>
        </div>
        <div className="aiDecisions">
          <span>
            <I.LayoutTemplate />
            Layout selected automatically
          </span>
          <span>
            <I.Type />
            Copy derived from approved idea
          </span>
          <span>
            <I.Maximize />
            Sized for {item.platforms?.join(" + ")}
          </span>
        </div>
        {error && <p className="renderError">{error}</p>}
        <button
          className="primary generateVisual"
          onClick={generate}
          disabled={busy}
        >
          {busy ? (
            <>
              <I.LoaderCircle className="spin" />
              Creating 3 directions…
            </>
          ) : (
            <>
              <I.WandSparkles />
              Generate finished content
            </>
          )}
        </button>
        <small>
          No manual design setup required. Generate again whenever you want
          fresh directions.
        </small>
      </section>
      {variants.length > 0 && (
        <section className="variantArea">
          <div className="variantTitle">
            <div>
              <h3>AI-generated directions</h3>
              <p>Choose the strongest option or generate a new set.</p>
            </div>
            <button onClick={generate} disabled={busy}>
              <I.RefreshCw size={15} />
              Generate new set
            </button>
          </div>
          <div className="variants">
            {variants.map((v, i) => (
              <article
                className={
                  item.selectedVariant === i ||
                  (!item.selectedVariant && i === 0)
                    ? "chosen"
                    : ""
                }
              >
                <div>
                  <img src={v.src} />
                  <span>{v.style}</span>
                </div>
                <footer>
                  <div>
                    <b>Direction {i + 1}</b>
                    <small>
                      {v.width} × {v.height} · {v.platform}
                    </small>
                  </div>
                  <button onClick={() => download(v, i)} title="Download">
                    <I.Download size={16} />
                  </button>
                  <button
                    className="selectVariant"
                    onClick={() => select(v, i)}
                  >
                    {item.selectedVariant === i ? "Selected" : "Use this"}
                  </button>
                </footer>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
function compressForAI(src) {
  return new Promise((resolve, reject) => {
    let im = new Image();
    im.onload = () => {
      let max = 1024,
        scale = Math.min(1, max / Math.max(im.width, im.height)),
        c = document.createElement("canvas");
      c.width = Math.round(im.width * scale);
      c.height = Math.round(im.height * scale);
      let context = c.getContext("2d");
      context.fillStyle = "#fff";
      context.fillRect(0, 0, c.width, c.height);
      context.drawImage(im, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.78));
    };
    im.onerror = reject;
    im.src = src;
  });
}
function createEditMask(src, region) {
  return new Promise((resolve, reject) => {
    let im = new Image();
    im.onload = () => {
      let c = document.createElement("canvas");
      c.width = im.naturalWidth;
      c.height = im.naturalHeight;
      let x = c.getContext("2d");
      x.fillStyle = "#000";
      x.fillRect(0, 0, c.width, c.height);
      x.clearRect(
        Math.round(region.x * c.width),
        Math.round(region.y * c.height),
        Math.max(1, Math.round(region.w * c.width)),
        Math.max(1, Math.round(region.h * c.height)),
      );
      resolve(c.toDataURL("image/png"));
    };
    im.onerror = reject;
    im.src = src;
  });
}
function AreaMarker({ src, value, save, close }) {
  const [draft, setDraft] = useState(value),
    [start, setStart] = useState(null);
  const point = (e) => {
    let b = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - b.left) / b.width)),
      y: Math.max(0, Math.min(1, (e.clientY - b.top) / b.height)),
    };
  };
  const begin = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    let p = point(e);
    setStart(p);
    setDraft({ x: p.x, y: p.y, w: 0, h: 0 });
  };
  const move = (e) => {
    if (!start) return;
    let p = point(e);
    setDraft({
      x: Math.min(start.x, p.x),
      y: Math.min(start.y, p.y),
      w: Math.abs(p.x - start.x),
      h: Math.abs(p.y - start.y),
    });
  };
  const end = () => setStart(null),
    valid = draft && draft.w > 0.015 && draft.h > 0.015;
  return (
    <div className="modalback areaMarkerBack" onClick={close}>
      <section className="areaMarker" onClick={(e) => e.stopPropagation()}>
        <header>
          <div>
            <small>MASKED REFINEMENT</small>
            <h2>Mark the area to change</h2>
            <p>
              Drag a box over the part AI should edit. Everything outside it
              will be preserved.
            </p>
          </div>
          <button className="icon" onClick={close}>
            <I.X />
          </button>
        </header>
        <div
          className="areaCanvas"
          onPointerDown={begin}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        >
          <img src={src} draggable="false" />
          {draft && (
            <span
              className="markedRegion"
              style={{
                left: `${draft.x * 100}%`,
                top: `${draft.y * 100}%`,
                width: `${draft.w * 100}%`,
                height: `${draft.h * 100}%`,
              }}
            >
              <b>EDIT THIS AREA</b>
            </span>
          )}
        </div>
        <footer>
          <button onClick={() => setDraft(null)} disabled={!draft}>
            Clear
          </button>
          <button
            className="primary"
            onClick={() => {
              if (valid) {
                save(draft);
                close();
              }
            }}
            disabled={!valid}
          >
            <I.Crosshair />
            Use marked area
          </button>
        </footer>
      </section>
    </div>
  );
}
function carouselPlanRole(index, count) {
  let arcs = {
    2: ["Situation", "Payoff"],
    3: ["Situation", "Turning point", "Payoff"],
    4: ["Situation", "Tension", "Turning point", "Payoff"],
    5: ["Situation", "Tension", "Turning point", "Proof", "Payoff"],
    6: ["Situation", "Tension", "Decision", "Transformation", "Proof", "Payoff"],
  };
  return (arcs[count] || arcs[4])[index] || "Story beat";
}
function carouselStoryProfile(idea = {}) {
  let text = [
      idea.title,
      idea.message,
      idea.hook,
      idea.creativeDirection,
      idea.visualBrief,
      idea.pillar,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  if (/channel|placement|format|feed|story|campaign/.test(text))
    return {
      situation: "The product is ready. The channel assets are not.",
      tension: "The launch clock keeps moving while every placement needs a different creative.",
      turn: "Start with the product source you already have.",
      proof: "One product becomes a consistent set of channel-ready scenes.",
      payoff: "One product. Every channel. Still unmistakably your brand.",
      context: "an ecommerce marketer preparing a launch across several placements",
    };
  if (/context|lifestyle|scene|on.model|background/.test(text))
    return {
      situation: "The packshot is ready. The story is missing.",
      tension: "A clean cutout explains what it is, not why someone would want it.",
      turn: "Place the exact same product inside a believable customer moment.",
      proof: "The product stays accurate while the setting creates relevance and desire.",
      payoff: "Same product. Now it belongs in their world.",
      context: "a creative lead turning a plain product photo into a believable customer scene",
    };
  if (/review|quality|check|identity|accur/.test(text))
    return {
      situation: "The image looks polished at first glance.",
      tension: "Then someone notices the collar, texture or product shape is no longer right.",
      turn: "Review product identity before judging the polish.",
      proof: "Compare the source and result detail by detail before approving the creative.",
      payoff: "A beautiful image only works when the product is still true.",
      context: "a creative reviewer inspecting an AI product image before campaign approval",
    };
  if (/workflow|bulk|faster|scale|variation|input/.test(text))
    return {
      situation: "The brief changed again, but the campaign is due tomorrow.",
      tension: "The team has one usable product image and a growing list of deliverables.",
      turn: "Reuse the source instead of restarting the shoot.",
      proof: "Build the packshot, lifestyle view and detail creative from the same product identity.",
      payoff: "The campaign moves forward without rebuilding everything from zero.",
      context: "a small ecommerce team racing to finish a campaign after a late brief change",
    };
  if (/proof|claim|trust|test|before|after/.test(text))
    return {
      situation: "You have seen the promise. Now show the proof.",
      tension: "Another claim will not make it believable.",
      turn: "Show the original input and let people inspect what changed.",
      proof: "Keep the product constant and make the transformation visible.",
      payoff: "Do not ask for trust. Make the change visible.",
      context: "a skeptical ecommerce buyer comparing a raw product input with the finished result",
    };
  return {
    situation: "The launch is close. The content is not ready.",
    tension: "The team has fewer raw materials than the campaign needs.",
    turn: "Start with what already exists and build outward from one clear message.",
    proof: "Keep the product consistent while each image adds a useful new angle.",
    payoff: "Start with less. Build a complete campaign.",
    context: "an ecommerce team trying to finish a product launch with limited source material",
  };
}
function buildCarouselPlan(count, idea = {}, existing = []) {
  let story = carouselStoryProfile(idea),
    roles = Array.from({ length: count }, (_, index) =>
      carouselPlanRole(index, count),
    ),
    copyByRole = {
      Situation: story.situation,
      Tension: story.tension,
      "Turning point": story.turn,
      Decision: story.turn,
      Transformation: story.proof,
      Proof: story.proof,
      Payoff: story.payoff,
    };
  return Array.from({ length: count }, (_, index) => {
    let role = roles[index],
      previousRole = index ? roles[index - 1] : null,
      nextRole = index < count - 1 ? roles[index + 1] : null,
      copy = copyByRole[role],
      beat =
        role === "Situation"
          ? `Put the viewer inside a familiar moment: ${story.situation} The protagonist is ${story.context}.`
          : role === "Tension"
            ? `Make the consequence of the opening moment visible: ${story.tension}`
            : ["Turning point", "Decision"].includes(role)
              ? `Show the decision that changes the direction of the story: ${story.turn}`
              : ["Transformation", "Proof"].includes(role)
                ? `Demonstrate the change instead of claiming it: ${story.proof}`
                : `Resolve the opening tension with a clear emotional and visual payoff: ${story.payoff}`,
      visual = `Show ${role.toLowerCase()} as a real moment involving ${story.context}. Continue from ${previousRole || "the audience's everyday reality"}${nextRole ? ` and create a visual reason to swipe toward ${nextRole.toLowerCase()}` : ". Close the story"}. The image must communicate the beat even with all text removed; use the same product, protagonist or environment when continuity is relevant. Do not make a product-and-headline poster or a generic montage.`;
    let defaults = { index, role, beat, copy, visual };
    return existing[index]?.customized
      ? { ...defaults, ...existing[index], index, role }
      : defaults;
  });
}
function ImageComposerBackend({
  item,
  idea,
  materials,
  update,
  notify,
  close,
}) {
  let creativeIdea = { ...idea, ...(item.creativeBrief || {}) };
  const [busy, setBusy] = useState(false),
    [variants, setVariants] = useState(
      item.carouselImages || item.generatedVariants || [],
    ),
    [error, setError] = useState(""),
    [accessKey, setAccessKey] = useState(""),
    [editPrompt, setEditPrompt] = useState(""),
    [mode, setMode] = useState(
      item.format === "Carousel" || item.carouselImages?.length > 1
        ? "carousel"
        : "single",
    ),
    [slideCount, setSlideCount] = useState(
      item.carouselImages?.length || item.formatCount || idea?.formatCount || 4,
    ),
    [carouselPlan, setCarouselPlan] = useState(() =>
      buildCarouselPlan(
        item.carouselImages?.length || item.formatCount || idea?.formatCount || 4,
        creativeIdea,
        item.carouselPlan || [],
      ),
    ),
    [needsAuth, setNeedsAuth] = useState(
      () =>
        typeof localStorage === "undefined" ||
        localStorage.getItem("ai-browser-connected") !== "1",
    ),
    [preview, setPreview] = useState(null),
    [marking, setMarking] = useState(false),
    [maskRegion, setMaskRegion] = useState(null);
  let images = materials.filter((m) => m.src && !/logo/i.test(m.name)),
    selectedIndex = Number.isInteger(item.selectedVariant)
      ? item.selectedVariant
      : 0,
    selected = variants[selectedIndex] || variants[0];
  const sendJob = (detail) =>
    window.dispatchEvent(new CustomEvent("scs-job", { detail }));
  const authenticate = async () => {
    if (!needsAuth) return;
    if (!accessKey)
      throw new Error(
        "Connect this browser once with your private passphrase.",
      );
    let login = await fetch("/api/session", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessKey }),
      }),
      body = await login.json();
    if (!login.ok) throw new Error(body.error || "Connection failed");
    localStorage.setItem("ai-browser-connected", "1");
    setNeedsAuth(false);
    setAccessKey("");
  };
  const request = async ({
    sources,
    coverImage,
    refinement,
    mask,
    count = 1,
    slideIndex,
    slideCount,
    plan,
  }) => {
    let controller = new AbortController(),
      timeout = setTimeout(() => controller.abort(), 360000);
    try {
      let response = await fetch("/api/generate", {
          method: "POST",
          credentials: "include",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            images: sources,
            coverImage,
            mask,
            materialNames: materials.filter((m) => m.src).map((m) => m.name),
            idea: creativeIdea,
            template: creativeIdea?.template,
            platform: item.platforms?.[0],
            brand: {
              name: "Social Content Studio",
              voice: "clean, confident, premium",
            },
            refinement,
            count,
            slideIndex,
            slideCount,
            carouselPlan: plan,
            carousel: (slideCount || count) > 1,
          }),
        }),
        raw = await response.text(),
        body;
      try {
        body = JSON.parse(raw);
      } catch {
        body = {
          error:
            response.status === 413
              ? "The source-image batch is too large. Remove one source image and retry."
              : raw || "Generation service returned an invalid response.",
        };
      }
      if (response.status === 401) {
        setNeedsAuth(true);
        localStorage.removeItem("ai-browser-connected");
      }
      if (!response.ok) throw new Error(body.error || "Generation failed");
      return body;
    } finally {
      clearTimeout(timeout);
    }
  };
  const messageFor = (e) =>
    /billing hard limit|billing limit|quota/i.test(e.message || "")
      ? "OpenAI billing limit reached. Increase the API project budget or add credits, then retry this job."
      : e.name === "AbortError"
      ? "This slide timed out. Retry the job; completed carousel slides have been preserved."
      : e.message === "Failed to fetch"
        ? "The secure AI backend is not connected yet."
        : e.message;
  const generate = async () => {
    let count =
        mode === "carousel" ? Math.max(2, Math.min(6, +slideCount || 4)) : 1,
      jobId = `generation-${item.id}-${Date.now()}`,
      approvedPlan =
        count > 1 ? buildCarouselPlan(count, creativeIdea, carouselPlan) : [];
    setBusy(true);
    setError("");
    try {
      await authenticate();
      let sources = await Promise.all(
          images.slice(0, 3).map((m) => compressForAI(m.src)),
        ),
        payload = {
          images: sources,
          materialNames: materials.filter((m) => m.src).map((m) => m.name),
          idea: creativeIdea,
          template: creativeIdea?.template,
          platform: item.platforms?.[0],
          brand: {
            name: "Social Content Studio",
            voice: "clean, confident, premium",
          },
          count: 1,
          slideIndex: 0,
          slideCount: count,
          carouselPlan: approvedPlan,
          carousel: count > 1,
        },
        meta = {
          kind: "generate-slide",
          productionId: item.id,
          total: count,
          title: item.title,
        };
      update({
        status: "In Creation",
        generationJobId: jobId,
        generationStartedAt: Date.now(),
        generationProgress: { completed: 0, total: count, state: "running" },
        generationError: "",
        carouselPlan: approvedPlan,
        generationRequest: { id: jobId, owner: runtimeId, payload, meta },
      });
      sendJob({
        id: jobId,
        productionId: item.id,
        title: `${item.title}${count > 1 ? ` · ${count}-slide carousel` : ""}`,
        status: "running",
        completed: 0,
        total: count,
        startedAt: Date.now(),
      });
      notify("Creative job is running in the background");
      close?.();
      let results = [],
        failedSlides = [],
        coverImage = null;
      for (let slideIndex = 0; slideIndex < count; slideIndex++) {
        let slidePayload = {
            ...payload,
            coverImage,
            count: 1,
            slideIndex,
            slideCount: count,
          },
          slideMeta = { ...meta, slideIndex };
        update({
          generationRequest: {
            id: jobId,
            owner: runtimeId,
            payload: slidePayload,
            meta: slideMeta,
          },
        });
        try {
          let body,
            lastError;
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              body = await request({
                sources,
                coverImage,
                count: 1,
                slideIndex,
                slideCount: count,
                plan: approvedPlan,
              });
              break;
            } catch (attemptError) {
              lastError = attemptError;
              if (/billing|quota|hard limit/i.test(attemptError.message || ""))
                throw attemptError;
            }
          }
          if (!body)
            throw lastError || new Error(`Slide ${slideIndex + 1} failed`);
          let slide = body.images?.[0];
          if (!slide)
            throw new Error(`Slide ${slideIndex + 1} returned no image`);
          results.push(slide);
          coverImage = slide.src;
          setVariants([...results]);
          update({
            generatedVariants: [...results],
            carouselImages: [...results],
            rendered: results[0].src,
            generationProgress: {
              completed: results.length,
              total: count,
              state: "running",
            },
          });
          sendJob({
            id: jobId,
            status: "running",
            completed: results.length,
            total: count,
          });
        } catch (slideError) {
          failedSlides.push({
            slide: slideIndex + 1,
            error: messageFor(slideError),
          });
          if (
            slideIndex === 0 ||
            /billing|quota|hard limit/i.test(slideError.message || "")
          )
            throw slideError;
        }
      }
      if (!results.length)
        throw new Error("No requested images could be generated");
      let warning = failedSlides.length
        ? `${results.length} of ${count} slides completed`
        : "";
      setVariants(results);
      update({
        generatedVariants: results,
        carouselImages: results,
        rendered: results[0].src,
        selectedVariant: 0,
        format: results.length > 1 ? "Carousel" : item.format,
        status: "Ready for Review",
        materials: 100,
        generationWarning: warning,
        failedSlides,
        generationProgress: {
          completed: results.length,
          total: count,
          state: "ready",
        },
        generationFinishedAt: Date.now(),
        generationError: "",
        generationRequest: null,
      });
      sendJob({
        id: jobId,
        status: "ready",
        completed: results.length,
        total: count,
        warning,
        finishedAt: Date.now(),
      });
      notify(
        warning ||
          `${count > 1 ? "Carousel" : "Finished image"} is ready for review`,
      );
    } catch (e) {
      let message = messageFor(e);
      setError(message);
      update({
        status: item.rendered ? "Ready for Review" : "Ready to Create",
        generationProgress: { completed: 0, total: count, state: "failed" },
        generationError: message,
        generationRequest: null,
      });
      sendJob({
        id: jobId,
        status: "failed",
        error: message,
        finishedAt: Date.now(),
      });
    } finally {
      setBusy(false);
    }
  };
  const refine = async () => {
    if (!selected)
      return setError("Generate or select a slide before refining it.");
    if (!editPrompt.trim())
      return setError("Describe what you want to change.");
    let instruction = editPrompt.trim(),
      jobId = `revision-${item.id}-${Date.now()}`;
    setBusy(true);
    setError("");
    try {
      await authenticate();
      let current = await compressForAI(selected.src),
        references = await Promise.all(
          images.slice(0, 2).map((m) => compressForAI(m.src)),
        ),
        sources = [current, ...references],
        mask = maskRegion ? await createEditMask(current, maskRegion) : null,
        payload = {
          images: sources,
          mask,
          materialNames: materials.filter((m) => m.src).map((m) => m.name),
          idea: creativeIdea,
          template: creativeIdea?.template,
          platform: item.platforms?.[0],
          brand: {
            name: "Social Content Studio",
            voice: "clean, confident, premium",
          },
          refinement: instruction,
          count: 1,
          slideCount: 1,
        },
        meta = {
          kind: "refine",
          productionId: item.id,
          total: 1,
          title: item.title,
          selectedIndex,
          prompt: instruction,
          maskRegion: maskRegion || null,
          previousSrc: selected.src,
        };
      update({
        status: "In Creation",
        generationJobId: jobId,
        generationStartedAt: Date.now(),
        generationProgress: { completed: 0, total: 1, state: "running" },
        generationError: "",
        generationRequest: { id: jobId, owner: runtimeId, payload, meta },
      });
      sendJob({
        id: jobId,
        productionId: item.id,
        title: `Refining slide ${selectedIndex + 1}: ${item.title}`,
        status: "running",
        completed: 0,
        total: 1,
        startedAt: Date.now(),
      });
      notify("Slide revision is running in the background");
      close?.();
      let body = await request({ sources, mask, refinement: instruction }),
        results = body.images,
        next = variants.map((v, i) => (i === selectedIndex ? results[0] : v)),
        history = [
          ...(item.creativeRevisions || []),
          {
            id: jobId,
            prompt: instruction,
            maskRegion: maskRegion || null,
            previousSrc: selected.src,
            resultSrc: results[0].src,
            at: new Date().toISOString(),
            from: selectedIndex,
          },
        ];
      setVariants(next);
      setEditPrompt("");
      setMaskRegion(null);
      update({
        generatedVariants: next,
        carouselImages: next,
        rendered: next[0].src,
        selectedVariant: selectedIndex,
        creativeRevisions: history,
        status: "Ready for Review",
        generationProgress: { completed: 1, total: 1, state: "ready" },
        generationFinishedAt: Date.now(),
        generationError: "",
        generationRequest: null,
      });
      sendJob({
        id: jobId,
        status: "ready",
        completed: 1,
        total: 1,
        finishedAt: Date.now(),
      });
      notify("Revised slide is ready for review");
    } catch (e) {
      let message = messageFor(e);
      setError(message);
      update({
        status: "Ready for Review",
        generationProgress: { completed: 0, total: 1, state: "failed" },
        generationError: message,
        generationRequest: null,
      });
      sendJob({
        id: jobId,
        status: "failed",
        error: message,
        finishedAt: Date.now(),
      });
    } finally {
      setBusy(false);
    }
  };
  const select = (v, i) => {
    update({ selectedVariant: i, status: "Ready for Review" });
    notify(
      `${variants.length > 1 ? "Slide" : "Result"} ${i + 1} selected for editing`,
    );
  };
  const restoreRevision = (revision) => {
    if (!revision.previousSrc) return;
    let next = variants.map((v, i) =>
      i === revision.from ? { ...v, src: revision.previousSrc } : v,
    );
    setVariants(next);
    update({
      generatedVariants: next,
      carouselImages: next,
      rendered: next[0].src,
      selectedVariant: revision.from,
      status: "Ready for Review",
    });
    notify(`Restored slide ${revision.from + 1} to its previous version`);
  };
  const download = (v, i) => {
    let a = document.createElement("a");
    a.download = `${item.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${i + 1}.jpg`;
    a.href = v.src;
    a.click();
  };
  const quick = [
    "Less text",
    "More premium",
    "Simpler layout",
    "Larger product",
    "Use only supplied materials",
    "Remove labels",
    "More whitespace",
    "Stronger product fidelity",
  ];
  const changeSlideCount = (nextCount) => {
    setSlideCount(nextCount);
    setCarouselPlan((current) => {
      let next = buildCarouselPlan(nextCount, creativeIdea, current);
      update({ carouselPlan: next, formatCount: nextCount });
      return next;
    });
  };
  const editPlan = (index, field, value) => {
    setCarouselPlan((current) => {
      let next = buildCarouselPlan(slideCount, creativeIdea, current).map(
        (slide, slideIndex) =>
          slideIndex === index
            ? { ...slide, [field]: value, customized: true }
            : slide,
      );
      update({ carouselPlan: next, formatCount: slideCount });
      return next;
    });
  };
  return (
    <div className="creationInline">
      <section className="generationBar">
        <div>
          <span className="sectionIcon">
            <I.Sparkles />
          </span>
          <div>
            <h2>Create with AI</h2>
            <p>
              Choose a single post or a coordinated carousel. The workspace
              closes as soon as the background job starts.
            </p>
          </div>
        </div>
        <div className="generationControls">
          <div className="modeSwitch">
            <button
              className={mode === "single" ? "on" : ""}
              onClick={() => setMode("single")}
            >
              Single image
            </button>
            <button
              className={mode === "carousel" ? "on" : ""}
              onClick={() => setMode("carousel")}
            >
              Carousel
            </button>
          </div>
          {mode === "carousel" && (
            <label>
              Slides
              <select
                value={slideCount}
                onChange={(e) => changeSlideCount(+e.target.value)}
              >
                {[2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            className="primary"
            onClick={generate}
            disabled={busy}
          >
            {busy ? (
              <>
                <I.LoaderCircle className="spin" />
                Starting…
              </>
            ) : (
              <>
                <I.WandSparkles />
                Generate in background
              </>
            )}
          </button>
        </div>
        {needsAuth && (
          <label className="accessField compactAccess">
            Generation passphrase
            <input
              type="password"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              placeholder="Connect this browser once"
            />
          </label>
        )}
        {error && <p className="renderError">{error}</p>}
      </section>
      {mode === "carousel" && (
        <section className="carouselStoryboard">
          <div className="storyboardHeading">
            <div>
              <span className="sectionIcon">
                <I.ListTree />
              </span>
              <div>
                <h2>Carousel story plan</h2>
                <p>
                  Edit the narrative and prompt for every slide before
                  generation. These instructions are sent directly to the AI.
                </p>
              </div>
            </div>
            <span className="storyFlow">
              {buildCarouselPlan(slideCount, creativeIdea, carouselPlan)
                .map((slide) => slide.role)
                .join(" → ")}
            </span>
          </div>
          <div className="storyboardSlides">
            {buildCarouselPlan(slideCount, creativeIdea, carouselPlan).map(
              (slide, index) => (
                <article key={index}>
                  <header>
                    <span>Slide {index + 1}</span>
                    <b>
                      {slide.role || carouselPlanRole(index, slideCount)}
                    </b>
                  </header>
                  <label>
                    Story beat
                    <textarea
                      value={slide.beat}
                      onChange={(event) =>
                        editPlan(index, "beat", event.target.value)
                      }
                      placeholder="What new part of the story does this slide communicate?"
                    />
                  </label>
                  <label>
                    Exact on-image copy
                    <input
                      value={slide.copy}
                      onChange={(event) =>
                        editPlan(index, "copy", event.target.value)
                      }
                      placeholder="Keep it short, or leave blank for no text"
                    />
                  </label>
                  <label>
                    Visual direction / image prompt
                    <textarea
                      value={slide.visual}
                      onChange={(event) =>
                        editPlan(index, "visual", event.target.value)
                      }
                      placeholder="Composition, subject, product angle and visual evidence"
                    />
                  </label>
                </article>
              ),
            )}
          </div>
        </section>
      )}
      {variants.length > 0 && (
        <section className="variantArea carouselResults">
          <div className="variantTitle">
            <div>
              <h3>
                {variants.length > 1
                  ? `${variants.length}-slide carousel`
                  : "Generated result"}
              </h3>
              <p>Click an image to inspect it. Select a slide to refine it.</p>
            </div>
            <button onClick={generate} disabled={busy}>
              <I.RefreshCw size={15} />
              Regenerate
            </button>
          </div>
          <div className="variants">
            {variants.map((v, i) => (
              <article
                key={`${v.src.slice(-20)}-${i}`}
                className={selectedIndex === i ? "chosen" : ""}
              >
                <button
                  className="reviewImageButton"
                  onClick={() => setPreview({ v, i })}
                  title="Open full-size preview"
                >
                  <img src={v.src} />
                  <span>
                    {variants.length > 1 ? `Slide ${i + 1}` : "Result"}
                  </span>
                  <em>
                    <I.Maximize2 />
                    Open
                  </em>
                </button>
                <footer>
                  <div>
                    <b>
                      {variants.length > 1
                        ? `Slide ${i + 1}`
                        : "Generated image"}
                    </b>
                    <small>
                      {v.width} × {v.height}
                    </small>
                  </div>
                  <button onClick={() => download(v, i)} title="Download">
                    <I.Download size={16} />
                  </button>
                  <button
                    className="selectVariant"
                    onClick={() => select(v, i)}
                  >
                    {selectedIndex === i ? "Editing" : "Edit slide"}
                  </button>
                </footer>
              </article>
            ))}
          </div>
          <div className="promptEditor">
            <div className="promptEditorHead">
              <span>
                <I.MessageSquareText />
                <b>
                  Refine{" "}
                  {variants.length > 1
                    ? `slide ${selectedIndex + 1}`
                    : "result"}
                </b>
              </span>
              {item.creativeRevisions?.length > 0 && (
                <small>
                  {item.creativeRevisions.length} revision
                  {item.creativeRevisions.length === 1 ? "" : "s"} saved
                </small>
              )}
            </div>
            <p>
              Describe only what should change. Optionally mark a specific area;
              the AI receives that mask with your instruction and preserves the
              rest.
            </p>
            <div className="maskControls">
              <button
                className={maskRegion ? "hasMask" : ""}
                onClick={() => setMarking(true)}
              >
                <I.Crosshair />
                {maskRegion ? "Change marked area" : "Mark area to refine"}
              </button>
              {maskRegion && (
                <>
                  <span>
                    <I.CheckCircle2 />
                    Area selected
                  </span>
                  <button
                    className="clearMask"
                    onClick={() => setMaskRegion(null)}
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
            <textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="Example: Remove the supporting text, enlarge the product, add more whitespace, and preserve the exact fabric and color."
            />
            <div className="refineChips">
              {quick.map((x) => (
                <button
                  key={x}
                  onClick={() =>
                    setEditPrompt((p) => (p ? `${p}; ${x.toLowerCase()}` : x))
                  }
                >
                  {x}
                </button>
              ))}
            </div>
            <button
              className="primary refineButton"
              onClick={refine}
              disabled={busy || !editPrompt.trim()}
            >
              <I.WandSparkles />
              Refine {maskRegion ? "marked area" : "image"} in background
            </button>
          </div>
        </section>
      )}
      {preview && (
        <div
          className="modalback imageLightboxBack"
          onClick={() => setPreview(null)}
        >
          <section
            className="imageLightbox"
            onClick={(e) => e.stopPropagation()}
          >
            <header>
              <div>
                <small>
                  {variants.length > 1
                    ? `CAROUSEL SLIDE ${preview.i + 1}`
                    : "GENERATED RESULT"}
                </small>
                <h2>{item.title}</h2>
              </div>
              <button className="icon" onClick={() => setPreview(null)}>
                <I.X />
              </button>
            </header>
            <img src={preview.v.src} />
            <footer>
              <span>
                {preview.v.width} × {preview.v.height}
              </span>
              <button
                onClick={() => {
                  setPreview(null);
                  select(preview.v, preview.i);
                  setMarking(true);
                }}
              >
                <I.Crosshair />
                Mark area to refine
              </button>
              <button onClick={() => download(preview.v, preview.i)}>
                <I.Download />
                Download
              </button>
            </footer>
          </section>
        </div>
      )}
      {marking && selected && (
        <AreaMarker
          src={selected.src}
          value={maskRegion}
          save={setMaskRegion}
          close={() => setMarking(false)}
        />
      )}
    </div>
  );
}
const publishPlatforms = [
  "Instagram Feed",
  "Instagram Story",
  "Instagram Reel",
  "Facebook Feed",
  "Facebook Story",
  "LinkedIn",
  "TikTok",
  "X",
  "YouTube Shorts",
];
const platformSpecs = {
  "Instagram Feed": {
    w: 1080,
    h: 1350,
    label: "Feed · 4:5 portrait",
    publishable: true,
  },
  "Instagram Carousel": {
    w: 1080,
    h: 1350,
    label: "Feed carousel · 4:5",
    publishable: true,
  },
  "Instagram Story": {
    w: 1080,
    h: 1920,
    label: "Story · 9:16",
    publishable: false,
  },
  "Instagram Reel": {
    w: 1080,
    h: 1920,
    label: "Reel · 9:16",
    publishable: false,
  },
  "Facebook Feed": {
    w: 1080,
    h: 1350,
    label: "Page feed · 4:5 portrait",
    publishable: true,
  },
  "Facebook Story": {
    w: 1080,
    h: 1920,
    label: "Page story · 9:16",
    publishable: false,
  },
  LinkedIn: { w: 1200, h: 1500, label: "Feed · 4:5 portrait" },
  Facebook: {
    w: 1080,
    h: 1350,
    label: "Page feed · 4:5 portrait",
    publishable: true,
  },
  TikTok: { w: 1080, h: 1920, label: "Video feed · 9:16" },
  X: { w: 1600, h: 900, label: "Feed · 16:9 landscape" },
  "YouTube Shorts": { w: 1080, h: 1920, label: "Short · 9:16" },
};
function platformSpec(name) {
  return platformSpecs[name] || platformSpecs["Instagram Feed"];
}
function platformOutput(src, spec) {
  return new Promise((resolve, reject) => {
    let image = new Image();
    image.onload = () => {
      let canvas = document.createElement("canvas"),
        ctx = canvas.getContext("2d"),
        scale = Math.min(spec.w / image.width, spec.h / image.height),
        w = image.width * scale,
        h = image.height * scale;
      canvas.width = spec.w;
      canvas.height = spec.h;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, spec.w, spec.h);
      ctx.drawImage(image, (spec.w - w) / 2, (spec.h - h) / 2, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    image.onerror = () =>
      reject(new Error("A finished image could not be formatted"));
    image.src = src;
  });
}
function defaultPlatformCopy(platform, idea) {
  let linked = platform === "LinkedIn",
    short = platform === "X",
    s = platformSpec(platform);
  return {
    caption: short
      ? `${idea?.hook || idea?.title} ${idea?.message || ""}`.slice(0, 250)
      : linked
        ? `${idea?.hook || idea?.title}\n\n${idea?.message || ""}\n\nA practical way to create more content without compromising quality.`
        : `${idea?.hook || idea?.title} ✨\n\n${idea?.message || ""}\n\nSave this for your next campaign.`,
    cta: "Learn more",
    hashtags: linked
      ? "#AI #CreativeOps #Ecommerce"
      : platform === "TikTok"
        ? "#AIContent #ProductTok #Ecommerce"
        : "#AIContent #ProductPhotography #ContentCreation",
    firstComment: "",
    link: "",
    dimensions: `${s.w} × ${s.h}`,
    date: "",
    time: "10:00",
    status: "Draft",
  };
}
function DistributionPanelV2({ item, idea, update, notify }) {
  const initial = item.destinations?.length
      ? item.destinations
      : item.platforms || ["Instagram Feed"],
    [selected, setSelected] = useState(initial),
    [versions, setVersions] = useState(() => {
      let x = { ...item.versions };
      initial.forEach((p) => (x[p] = x[p] || defaultPlatformCopy(p, idea)));
      return x;
    }),
    [active, setActive] = useState(initial[0] || "Instagram Feed");
  const [formatting, setFormatting] = useState(false),
    rawMedia = item.carouselImages?.length
      ? item.carouselImages
      : item.generatedVariants?.length
        ? item.generatedVariants
        : item.rendered
          ? [{ src: item.rendered }]
          : [];
  const toggle = (p) => {
    if (selected.includes(p)) {
      let n = selected.filter((x) => x !== p);
      setSelected(n);
      if (active === p) setActive(n[0] || "");
    } else {
      setSelected([...selected, p]);
      setVersions({
        ...versions,
        [p]: versions[p] || defaultPlatformCopy(p, idea),
      });
      setActive(p);
    }
  };
  const set = (k, v) =>
    setVersions({
      ...versions,
      [active]: {
        ...(versions[active] || defaultPlatformCopy(active, idea)),
        [k]: v,
      },
    });
  const save = async () => {
    setFormatting(true);
    try {
      let complete = { ...versions };
      for (let p of selected) {
        let spec = platformSpec(p),
          current = complete[p] || defaultPlatformCopy(p, idea),
          outputImages = rawMedia.length
            ? await Promise.all(
                rawMedia.map(async (media) => ({
                  src: await platformOutput(media.src || media, spec),
                  width: spec.w,
                  height: spec.h,
                })),
              )
            : [];
        complete[p] = {
          ...current,
          dimensions: `${spec.w} × ${spec.h}`,
          placement: p,
          outputImages,
        };
      }
      let scheduled = selected.some((p) => complete[p].date);
      update({
        destinations: selected,
        versions: complete,
        status: scheduled ? "Ready to Publish" : item.status,
      });
      setVersions(complete);
      notify(
        scheduled
          ? "Platform-sized versions saved and added to calendar"
          : "Platform-sized versions saved",
      );
    } catch (error) {
      notify(error.message);
    } finally {
      setFormatting(false);
    }
  };
  let v = active ? versions[active] || defaultPlatformCopy(active, idea) : null,
    spec = platformSpec(active),
    media = v?.outputImages?.length ? v.outputImages : rawMedia;
  return (
    <div className="distV2">
      <div className="distHead">
        <div>
          <h2>Platform distribution</h2>
          <p>
            Preview the actual crop and copy for each destination before
            scheduling.
          </p>
        </div>
        <button className="primary" onClick={save} disabled={formatting}>
          {formatting ? <I.LoaderCircle className="spin" size={16} /> : <I.Save size={16} />}
          {formatting ? "Sizing outputs…" : "Save platform outputs"}
        </button>
      </div>
      <div className="destinationChips">
        {publishPlatforms.map((p) => (
          <button
            key={p}
            className={selected.includes(p) ? "selected" : ""}
            onClick={() => toggle(p)}
          >
            {selected.includes(p) && <I.Check size={13} />} {p}
          </button>
        ))}
      </div>
      {selected.length ? (
        <div className="platformEditor">
          <aside>
            {selected.map((p) => {
              let s = platformSpec(p);
              return (
                <button
                  key={p}
                  className={active === p ? "on" : ""}
                  onClick={() => setActive(p)}
                >
                  <PlatformMark name={p} />
                  <span>
                    {p}
                    <small>
                      {s.w} × {s.h}
                      {versions[p]?.date ? ` · ${versions[p].date}` : ""}
                    </small>
                  </span>
                  <i className={versions[p]?.date ? "scheduled" : "draft"} />
                </button>
              );
            })}
          </aside>
          {v && (
            <section>
              <div className="platformTitle">
                <div>
                  <PlatformMark name={active} />
                  <div>
                    <h3>{active}</h3>
                    <p>
                      {spec.label} · {spec.w} × {spec.h}
                    </p>
                  </div>
                </div>
                <span className={`statusPill ${v.status?.toLowerCase()}`}>
                  {v.status || "Draft"}
                </span>
              </div>
              <div className="channelPreview">
                <div
                  className="previewDevice"
                  style={{ aspectRatio: `${spec.w}/${spec.h}` }}
                >
                  {media.length ? (
                    media.map((m, i) => (
                      <div
                        key={i}
                        className={i ? "previewSlide secondarySlide" : ""}
                      >
                        <img src={m.src} />
                        {media.length > 1 && (
                          <span>
                            {i + 1}/{media.length}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="previewEmpty">
                      <I.Image />
                      <span>No finished media yet</span>
                    </div>
                  )}
                </div>
                <div className="previewNotes">
                  <b>Output check</b>
                  <span>
                    <I.Maximize size={14} />
                    {spec.w} × {spec.h}
                  </span>
                  <span>
                    <I.Layers3 size={14} />
                    {media.length > 1
                      ? `${media.length} carousel slides`
                      : "Single image"}
                  </span>
                  <p>
                    Saving creates an exact {spec.w} × {spec.h} output for this
                    placement. The full creative is preserved on a clean canvas.
                  </p>
                  {!spec.publishable && <span className="exportOnly"><I.Info size={14}/>Export only — direct publishing is not available for this placement yet.</span>}
                </div>
              </div>
              <label>
                Caption
                <textarea
                  value={v.caption}
                  onChange={(e) => set("caption", e.target.value)}
                />
                <small>{v.caption.length} characters</small>
              </label>
              <div className="editGrid">
                <label>
                  CTA
                  <input
                    value={v.cta}
                    onChange={(e) => set("cta", e.target.value)}
                  />
                </label>
                <label>
                  Link
                  <input
                    value={v.link}
                    placeholder="https://"
                    onChange={(e) => set("link", e.target.value)}
                  />
                </label>
                <label className="span2">
                  Hashtags
                  <input
                    value={v.hashtags}
                    onChange={(e) => set("hashtags", e.target.value)}
                  />
                </label>
                <label>
                  Publishing date
                  <input
                    type="date"
                    value={v.date}
                    onChange={(e) => set("date", e.target.value)}
                  />
                </label>
                <label>
                  Publishing time
                  <input
                    type="time"
                    value={v.time}
                    onChange={(e) => set("time", e.target.value)}
                  />
                </label>
                <label className="span2">
                  First comment
                  <textarea
                    value={v.firstComment}
                    placeholder="Optional first comment"
                    onChange={(e) => set("firstComment", e.target.value)}
                  />
                </label>
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="empty">
          <I.Send />
          <h3>Select at least one publishing destination</h3>
        </div>
      )}
    </div>
  );
}
function PlatformMark({ name }) {
  let l = name?.toLowerCase() || "";
  return (
    <span
      className={`platformMark ${l.includes("instagram") ? "ig" : l.includes("linkedin") ? "li" : l === "x" ? "xx" : l.includes("tiktok") ? "tt" : l.includes("youtube") ? "yt" : "fb"}`}
    >
      {l.includes("instagram")
        ? "IG"
        : l.includes("linkedin")
          ? "in"
          : l === "x"
            ? "X"
            : l.includes("tiktok")
              ? "TT"
              : l.includes("youtube")
                ? "YT"
                : "f"}
    </span>
  );
}
function calendarItems(data) {
  let out = [];
  data.production.forEach((p) => {
    let idea = data.ideas.find((i) => i.id === p.ideaId),
      dest = p.destinations?.length ? p.destinations : p.platforms || [],
      sourceImages = (p.carouselImages || [])
        .map((x) => x.src || x)
        .filter(Boolean);
    dest.forEach((platform) => {
      let v = p.versions?.[platform],
        images = (v?.outputImages || []).map((x) => x.src || x).filter(Boolean);
      if (v?.date)
        out.push({
          id: `${p.id}::${platform}`,
          productionId: p.id,
          platform,
          title: p.title,
          format: p.format,
          campaign: p.campaign,
          date: v.date,
          time: v.time || "10:00",
          status: v.status || "Scheduled",
          caption: v.caption || "",
          hashtags: v.hashtags || "",
          cta: v.cta || "",
          link: v.link || "",
          image: images[0] || p.rendered,
          images: images.length ? images : sourceImages,
          dimensions:
            v.dimensions ||
            `${platformSpec(platform).w} × ${platformSpec(platform).h}`,
          idea,
        });
    });
    if (p.date && !out.some((x) => x.productionId === p.id))
      out.push({
        id: `${p.id}::${dest[0] || "Instagram Feed"}`,
        productionId: p.id,
        platform: dest[0] || "Instagram Feed",
        title: p.title,
        format: p.format,
        campaign: p.campaign,
        date: p.date,
        time: "10:00",
        status: p.status === "Published" ? "Published" : "Scheduled",
        caption: idea?.message || "",
        hashtags: "#Content",
        cta: "Learn more",
        image: p.rendered,
        images: sourceImages,
        dimensions: `${platformSpec(dest[0] || "Instagram Feed").w} × ${platformSpec(dest[0] || "Instagram Feed").h}`,
        idea,
      });
  });
  return out;
}
function dateISO(d) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}
function startMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addDays(d, n) {
  let x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function CalendarV2({ data, setData, notify }) {
  const [view, setView] = useState("Month"),
    [cursor, setCursor] = useState(new Date()),
    [platform, setPlatform] = useState("All"),
    [status, setStatus] = useState("All"),
    [selected, setSelected] = useState(null),
    [showQueue, setShowQueue] = useState(true);
  let items = calendarItems(data),
    filtered = items.filter(
      (x) =>
        (platform === "All" || x.platform === platform) &&
        (status === "All" || x.status === status),
    ),
    unscheduled = data.production.filter(
      (p) =>
        !items.some((x) => x.productionId === p.id) && p.status !== "Published",
    );
  const updateEntry = (entry, patch) =>
    setData((d) => ({
      ...d,
      production: d.production.map((p) => {
        if (p.id !== entry.productionId) return p;
        let old =
          p.versions?.[entry.platform] ||
          defaultPlatformCopy(
            entry.platform,
            d.ideas.find((i) => i.id === p.ideaId),
          );
        return {
          ...p,
          versions: { ...p.versions, [entry.platform]: { ...old, ...patch } },
          destinations: [
            ...new Set([
              ...(p.destinations || p.platforms || []),
              entry.platform,
            ]),
          ],
          status: patch.status === "Published" ? "Published" : p.status,
        };
      }),
    }));
  const move = (id, date) => {
    let entry = items.find((x) => x.id === id);
    if (entry) {
      updateEntry(entry, {
        date,
        status: entry.status === "Draft" ? "Scheduled" : entry.status,
      });
      notify(`Moved to ${new Date(date + "T12:00").toLocaleDateString()}`);
    } else if (id.startsWith("unscheduled:")) {
      let pid = id.split(":")[1],
        p = data.production.find((x) => x.id === pid),
        plat = p.platforms?.[0] || "Instagram Feed",
        idea = data.ideas.find((x) => x.id === p.ideaId),
        v = { ...defaultPlatformCopy(plat, idea), date, status: "Scheduled" };
      setData((d) => ({
        ...d,
        production: d.production.map((x) =>
          x.id === pid
            ? {
                ...x,
                destinations: [plat],
                versions: { ...x.versions, [plat]: v },
                status: "Ready to Publish",
              }
            : x,
        ),
      }));
      notify("Content scheduled");
    }
  };
  const removeFromCalendar = (entry) => {
    if (!confirm(`Remove “${entry.title}” from the calendar? The content and finished media will remain in Production.`)) return;
    setData((d) => ({
      ...d,
      production: d.production.map((p) => {
        if (p.id !== entry.productionId) return p;
        let old = p.versions?.[entry.platform] || defaultPlatformCopy(entry.platform, d.ideas.find((i) => i.id === p.ideaId)),
          versions = { ...p.versions, [entry.platform]: { ...old, date: "", status: "Draft" } },
          stillScheduled = Object.values(versions).some((v) => v?.date);
        return { ...p, date: "", versions, status: stillScheduled ? p.status : p.rendered ? "Ready to Publish" : "Ready for Review" };
      }),
    }));
    setSelected(null);
    notify("Removed from calendar — content remains in Production");
  };
  const deleteUnscheduled = (item) => {
    if (!confirm(`Delete “${item.title}” from Production? The approved idea and Asset Library files will be preserved.`)) return;
    setData((current) => ({
      ...current,
      production: current.production.filter((productionItem) => productionItem.id !== item.id),
    }));
    notify("Unscheduled content deleted — idea and assets preserved");
  };
  return (
    <div className="calendarV2">
      <div className="calendarToolbar">
        <div className="viewSwitch">
          {["Month", "Week", "List"].map((x) => (
            <button
              className={view === x ? "on" : ""}
              onClick={() => setView(x)}
            >
              {x}
            </button>
          ))}
        </div>
        <div className="dateNav">
          <button
            onClick={() =>
              setCursor(
                view === "Month"
                  ? new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1)
                  : addDays(cursor, -7),
              )
            }
          >
            <I.ChevronLeft />
          </button>
          <h2>
            {view === "Month"
              ? cursor.toLocaleDateString("en", {
                  month: "long",
                  year: "numeric",
                })
              : `Week of ${cursor.toLocaleDateString("en", { month: "short", day: "numeric" })}`}
          </h2>
          <button
            onClick={() =>
              setCursor(
                view === "Month"
                  ? new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
                  : addDays(cursor, 7),
              )
            }
          >
            <I.ChevronRight />
          </button>
          <button className="today" onClick={() => setCursor(new Date())}>
            Today
          </button>
        </div>
        <div className="calFilters">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            <option>All</option>
            {publishPlatforms.map((x) => (
              <option>{x}</option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>All</option>
            <option>Scheduled</option>
            <option>Ready</option>
            <option>Published</option>
          </select>
          <button
            className={showQueue ? "active" : ""}
            onClick={() => setShowQueue(!showQueue)}
          >
            <I.PanelRight size={16} />
            Unscheduled <span>{unscheduled.length}</span>
          </button>
        </div>
      </div>
      <div className={`calendarBody ${showQueue ? "withQueue" : ""}`}>
        <div>
          {view === "Month" ? (
            <MonthView
              cursor={cursor}
              items={filtered}
              move={move}
              open={setSelected}
            />
          ) : view === "Week" ? (
            <WeekView
              cursor={cursor}
              items={filtered}
              move={move}
              open={setSelected}
            />
          ) : (
            <ListView items={filtered} open={setSelected} />
          )}
        </div>
        {showQueue && (
          <aside className="unscheduled">
            <div>
              <h3>Unscheduled content</h3>
              <p>Drag content onto a calendar date.</p>
            </div>
            {unscheduled.map((p) => (
              <article
                draggable
                onDragStart={(e) =>
                  e.dataTransfer.setData("calendar-id", `unscheduled:${p.id}`)
                }
              >
                <div>{p.rendered ? <img src={p.rendered} /> : <I.Image />}</div>
                <b>{p.title}</b>
                <small>
                  {p.format} · {p.platforms?.join(", ")}
                </small>
                <span>{p.status}</span>
                <button
                  className="deleteUnscheduled"
                  title="Delete unscheduled content"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteUnscheduled(p);
                  }}
                >
                  <I.Trash2 size={13} />
                  Delete
                </button>
              </article>
            ))}
            {!unscheduled.length && (
              <div className="queueEmpty">
                <I.CheckCircle2 />
                <p>Everything is scheduled</p>
              </div>
            )}
          </aside>
        )}
      </div>
      {selected && (
        <PublishDetail
          entry={selected}
          close={() => setSelected(null)}
          update={(p) => {
            updateEntry(selected, p);
            setSelected({ ...selected, ...p });
          }}
          remove={() => removeFromCalendar(selected)}
          notify={notify}
        />
      )}
    </div>
  );
}
function MonthView({ cursor, items, move, open }) {
  let first = startMonth(cursor),
    offset = (first.getDay() + 6) % 7,
    start = addDays(first, -offset),
    days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  return (
    <div className="monthV2">
      <div className="weekday">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((x) => (
          <b>{x}</b>
        ))}
      </div>
      <div className="monthGrid">
        {days.map((d) => {
          let iso = dateISO(d),
            dayItems = items.filter((x) => x.date === iso);
          return (
            <div
              className={d.getMonth() === cursor.getMonth() ? "" : "outside"}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => move(e.dataTransfer.getData("calendar-id"), iso)}
            >
              <span className={iso === dateISO(new Date()) ? "todayNum" : ""}>
                {d.getDate()}
              </span>
              {dayItems.slice(0, 3).map((x) => (
                <CalendarEvent item={x} open={open} />
              ))}
              {dayItems.length > 3 && (
                <small className="more">+{dayItems.length - 3} more</small>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
function WeekView({ cursor, items, move, open }) {
  let start = addDays(cursor, -((cursor.getDay() + 6) % 7)),
    days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return (
    <div className="weekV2">
      {days.map((d) => {
        let iso = dateISO(d);
        return (
          <section
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => move(e.dataTransfer.getData("calendar-id"), iso)}
          >
            <header>
              <b>{d.toLocaleDateString("en", { weekday: "short" })}</b>
              <span>{d.getDate()}</span>
            </header>
            {items
              .filter((x) => x.date === iso)
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((x) => (
                <CalendarEvent item={x} open={open} />
              ))}
          </section>
        );
      })}
    </div>
  );
}
function ListView({ items, open }) {
  let sorted = [...items].sort((a, b) =>
    (a.date + a.time).localeCompare(b.date + b.time),
  );
  return (
    <div className="listV2">
      {sorted.map((x, i) => (
        <article onClick={() => open(x)}>
          <span className="listDate">
            <b>
              {new Date(x.date + "T12:00").toLocaleDateString("en", {
                month: "short",
              })}
            </b>
            <strong>{new Date(x.date + "T12:00").getDate()}</strong>
          </span>
          <PlatformMark name={x.platform} />
          <div>
            <b>{x.title}</b>
            <small>
              {x.platform} · {x.format}
            </small>
          </div>
          <time>{x.time}</time>
          <span className={`statusPill ${x.status.toLowerCase()}`}>
            {x.status}
          </span>
          <I.ChevronRight />
        </article>
      ))}
      {!sorted.length && (
        <div className="empty">
          <I.CalendarX />
          <h3>No scheduled content matches these filters</h3>
        </div>
      )}
    </div>
  );
}
function CalendarEvent({ item, open }) {
  return (
    <button
      className={`calEvent ${item.status.toLowerCase()}`}
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        e.dataTransfer.setData("calendar-id", item.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        open(item);
      }}
    >
      <PlatformMark name={item.platform} />
      <span>
        <b>
          {item.time} · {item.title}
        </b>
        <small>{item.platform}</small>
      </span>
    </button>
  );
}
function PublishDetail({ entry, close, update, remove, notify }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    isInstagram =
      entry.platform === "Instagram Feed" ||
      entry.platform === "Instagram" ||
      entry.platform === "Instagram Carousel",
    isFacebook = entry.platform === "Facebook Feed" || entry.platform === "Facebook",
    directPublish = isInstagram || isFacebook,
    media = entry.images?.length
      ? entry.images
      : entry.image
        ? [entry.image]
        : [],
    dimensions = entry.dimensions || `${platformSpec(entry.platform).w} × ${platformSpec(entry.platform).h}`,
    placementNote = isInstagram
      ? `This is an Instagram Feed placement (${dimensions}). Publishing creates a real ${media.length > 1 ? "carousel" : "feed post"}.`
      : isFacebook
        ? `This is a Facebook Page Feed placement (${dimensions}). Publishing creates a real Page post.`
        : `${entry.platform} is an export-only placement (${dimensions}); direct publishing is not enabled.`;
  const copy = async () => {
    await navigator.clipboard.writeText(
      `${entry.caption}\n\n${entry.hashtags}`,
    );
    notify("Caption copied");
  };
  const download = () => {
    if (!media.length) return notify("No finished media is attached");
    media.forEach((src, i) => {
      let a = document.createElement("a");
      a.href = src;
      a.download = `${entry.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}${media.length > 1 ? `-slide-${i + 1}` : ""}.jpg`;
      a.click();
    });
  };
  const mark = () => {
    update({ status: "Published", publishedAt: new Date().toISOString() });
    notify("Marked as published");
  };
  const publishNow = async () => {
    if (!media.length)
      return setError("Attach finished media before publishing.");
    let description = media.length > 1 ? `a ${media.length}-image post` : "a feed image",
      channel = isFacebook ? "Facebook Page" : "Instagram";
    if (
      !confirm(
        `Publish “${entry.title}” to the connected ${channel} now as ${description}? This creates a real post.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      let response = await fetch(isFacebook ? "/api/facebook/publish" : "/api/instagram/publish", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: media[0],
            images: media,
            title: entry.title,
            caption: `${entry.caption || ""}\n\n${entry.hashtags || ""}`.trim(),
          }),
        }),
        body = await response.json();
      if (!response.ok) throw new Error(body.error || `${channel} publishing failed`);
      update({
        status: "Published",
        publishedAt: body.timestamp,
        instagramMediaId: body.mediaId,
        facebookPostId: body.postId,
        permalink: body.permalink,
        publicImageUrl: body.imageUrl,
        publicImageUrls: body.imageUrls,
      });
      notify(`Published successfully to ${isFacebook ? body.pageName || "Facebook" : "@snapio.ai"}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="modalback publishBack">
      <div className="publishDetail">
        <div className="publishHead">
          <div>
            <PlatformMark name={entry.platform} />
            <div>
              <small>PUBLISHING DETAILS</small>
              <h2>{entry.title}</h2>
              <p>
                {entry.platform} · {entry.date} at {entry.time}
              </p>
            </div>
          </div>
          <button className="icon" onClick={close}>
            <I.X />
          </button>
        </div>
        <div className="publishContent">
          <div className="publishVisual">
            {media.length ? (
              <div
                className={`publishMediaGrid ${media.length === 1 ? "single" : ""}`}
              >
                {media.map((src, i) => (
                  <figure key={i}>
                    <img src={src} />
                    {media.length > 1 && <span>{i + 1}</span>}
                  </figure>
                ))}
              </div>
            ) : (
              <div>
                <I.Image />
                <p>No rendered asset yet</p>
              </div>
            )}
            <button onClick={download}>
              <I.Download size={16} />
              Download {media.length > 1 ? "carousel" : "image"}
            </button>
          </div>
          <section>
            <div className="publishStatus">
              <span className={`statusPill ${entry.status.toLowerCase()}`}>
                {entry.status}
              </span>
              {media.length > 1 && <small>{media.length}-slide carousel</small>}
              {entry.status === "Published" && (
                <small>
                  {entry.facebookPostId
                    ? "Published to Facebook"
                    : entry.instagramMediaId
                      ? "Published to Instagram"
                    : "Published manually"}
                </small>
              )}
            </div>
            <label>
              Caption
              <textarea
                value={entry.caption}
                onChange={(e) => update({ caption: e.target.value })}
              />
            </label>
            <label>
              Hashtags
              <input
                value={entry.hashtags}
                onChange={(e) => update({ hashtags: e.target.value })}
              />
            </label>
            <div className="publishMeta">
              <label>
                Date
                <input
                  type="date"
                  value={entry.date}
                  onChange={(e) => update({ date: e.target.value })}
                />
              </label>
              <label>
                Time
                <input
                  type="time"
                  value={entry.time}
                  onChange={(e) => update({ time: e.target.value })}
                />
              </label>
            </div>
            {error && <p className="renderError">{error}</p>}
            <div className="publishActions">
              <button onClick={copy}>
                <I.Copy size={15} />
                Copy post text
              </button>
              {entry.permalink && (
                <a href={entry.permalink} target="_blank" rel="noreferrer">
                  View published post
                </a>
              )}
              {entry.status !== "Published" &&
                (directPublish ? (
                  <button
                    className="primary"
                    onClick={publishNow}
                    disabled={busy}
                  >
                    {busy ? (
                      <>
                        <I.LoaderCircle className="spin" />
                        Publishing…
                      </>
                    ) : (
                      <>
                        <I.Send size={16} />
                        Publish to {isFacebook ? "Facebook" : "Instagram"}
                      </>
                    )}
                  </button>
                ) : (
                  <button className="primary" onClick={mark}>
                    <I.CheckCircle2 size={16} />
                    Mark as published
                  </button>
                ))}
              <button className="removeCalendar" onClick={remove}><I.Trash2 size={15}/>Remove from calendar</button>
            </div>
            <p className="integrationNote">
              <I.Info size={14} />
              {placementNote}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
function JobCenter({ jobs, openProduction, dismiss }) {
  if (!jobs.length) return null;
  let job = jobs[0],
    running = jobs.filter((x) => x.status === "running").length,
    review = () => {
      openProduction();
      setTimeout(
        () =>
          window.dispatchEvent(
            new CustomEvent("scs-open-production", {
              detail: { id: job.productionId },
            }),
          ),
        80,
      );
    };
  return (
    <div className={`jobCenter jobBar ${job.status}`}>
      <span className="jobState">
        {job.status === "running" ? (
          <I.LoaderCircle className="spin" />
        ) : job.status === "ready" ? (
          <I.CheckCircle2 />
        ) : (
          <I.CircleAlert />
        )}
      </span>
      <div className="jobBarCopy">
        <b>
          {job.status === "running"
            ? "Creating in background"
            : job.status === "ready"
              ? "Content ready for review"
              : "Creative job needs attention"}
        </b>
        <small>
          {job.warning || job.error || job.title}
          {running > 1 ? ` · ${running} jobs running` : ""}
        </small>
      </div>
      {job.status === "running" && (
        <span className="jobProgress">
          <i />
        </span>
      )}
      {job.status === "ready" && <button onClick={review}>Review</button>}
      {job.status !== "running" && (
        <button className="jobDismiss" onClick={() => dismiss(job.id)}>
          <I.X />
        </button>
      )}
    </div>
  );
}
DistributionPanel = DistributionPanelV2;
Calendar = CalendarV2;
ImageComposer = ImageComposerBackend;
Production = ProductionV2;
Assets = AssetsV2;
export default App;
