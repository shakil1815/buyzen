"use client";

import { useActionState } from "react";
import { Loader2, Save } from "lucide-react";
import {
  savePageContentAction,
  saveSettingsAction,
  type GrowthState,
} from "@/lib/actions/admin-growth";

export function CmsPageEditor({
  slug,
  defaultTitle,
  defaultBody,
  defaultPublished,
}: {
  slug: string;
  defaultTitle: string;
  defaultBody: string;
  defaultPublished: boolean;
}) {
  const [state, formAction, pending] = useActionState<GrowthState, FormData>(
    savePageContentAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="slug" value={slug} />
      <div>
        <label className="label" htmlFor={`title-${slug}`}>
          Title
        </label>
        <input
          id={`title-${slug}`}
          name="title"
          defaultValue={defaultTitle}
          required
          className="input"
        />
      </div>
      <div>
        <label className="label" htmlFor={`body-${slug}`}>
          Content
        </label>
        <textarea
          id={`body-${slug}`}
          name="body"
          rows={6}
          defaultValue={defaultBody}
          className="input resize-y"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-fg-muted">
        <input
          type="checkbox"
          name="published"
          defaultChecked={defaultPublished}
          className="h-4 w-4 rounded border-line-strong text-brand-fg"
        />
        Published
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-dark">
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save page
        </button>
        {state.error ? (
          <span className="text-xs font-semibold text-danger-fg">
            {state.error}
          </span>
        ) : null}
        {state.success ? (
          <span className="text-xs font-semibold text-success-fg">
            {state.success}
          </span>
        ) : null}
      </div>
    </form>
  );
}

export function WebsiteSettingsForm({
  settings,
}: {
  settings: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState<GrowthState, FormData>(
    saveSettingsAction,
    {},
  );

  const field = (
    name: string,
    label: string,
    defaultValue = "",
    type = "text",
  ) => (
    <div>
      <label className="label" htmlFor={`setting-${name}`}>
        {label}
      </label>
      <input
        id={`setting-${name}`}
        name={name}
        type={type}
        defaultValue={settings[name] ?? defaultValue}
        className="input"
      />
    </div>
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {field("siteName", "Website name", "BuyZen")}
        {field("contactEmail", "Contact email", "support@buyzen.com", "email")}
        {field("contactPhone", "Contact phone", "+880 1710-000000")}
        {field(
          "contactAddress",
          "Contact address",
          "42 Gulshan Avenue, Dhaka 1212",
        )}
        {field("socialFacebook", "Facebook URL", "https://facebook.com/buyzen")}
        {field("socialInstagram", "Instagram URL", "https://instagram.com/buyzen")}
        {field("socialYoutube", "YouTube URL", "https://youtube.com/@buyzen")}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {field("seoTitle", "SEO title", "BuyZen — premium tech & lifestyle")}
        {field(
          "seoDescription",
          "SEO description",
          "Premium audio, computing, gaming and home gear with free shipping over $150.",
        )}
        {field("supportEmail", "Support email", "support@buyzen.com", "email")}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {field("shippingFlatRate", "Flat shipping rate ($)", "9.90", "number")}
        {field(
          "shippingFreeThreshold",
          "Free shipping threshold ($)",
          "150",
          "number",
        )}
        {field("taxRate", "Tax rate (%)", "8", "number")}
        {field("invoicePrefix", "Invoice prefix", "INV")}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="setting-currencyDefault">
            Default currency
          </label>
          <select
            id="setting-currencyDefault"
            name="currencyDefault"
            defaultValue={settings.currencyDefault ?? "USD"}
            className="input"
          >
            <option value="USD">USD ($)</option>
            <option value="BDT">BDT (৳)</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="setting-languageDefault">
            Default language
          </label>
          <select
            id="setting-languageDefault"
            name="languageDefault"
            defaultValue={settings.languageDefault ?? "en"}
            className="input"
          >
            <option value="en">English</option>
            <option value="bn">বাংলা</option>
          </select>
        </div>
        {field("usdToBdtRate", "USD → BDT rate", "120", "number")}
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save settings
        </button>
        {state.error ? (
          <span className="text-xs font-semibold text-danger-fg">
            {state.error}
          </span>
        ) : null}
        {state.success ? (
          <span className="text-xs font-semibold text-success-fg">
            {state.success}
          </span>
        ) : null}
      </div>
    </form>
  );
}
