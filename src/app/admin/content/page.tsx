import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PageHeader, Panel } from "@/components/admin/ui";
import { CmsPageEditor, WebsiteSettingsForm } from "@/components/admin/content-forms";

export const metadata = { title: "Content & CMS" };

const CMS_PAGES = [
  {
    slug: "about",
    title: "About Us",
    body: "ShopFront is a demo storefront for premium tech, audio, gaming and home goods.",
  },
  {
    slug: "contact",
    title: "Contact Us",
    body: "Reach the team at support@shopfront.dev or +880 1710-000000.",
  },
  {
    slug: "faq",
    title: "Frequently Asked Questions",
    body: "Add your most common questions here.",
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    body: "Describe how customer data is collected, used and protected.",
  },
  {
    slug: "terms",
    title: "Terms and Conditions",
    body: "Add the terms that customers accept at checkout.",
  },
  {
    slug: "returns",
    title: "Return and Refund Policy",
    body: "Explain the return window, condition rules and refund timings.",
  },
  {
    slug: "shipping",
    title: "Shipping Policy",
    body: "Explain delivery times, charges and coverage.",
  },
];

export default async function AdminContentPage() {
  await requirePermission("cms.manage");

  const [pages, settings] = await Promise.all([
    prisma.pageContent.findMany(),
    prisma.setting.findMany(),
  ]);
  const settingsMap = Object.fromEntries(
    settings.map((setting) => [setting.key, setting.value]),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content & website settings"
        description="Edit storefront copy and store configuration without touching the code."
      />

      <Panel
        title="Website settings"
        description="Contact details, social links, SEO and commerce configuration."
      >
        <WebsiteSettingsForm settings={settingsMap} />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        {CMS_PAGES.map((page) => {
          const stored = pages.find((item) => item.slug === page.slug);
          return (
            <Panel
              key={page.slug}
              title={page.title}
              description={`/${page.slug}`}
            >
              <CmsPageEditor
                slug={page.slug}
                defaultTitle={stored?.title ?? page.title}
                defaultBody={stored?.body ?? page.body}
                defaultPublished={stored?.published ?? true}
              />
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
