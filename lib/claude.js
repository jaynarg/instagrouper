import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-haiku-4-5-20251001"; // cheap + fast; swap to claude-sonnet-4-6 for tougher calls

const SUGGESTED = [
  "Comedy", "Food & Recipes", "Art & Illustration", "Fitness & Wellness",
  "Travel", "Relationships & Life", "Work & Career", "News & Commentary",
].join(", ");

const SYSTEM = `You categorize saved Instagram posts so they can be searched and filtered later.

You will receive a post's caption (or the user's own note about it), hashtags, and the account that posted it. Return ONLY a JSON object (no markdown, no prose, no backticks) with these fields:

{
  "category": "one top-level bucket",
  "content_type": "the format, e.g. Cartoon / Standup clip / Meme / Recipe / Restaurant recommendation / Sketch",
  "tags": ["3-7 lowercase searchable descriptors"],
  "summary": "one short human-readable sentence describing the post"
}

Guidance:
- Prefer one of these categories when it fits: ${SUGGESTED}. Invent a new one only if none fit.
- The "tags" array is the searchable workhorse. Be specific and useful.
- FOOD/RECIPE RULE: if the post is about food, ALWAYS include the cuisine (e.g. "indian", "mexican") and, when identifiable, the cooking method (e.g. "instant pot", "air fryer", "grilled") as tags.
- COMEDY RULE: include the comedy style as a tag when clear (e.g. "observational", "absurdist", "crowd work", "political satire").
- If there's little text, infer from the account name and hashtags.
- summary must be plain and literal — describe what the post IS, not a clever riff.`;

export async function tagPost({ caption = "", hashtags = [], owner_name = "", owner_username = "" }) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userContent =
    `Account: ${owner_name} (@${owner_username})\n` +
    `Hashtags: ${hashtags.length ? hashtags.join(", ") : "(none)"}\n` +
    `Caption / note: ${caption ? caption : "(none — infer from account + hashtags)"}`;

  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 400,
    system: SYSTEM,
    messages: [{ role: "user", content: userContent }],
  });

  let raw = (msg.content?.[0]?.text || "").trim();
  if (raw.startsWith("```")) raw = raw.replace(/^```(?:json)?/, "").replace(/```$/, "").trim();

  const parsed = JSON.parse(raw);
  return {
    category: parsed.category || "Untagged",
    content_type: parsed.content_type || "",
    tags: Array.isArray(parsed.tags) ? parsed.tags.map((t) => String(t).toLowerCase()) : [],
    summary: parsed.summary || "",
  };
}
