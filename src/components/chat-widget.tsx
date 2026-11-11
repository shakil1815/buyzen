"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bot, MessageCircle, Send, Sparkles, X } from "lucide-react";

type ChatProduct = {
  slug: string;
  name: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  blurb: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  products?: ChatProduct[];
  suggestions?: string[];
};

const GREETING: Message = {
  role: "assistant",
  content:
    "Hi! I'm the ShopFront assistant. Ask me to find a product, explain shipping or track an order.",
  suggestions: [
    "What are your best sellers?",
    "Show me something under $100",
    "What is your shipping policy?",
  ],
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setMessages((current) => [...current, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.slice(-6).map((message) => ({
        role: message.role,
        content: message.content,
      }));
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });
      const data = (await response.json()) as {
        reply?: string;
        products?: ChatProduct[];
        suggestions?: string[];
      };
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.reply ?? "Sorry, something went wrong. Try again.",
          products: data.products ?? [],
          suggestions: data.suggestions ?? [],
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "I couldn't reach the store right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open ? (
        <div className="flex h-[min(620px,80vh)] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-lift">
          <div className="flex items-center justify-between bg-ink-950 px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600">
                <Bot className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-sm font-semibold leading-tight">ShopFront assistant</p>
                <p className="text-[11px] text-ink-400">
                  Catalog-aware · replies instantly
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-ink-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Close assistant"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={bodyRef} className="flex-1 space-y-3 overflow-y-auto bg-ink-50/50 p-4">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className="space-y-2">
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                    message.role === "user"
                      ? "ml-auto bg-brand-600 text-white"
                      : "bg-white text-ink-800 shadow-sm ring-1 ring-ink-100"
                  }`}
                >
                  {message.content}
                </div>

                {message.products?.length ? (
                  <div className="space-y-2">
                    {message.products.map((product) => (
                      <Link
                        key={product.slug}
                        href={`/products/${product.slug}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-2.5 shadow-sm transition hover:border-brand-200"
                      >
                        <Image
                          src={product.image}
                          alt=""
                          width={44}
                          height={44}
                          className="h-11 w-11 rounded-lg object-cover"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-semibold text-ink-900">
                            {product.name}
                          </span>
                          <span className="block text-[11px] text-ink-500">
                            {product.category} · ★ {product.rating.toFixed(1)}
                          </span>
                        </span>
                        <span className="text-xs font-bold text-ink-900">
                          ${(product.price / 100).toFixed(2)}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : null}

                {message.suggestions?.length && index === messages.length - 1 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {message.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => send(suggestion)}
                        className="rounded-full border border-brand-200 bg-white px-3 py-1.5 text-[11px] font-medium text-brand-700 transition hover:bg-brand-50"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}

            {loading ? (
              <div className="flex items-center gap-2 text-xs text-ink-500">
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-brand-500" />
                Thinking…
              </div>
            ) : null}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-ink-100 bg-white p-3"
          >
            <label className="sr-only" htmlFor="chat-input">
              Message
            </label>
            <input
              id="chat-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about products, shipping, returns…"
              className="input flex-1"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn btn-primary px-3"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full bg-ink-950 px-4 py-3 text-sm font-semibold text-white shadow-lift transition hover:bg-ink-800"
      >
        {open ? <X className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
        {open ? "Close" : "Ask the assistant"}
      </button>
    </div>
  );
}
