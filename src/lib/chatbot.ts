import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";

export type ChatProduct = {
  slug: string;
  name: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  blurb: string;
};

export type ChatReply = {
  reply: string;
  products: ChatProduct[];
  suggestions: string[];
  source: "assistant" | "catalog-engine";
};

const SUGGESTIONS = [
  "What are your best sellers?",
  "Show me something under $100",
  "What is your shipping policy?",
  "Do you have any discounts?",
  "Track my order",
];

const STOP_WORDS = new Set([
  "a", "an", "the", "i", "we", "us", "me", "my", "our", "your", "you", "your",
  "is", "are", "was", "were", "am", "be", "do", "does", "did", "will", "would",
  "can", "could", "should", "shall", "may", "might", "have", "has", "had",
  "want", "need", "need", "looking", "look", "find", "help", "show", "get",
  "some", "any", "please", "thank", "thanks", "hello", "hi", "hey", "there",
  "that", "this", "these", "those", "with", "for", "from", "and", "but", "not",
  "if", "so", "very", "really", "just", "also", "more", "most", "less",
  "than", "then", "how", "what", "which", "where", "when", "who", "why",
  "about", "into", "over", "under", "above", "below", "between", "up", "down",
  "out", "off", "on", "in", "at", "to", "of", "by", "as", "it", "its",
  "best", "good", "great", "nice", "cool", "top", "popular", "favorite",
  "favourite", "cheap", "cheapest", "affordable", "budget", "value", "recommend",
  "suggest", "suggestion", "buy", "bought", "purchase", "purchased", "need",
  "like", "love", "want", "want", "price", "prices", "cost", "costs", "much",
  "product", "products", "item", "items", "thing", "things", "stuff", "options",
  "option", "one", "two", "some", "any", "all", "every", "each", "kind",
]);

function keywords(message: string) {
  return message
    .toLowerCase()
    .replace(/[^a-z0-9\s.$]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

/** Whole-word match so "what" does not match "foldable". */
function mentions(haystack: string, word: string) {
  const pattern = new RegExp(`\\b${word}(s|es)?\\b`, "i");
  return pattern.test(haystack);
}

function priceLimit(message: string) {
  const match = message.match(/(\$|usd\s*)?(\d{2,5})(\.\d{2})?/i);
  if (!match) return null;
  const value = Number(match[2]);
  if (!Number.isFinite(value) || value <= 0) return null;
  const hasCurrency = Boolean(match[1]);
  const looksLikeBudget =
    /under|below|less|cheaper|budget|max|up to|no more than/i.test(message);
  if (!hasCurrency && !looksLikeBudget) return null;
  return Math.round(value * 100);
}

async function searchProducts(message: string, limit = 4): Promise<ChatProduct[]> {
  const words = keywords(message);

  const products = await prisma.product.findMany({
    include: { category: { select: { name: true } } },
    orderBy: { featured: "desc" },
  });

  const budget = priceLimit(message);
  const browseIntent =
    budget !== null ||
    /best|top|popular|favourite|favorite|recommend|cheap|budget|affordable|something|anything|rat(ed|ing)|review/.test(
      message,
    );

  const scored = products
    .map((product) => {
      const haystack = `${product.name} ${product.brand ?? ""} ${product.category.name} ${product.description}`.toLowerCase();
      let keywordScore = 0;
      for (const word of words) {
        if (mentions(haystack, word)) keywordScore += word.length;
      }
      return { product, keywordScore };
    });

  // If the shopper named something we actually sell, only show those matches.
  const namedMatches = scored.filter((entry) => entry.keywordScore > 0);
  const pool = namedMatches.length > 0 ? namedMatches : browseIntent ? scored : [];

  const ranked = pool
    .map(({ product, keywordScore }) => {
      let score = keywordScore;

      if (budget !== null) {
        if (product.price <= budget) score += 25;
        else score -= 60;
      }
      if (/best|top|popular|favourite|favorite|recommend/.test(message) && product.featured) {
        score += 15;
      }
      if (/cheap|budget|affordable|value/.test(message)) {
        score += Math.max(0, 300 - product.price / 100) * 0.4;
      }
      if (/rat(ed|ing)|review/.test(message)) score += product.rating * 3;

      return { product, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Nothing matched the budget - show the closest named products instead.
  const results =
    ranked.length > 0
      ? ranked
      : namedMatches
          .slice()
          .sort((a, b) => a.product.price - b.product.price)
          .slice(0, limit)
          .map((entry) => ({ product: entry.product, score: 0 }));

  return results.map(({ product }) => ({
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: product.image,
    category: product.category.name,
    rating: product.rating,
    blurb: product.description.split(". ")[0] ?? product.description,
  }));
}

async function openAiReply(
  message: string,
  history: { role: "user" | "assistant"; content: string }[],
): Promise<ChatReply | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const catalog = await prisma.product.findMany({
    include: { category: { select: { name: true } } },
    orderBy: { featured: "desc" },
    take: 60,
  });

  const catalogText = catalog
    .map(
      (product) =>
        `- ${product.name} (${product.category.name}) by ${product.brand ?? "ShopFront"} — ${formatMoney(
          product.price,
        )}${product.stock > 0 ? "" : " (out of stock)"} — ${product.description}`,
    )
    .join("\n");

  const system = `You are the ShopFront shopping assistant for an online store.
Answer shopper questions briefly and helpfully (2-4 sentences). Use only the catalog below for product facts and never invent products, prices or policies.
Shipping: free over $150, otherwise $9.90 flat, 2-5 business days.
Returns: 30 days, unopened items, free return label within the US.
Support: support@shopfront.dev, replies within one business day.
Coupons: WELCOME10 (10% off over $50), SAVE20 (20% off over $200), TECHDEAL (15% off tech over $100), FLAT25 ($25 off over $150).

Catalog:
${catalogText}`;

  try {
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
          temperature: 0.4,
          max_tokens: 320,
          messages: [
            { role: "system", content: system },
            ...history.slice(-6).map((entry) => ({
              role: entry.role,
              content: entry.content,
            })),
            { role: "user", content: message },
          ],
        }),
      },
    );

    if (!response.ok) return null;
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    const mentioned = await searchProducts(content, 3);
    return {
      reply: content,
      products: mentioned,
      suggestions: SUGGESTIONS.slice(0, 3),
      source: "assistant",
    };
  } catch {
    return null;
  }
}

export async function answerQuestion(
  message: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
): Promise<ChatReply> {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  // 1. Small talk and policy questions handled locally (fast + free).
  if (/^(hi|hey|hello|yo|good (morning|afternoon|evening))\b/.test(lower)) {
    return {
      reply:
        "Hi! I'm the ShopFront assistant. I can help you find products, explain shipping and returns, or track an order. What are you after?",
      products: [],
      suggestions: SUGGESTIONS.slice(0, 3),
      source: "catalog-engine",
    };
  }

  if (/(thanks|thank you|cheers)/.test(lower) && trimmed.length < 30) {
    return {
      reply: "Any time! Let me know if you need anything else.",
      products: [],
      suggestions: ["Show me something under $100", "What are your best sellers?"],
      source: "catalog-engine",
    };
  }

  // 2. Policy questions (shipping, returns, payment, promos, tracking).
  if (/(track my order|order status|where is my order|my orders|order number|track order)/.test(lower)) {
    return {
      reply:
        "Open the Orders section of your account (or the confirmation email) to see live status — paid, processing, shipped or delivered. If you have the order number to hand, I can look it up too.",
      products: [],
      suggestions: ["What is your shipping policy?", "Show me something under $100"],
      source: "catalog-engine",
    };
  }

  if (/(shipping|delivery|how long|when will|arriv|postage|free over)/.test(lower)) {
    return {
      reply:
        "Standard shipping is $9.90 and arrives in 2-5 business days — it is free on orders over $150. Express options are available at checkout.",
      products: [],
      suggestions: ["What is your returns policy?", "Do you have any discounts?"],
      source: "catalog-engine",
    };
  }

  if (/(return|refund|exchange|money back)/.test(lower)) {
    return {
      reply:
        "You can return any unopened item within 30 days for a full refund. We email a prepaid label, and refunds land 3-5 days after the parcel is scanned.",
      products: [],
      suggestions: ["What is your shipping policy?", "How do I track my order?"],
      source: "catalog-engine",
    };
  }

  if (/(payment|pay in|credit card|apple pay|paypal|checkout secure|paypal)/.test(lower)) {
    return {
      reply:
        "We accept all major credit and debit cards, Apple Pay and PayPal. Payments are encrypted end-to-end and you will only be charged once your order is confirmed.",
      products: [],
      suggestions: ["Do you have any discounts?", "Track my order"],
      source: "catalog-engine",
    };
  }

  if (/(coupon|discount|promo|voucher|code|sale items|offer|deal)/.test(lower)) {
    const coupons = await prisma.coupon.findMany({
      where: { active: true },
      orderBy: { value: "desc" },
    });
    const list = coupons
      .map(
        (coupon) =>
          `• ${coupon.code} — ${
            coupon.type === "PERCENT"
              ? `${coupon.value}% off`
              : `${formatMoney(coupon.value)} off`
          }${coupon.minSubtotal ? ` (min ${formatMoney(coupon.minSubtotal)})` : ""}`,
      )
      .join("\n");
    return {
      reply: `These codes are live right now:\n${list}\n\nApply them in the cart with the promo code box.`,
      products: [],
      suggestions: ["Show me your best sellers", "What is your shipping policy?"],
      source: "catalog-engine",
    };
  }

  if (/(contact|email us|phone number|human|agent|talk to|speak to|call us|reach us)/.test(lower)) {
    return {
      reply:
        "Our team replies within one business day at support@shopfront.dev. For urgent order issues call +1 (555) 014-2200.",
      products: [],
      suggestions: ["Track my order", "What is your returns policy?"],
      source: "catalog-engine",
    };
  }

  // 3. Product discovery.
  const products = await searchProducts(trimmed);
  if (products.length > 0) {
    const reply = `Here's what I found for "${trimmed}". ${products
      .slice(0, 3)
      .map((product) => `${product.name} (${formatMoney(product.price)})`)
      .join(", ")}.`;
    return {
      reply,
      products,
      suggestions: ["Add the top pick to my cart", "Show me something under $100"],
      source: "catalog-engine",
    };
  }

  // 3. Fall back to the hosted model when a key is configured.
  const ai = await openAiReply(trimmed, history);
  if (ai) return ai;

  return {
    reply:
      "I couldn't find a match for that. Try naming a category (audio, computing, gaming…), a budget, or ask me about shipping, returns or coupons.",
    products: [],
    suggestions: SUGGESTIONS,
    source: "catalog-engine",
  };
}
