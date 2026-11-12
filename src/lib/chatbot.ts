import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";
import type { Currency } from "@/lib/currency";

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
type ChatOptions = {
  locale?: "en" | "bn";
  currency?: Currency;
  rate?: number;
};

const COPY = {
  en: {
    greeting:
      "Hi! I'm the BuyZen assistant. I can help you find products, explain shipping and returns, or track an order. What are you after?",
    thanks: "Any time! Let me know if you need anything else.",
    shipping:
      "Standard shipping is $9.90 and arrives in 2-5 business days — it is free on orders over $150. Express options are available at checkout.",
    returns:
      "You can return any unopened item within 30 days for a full refund. We email a prepaid label, and refunds land 3-5 days after the parcel is scanned.",
    payment:
      "We accept all major credit and debit cards, Apple Pay and PayPal. Payments are encrypted end-to-end and you will only be charged once your order is confirmed.",
    couponsIntro: "These codes are live right now:",
    couponsOutro:
      "\n\nApply them in the cart with the promo code box.",
    tracking:
      "Open the Orders section of your account (or the confirmation email) to see live status — paid, processing, shipped or delivered. If you have the order number to hand, I can look it up too.",
    contact:
      "Our team replies within one business day at support@buyzen.com. For urgent order issues call +1 (555) 014-2200.",
    found: (query: string, names: string) =>
      `Here's what I found for "${query}". ${names}.`,
    fallback:
      "I couldn't find a match for that. Try naming a category (audio, computing, gaming…), a budget, or ask me about shipping, returns or coupons.",
    suggestions: [
      "What are your best sellers?",
      "Show me something under $100",
      "What is your shipping policy?",
      "Do you have any discounts?",
      "Track my order",
    ],
    suggestionBest: "Show me your best sellers",
    suggestionBudget: "Show me something under $100",
    suggestionShipping: "What is your shipping policy?",
    suggestionReturns: "What is your returns policy?",
    suggestionDiscounts: "Do you have any discounts?",
    suggestionTrack: "Track my order",
  },
  bn: {
    greeting:
      "হ্যালো! আমি বুয়াজেন সহায়ক। পণ্য খুঁজে দিতে, ডেলিভারি ও রিটার্ন বোঝাতে বা অর্ডার ট্র্যাক করতে সাহায্য করতে পারি। কী খুঁজছেন?",
    thanks: "সবসময়! আরও কিছু লাগলে জানাবেন।",
    shipping:
      "স্ট্যান্ডার্ড ডেলিভারি $9.90 এবং ২-৫ কার্যদিবসে পৌঁছে যায় — ৳১৫০ (বা $150) এর বেশি অর্ডারে ডেলিভারি ফ্রি। চেকআউটে এক্সপ্রেস অপশনও আছে।",
    returns:
      "অব্যবহৃত পণ্য ৩০ দিনের মধ্যে ফেরত দিয়ে সম্পূর্ণ টাকা ফেরত পাওয়া যায়। আমরা প্রি-পেইড লেবেল পাঠাই এবং পার্সেল স্ক্যান হওয়ার ৩-৫ দিনের মধ্যে টাকা ফেরত দেওয়া হয়।",
    payment:
      "আমরা সব প্রধান ক্রেডিট ও ডেবিট কার্ড, অ্যাপল পে এবং পেপাল গ্রহণ করি। পেমেন্ট সম্পূর্ণ এনক্রিপ্টেড এবং অর্ডার নিশ্চিত হওয়ার পরেই চার্জ করা হয়।",
    couponsIntro: "এই কোডগুলো এখন চালু আছে:",
    couponsOutro: "\n\nকার্টের প্রোমো কোড বক্সে বসিয়ে প্রয়োগ করুন।",
    tracking:
      "আপনার অ্যাকাউন্টের Orders অংশে (অথবা কনফার্মেশন ইমেইলে) লাইভ স্ট্যাটাস দেখুন — পেমেন্ট হয়েছে, প্রস্তুত হচ্ছে, পাঠানো হয়েছে বা ডেলিভার হয়েছে। অর্ডার নম্বর থাকলে আমি খুঁজে দেখতে পারি।",
    contact:
      "আমাদের টিম এক কার্যদিবসের মধ্যে উত্তর দেয় — support@buyzen.com। জরুরি অর্ডার সমস্যার জন্য +1 (555) 014-2200 নম্বরে কল করুন।",
    found: (query: string, names: string) =>
      `“${query}” এর জন্য যা পেয়েছি: ${names}।`,
    fallback:
      "ঠিক কিছু মেলেনি। ক্যাটাগরির নাম (অডিও, কম্পিউটিং, গেমিং…), বাজেট, অথবা ডেলিভারি/রিটার্ন/কুপন সম্পর্কে জিজ্ঞাসা করুন।",
    suggestions: [
      "আপনার বেস্ট সেলারগুলো কী?",
      "৳১,০০০ এর মধ্যে কিছু দেখান",
      "ডেলিভারি পলিসি কী?",
      "কোনো ছাড় আছে?",
      "আমার অর্ডার ট্র্যাক করুন",
    ],
    suggestionBest: "বেস্ট সেলার দেখান",
    suggestionBudget: "৳১,০০০ এর মধ্যে কিছু দেখান",
    suggestionShipping: "ডেলিভারি পলিসি কী?",
    suggestionReturns: "রিটার্ন পলিসি কী?",
    suggestionDiscounts: "কোনো ছাড় আছে?",
    suggestionTrack: "আমার অর্ডার ট্র্যাক করুন",
  },
} as const;

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
  const match = message.match(/(\$|usd\s*|৳\s*)?(\d{2,5})(\.\d{2})?/i);
  if (!match) return null;
  const value = Number(match[2]);
  if (!Number.isFinite(value) || value <= 0) return null;
  const hasCurrency = Boolean(match[1]);
  const looksLikeBudget =
    /under|below|less|cheaper|budget|max|up to|no more than|কম|নিচে|বেশি/i.test(
      message,
    );
  if (!hasCurrency && !looksLikeBudget) return null;
  return Math.round(value * 100);
}

async function searchProducts(
  message: string,
  limit = 4,
): Promise<ChatProduct[]> {
  const words = keywords(message);

  const products = await prisma.product.findMany({
    include: { category: { select: { name: true } } },
    orderBy: { featured: "desc" },
  });

  const budget = priceLimit(message);
  const browseIntent =
    budget !== null ||
    /best|top|popular|favourite|favorite|recommend|cheap|budget|affordable|something|anything|rat(ed|ing)|review|সেরা|ছাড়|দেখান/i.test(
      message,
    );

  const scored = products.map((product) => {
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
      if (
        /best|top|popular|favourite|favorite|recommend|সেরা/i.test(message) &&
        product.featured
      ) {
        score += 15;
      }
      if (/cheap|budget|affordable|value|সস্তা|কম|বাজেট/i.test(message)) {
        score += Math.max(0, 300 - product.price / 100) * 0.4;
      }
      if (/rat(ed|ing)|review/i.test(message)) score += product.rating * 3;

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
  options: ChatOptions,
): Promise<ChatReply | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const locale = options.locale === "bn" ? "bn" : "en";
  const currency = options.currency ?? "USD";
  const rate = options.rate ?? 120;

  const catalog = await prisma.product.findMany({
    include: { category: { select: { name: true } } },
    orderBy: { featured: "desc" },
    take: 60,
  });

  const catalogText = catalog
    .map(
      (product) =>
        `- ${product.name} (${product.category.name}) by ${product.brand ?? "BuyZen"} — ${formatMoney(
          product.price,
          currency,
          rate,
        )}${product.stock > 0 ? "" : " (out of stock)"} — ${product.description}`,
    )
    .join("\n");

  const system = `You are the BuyZen shopping assistant for an online store.
${
  locale === "bn"
    ? "Always answer in natural Bangla (Bangladesh) using the ৳ (Taka) symbol for prices."
    : "Always answer in clear English. Use the selected currency symbol for prices."
}
Answer shopper questions briefly and helpfully (2-4 sentences). Use only the catalog below for product facts and never invent products, prices or policies.
Shipping: free over $150, otherwise $9.90 flat, 2-5 business days.
Returns: 30 days, unopened items, free return label within the US.
Support: support@buyzen.com, replies within one business day.
Coupons: WELCOME10 (10% off over $50), SAVE20 (20% off over $200), TECHDEAL (15% off tech over $100), FLAT25 ($25 off over $150).

Catalog:
${catalogText}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
    });

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
      suggestions: COPY[locale].suggestions.slice(0, 3),
      source: "assistant",
    };
  } catch {
    return null;
  }
}

export async function answerQuestion(
  message: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
  options: ChatOptions = {},
): Promise<ChatReply> {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();
  const locale = options.locale === "bn" ? "bn" : "en";
  const copy = COPY[locale];
  const currency = options.currency ?? "USD";
  const rate = options.rate ?? 120;

  // 1. Small talk.
  if (/^(hi|hey|hello|yo|good (morning|afternoon|evening))\b/.test(lower)) {
    return {
      reply: copy.greeting,
      products: [],
      suggestions: copy.suggestions.slice(0, 3),
      source: "catalog-engine",
    };
  }

  if (/(thanks|thank you|cheers|ধন্যবাদ)/.test(lower) && trimmed.length < 30) {
    return {
      reply: copy.thanks,
      products: [],
      suggestions: [copy.suggestionBest, copy.suggestionBudget],
      source: "catalog-engine",
    };
  }

  // 2. Policy questions.
  if (
    /(track my order|order status|where is my order|my orders|order number|track order|অর্ডার ট্র্যাক)/.test(
      lower,
    )
  ) {
    return {
      reply: copy.tracking,
      products: [],
      suggestions: [copy.suggestionShipping, copy.suggestionBudget],
      source: "catalog-engine",
    };
  }

  if (/(shipping|delivery|how long|when will|arriv|postage|free over|ডেলিভারি)/.test(lower)) {
    return {
      reply: copy.shipping,
      products: [],
      suggestions: [copy.suggestionReturns, copy.suggestionDiscounts],
      source: "catalog-engine",
    };
  }

  if (/(return|refund|exchange|money back|রিটার্ন|ফেরত)/.test(lower)) {
    return {
      reply: copy.returns,
      products: [],
      suggestions: [copy.suggestionShipping, copy.suggestionTrack],
      source: "catalog-engine",
    };
  }

  if (/(payment|pay in|credit card|apple pay|paypal|checkout secure|পেমেন্ট)/.test(lower)) {
    return {
      reply: copy.payment,
      products: [],
      suggestions: [copy.suggestionDiscounts, copy.suggestionTrack],
      source: "catalog-engine",
    };
  }

  if (/(coupon|discount|promo|voucher|code|sale items|offer|deal|কুপন|ছাড়)/.test(lower)) {
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
              : `${formatMoney(coupon.value, currency, rate)} off`
          }${coupon.minSubtotal ? ` (min ${formatMoney(coupon.minSubtotal, currency, rate)})` : ""}`,
      )
      .join("\n");
    return {
      reply: `${copy.couponsIntro}\n${list}${copy.couponsOutro}`,
      products: [],
      suggestions: [copy.suggestionBest, copy.suggestionShipping],
      source: "catalog-engine",
    };
  }

  if (/(contact|email us|phone number|human|agent|talk to|speak to|call us|reach us|যোগাযোগ)/.test(lower)) {
    return {
      reply: copy.contact,
      products: [],
      suggestions: [copy.suggestionTrack, copy.suggestionReturns],
      source: "catalog-engine",
    };
  }

  // 3. Product discovery.
  const products = await searchProducts(trimmed);
  if (products.length > 0) {
    const names = products
      .slice(0, 3)
      .map(
        (product) =>
          `${product.name} (${formatMoney(product.price, currency, rate)})`,
      )
      .join(", ");
    return {
      reply: copy.found(trimmed, names),
      products,
      suggestions: [copy.suggestionBest, copy.suggestionBudget],
      source: "catalog-engine",
    };
  }

  // 4. Fall back to the hosted model when a key is configured.
  const ai = await openAiReply(trimmed, history, { locale, currency, rate });
  if (ai) return ai;

  return {
    reply: copy.fallback,
    products: [],
    suggestions: [...copy.suggestions],
    source: "catalog-engine",
  };
}
