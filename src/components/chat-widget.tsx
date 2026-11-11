"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bot, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { formatMoney } from "@/lib/format";

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

export function ChatWidget() {
  const { t, locale, currency, usdToBdt } = useI18n();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const greeting = useMemo<Message>(
    () => ({
      role: "assistant",
      content: t("chat.greeting"),
      suggestions: [
        t("chat.suggestion1"),
        t("chat.suggestion2"),
        t("chat.suggestion3"),
      ],
    }),
    [t],
  );

  useEffect(() => {
    if (!open) return;
    bodyRef.current?.scrollTo({
      top: bodyRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open]);

  function toggle() {
    setOpen((value) => {
      if (!value && messages.length === 0) setMessages([greeting]);
      return !value;
    });
  }

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
        body: JSON.stringify({
          message: trimmed,
          history,
          locale,
          currency,
          rate: usdToBdt,
        }),
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
          content: t("chat.error"),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open ? (
        <div className="flex h-[min(620px,80vh)] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-lift">
          <div className="flex items-center justify-between bg-ink-950 px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600">
                <Bot className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-sm font-semibold leading-tight">
                  {t("chat.title")}
                </p>
                <p className="text-[11px] text-ink-400">{t("chat.subtitle")}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-ink-400 transition hover:bg-white/10 hover:text-white"
              aria-label={t("chat.close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={bodyRef} className="flex-1 space-y-3 overflow-y-auto bg-surface-2/50 p-4">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className="space-y-2">
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                    message.role === "user"
                      ? "ml-auto bg-brand-600 text-white"
                      : "bg-surface text-fg shadow-sm ring-1 ring-line"
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
                        className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5 shadow-sm transition hover:border-brand-200"
                      >
                        <Image
                          src={product.image}
                          alt=""
                          width={44}
                          height={44}
                          className="h-11 w-11 rounded-lg object-cover"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-semibold text-fg">
                            {product.name}
                          </span>
                          <span className="block text-[11px] text-fg-muted">
                            {product.category} · ★ {product.rating.toFixed(1)}
                          </span>
                        </span>
                        <span className="text-xs font-bold text-fg">
                          {formatMoney(product.price, currency, usdToBdt)}
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
                        className="rounded-full border border-brand-200 bg-surface px-3 py-1.5 text-[11px] font-medium text-brand-fg transition hover:bg-brand-soft"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}

            {loading ? (
              <div className="flex items-center gap-2 text-xs text-fg-muted">
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-brand-500" />
                {t("chat.thinking")}
              </div>
            ) : null}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-line bg-surface p-3"
          >
            <label className="sr-only" htmlFor="chat-input">
              {t("chat.send")}
            </label>
            <input
              id="chat-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t("chat.placeholder")}
              className="input flex-1"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn btn-primary px-3"
              aria-label={t("chat.send")}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-2 rounded-full bg-ink-950 px-4 py-3 text-sm font-semibold text-white shadow-lift transition hover:bg-ink-800"
      >
        {open ? <X className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
        {open ? t("chat.close") : t("chat.open")}
      </button>
    </div>
  );
}
