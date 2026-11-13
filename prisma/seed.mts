/**
 * Seed script for the BuyZen store.
 *
 * Run with:  npm run db:seed
 *
 * It creates the demo catalog, generates a local SVG image for every product
 * (so the store works fully offline) and inserts demo users, reviews and
 * coupon codes.
 */
import { PrismaClient } from "@prisma/client";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();

type SeedProduct = {
  name: string;
  slug: string;
  brand: string;
  price: number;
  compareAtPrice?: number;
  description: string;
  stock: number;
  featured?: boolean;
  tags: string;
  palette: [string, string];
  glyph: string;
};

const categories = [
  {
    name: "Audio",
    slug: "audio",
    description: "Headphones, speakers and everything that sounds good.",
    palette: ["#6366f1", "#a855f7"] as [string, string],
  },
  {
    name: "Wearables",
    slug: "wearables",
    description: "Watches, trackers and smart gear for every day.",
    palette: ["#0ea5e9", "#22d3ee"] as [string, string],
  },
  {
    name: "Computing",
    slug: "computing",
    description: "Laptops, keyboards and desktop power tools.",
    palette: ["#f97316", "#f43f5e"] as [string, string],
  },
  {
    name: "Photography",
    slug: "photography",
    description: "Cameras, lenses and creative tools.",
    palette: ["#10b981", "#84cc16"] as [string, string],
  },
  {
    name: "Home",
    slug: "home",
    description: "Smart home, kitchen and lifestyle upgrades.",
    palette: ["#8b5cf6", "#ec4899"] as [string, string],
  },
  {
    name: "Gaming",
    slug: "gaming",
    description: "Consoles, controllers and gear built for play.",
    palette: ["#14b8a6", "#06b6d4"] as [string, string],
  },
];

const products: Record<string, SeedProduct[]> = {
  audio: [
    {
      name: "Aurex Pro Noise Cancelling Headphones",
      slug: "aurex-pro-noise-cancelling-headphones",
      brand: "Aurex",
      price: 27900,
      compareAtPrice: 34900,
      description:
        "Adaptive hybrid noise cancelling with 40 hours of playback. Spatial audio with head tracking and a memory-foam headband that stays comfortable through long flights.",
      stock: 42,
      featured: true,
      tags: "headphones over-ear noise cancelling wireless bluetooth travel",
      palette: ["#6366f1", "#a855f7"],
      glyph: "headphones",
    },
    {
      name: "Pebble Mini Wireless Earbuds",
      slug: "pebble-mini-wireless-earbuds",
      brand: "Pebble",
      price: 6900,
      compareAtPrice: 8900,
      description:
        "Pocket-sized earbuds with punchy bass, IPX5 water resistance and a case that adds three extra charges. USB-C fast charging tops them up in 20 minutes.",
      stock: 120,
      featured: true,
      tags: "earbuds in-ear budget running sports workout",
      palette: ["#818cf8", "#38bdf8"],
      glyph: "earbuds",
    },
    {
      name: "Lumen Smart Speaker",
      slug: "lumen-smart-speaker",
      brand: "Lumen",
      price: 11900,
      compareAtPrice: 14900,
      description:
        "Room-filling 360° speaker with voice assistant support, multi-room pairing and a night light that dims with your bedtime routine.",
      stock: 64,
      tags: "speaker smart home bluetooth voice assistant",
      palette: ["#7c3aed", "#c026d3"],
      glyph: "speaker",
    },
    {
      name: "Studio One Condenser Microphone",
      slug: "studio-one-condenser-microphone",
      brand: "Studio One",
      price: 14900,
      compareAtPrice: 18900,
      description:
        "Cardioid condenser mic for podcasting, vocals and streaming. Zero-latency monitoring, a shock mount and a pop filter in the box.",
      stock: 25,
      tags: "microphone podcast streaming recording condenser",
      palette: ["#4f46e5", "#0ea5e9"],
      glyph: "mic",
    },
    {
      name: "Nomad Portable Bluetooth Speaker",
      slug: "nomad-portable-bluetooth-speaker",
      brand: "Nomad",
      price: 8900,
      compareAtPrice: 10900,
      description:
        "Rugged, waterproof speaker with 20 hours of battery life and a built-in strap loop. Pair two for true stereo.",
      stock: 78,
      featured: true,
      tags: "speaker portable outdoor waterproof camping",
      palette: ["#6366f1", "#0ea5e9"],
      glyph: "speaker",
    },
    {
      name: "Cordless Studio Headset",
      slug: "cordless-studio-headset",
      brand: "Aurex",
      price: 19900,
      description:
        "Broadcast-quality headset with a detachable boom mic, 30-hour battery and switchable sidetone for team calls.",
      stock: 18,
      tags: "headset gaming calls microphone detachable",
      palette: ["#4338ca", "#7c3aed"],
      glyph: "headphones",
    },
  ],
  wearables: [
    {
      name: "Pulse X Smartwatch",
      slug: "pulse-x-smartwatch",
      brand: "Pulse",
      price: 24900,
      compareAtPrice: 29900,
      description:
        "AMOLED display, 10-day battery life and dual-band GPS. Tracks 120 workout modes with continuous heart-rate and SpO2 monitoring.",
      stock: 55,
      featured: true,
      tags: "smartwatch fitness gps running heart rate health",
      palette: ["#0ea5e9", "#22d3ee"],
      glyph: "watch",
    },
    {
      name: "Trail Running Watch 2",
      slug: "trail-running-watch-2",
      brand: "Trail",
      price: 17900,
      compareAtPrice: 21900,
      description:
        "Lightweight 42 g running watch with elevation profiles, trail maps and 30 hours of GPS runtime. Built for the rough stuff.",
      stock: 33,
      tags: "running watch gps trail ultra endurance",
      palette: ["#06b6d4", "#3b82f6"],
      glyph: "watch",
    },
    {
      name: "Band Flex Fitness Tracker",
      slug: "band-flex-fitness-tracker",
      brand: "Pulse",
      price: 5900,
      compareAtPrice: 7900,
      description:
        "Slim tracker with automatic workout detection, sleep staging and a two-week battery. Swim, shower and forget about it.",
      stock: 140,
      tags: "fitness tracker band cheap steps sleep",
      palette: ["#38bdf8", "#818cf8"],
      glyph: "band",
    },
    {
      name: "Aviator Titanium Sunglasses",
      slug: "aviator-titanium-sunglasses",
      brand: "Meridian",
      price: 12900,
      compareAtPrice: 15900,
      description:
        "Featherweight titanium frames with polarised lenses, 100% UV400 protection and spring hinges that survive daily abuse.",
      stock: 60,
      tags: "sunglasses eyewear polarised summer accessories",
      palette: ["#f59e0b", "#ef4444"],
      glyph: "glasses",
    },
    {
      name: "Meridian Chrono Watch",
      slug: "meridian-chrono-watch",
      brand: "Meridian",
      price: 31900,
      compareAtPrice: 39900,
      description:
        "Mechanical-feel chronograph with a sapphire crystal face, brushed steel case and 100 m water resistance.",
      stock: 21,
      featured: true,
      tags: "watch chronograph luxury steel analog",
      palette: ["#eab308", "#f97316"],
      glyph: "watch",
    },
  ],
  computing: [
    {
      name: "Vertex 14 Ultralight Laptop",
      slug: "vertex-14-ultralight-laptop",
      brand: "Vertex",
      price: 119900,
      compareAtPrice: 139900,
      description:
        "1.1 kg magnesium chassis, 14-inch 2.8K OLED and 18-hour battery. 16 GB RAM, 512 GB SSD, all-day performance for people who travel.",
      stock: 12,
      featured: true,
      tags: "laptop ultrabook notebook travel work oled",
      palette: ["#f97316", "#f43f5e"],
      glyph: "laptop",
    },
    {
      name: "Vertex 16 Creator Workstation",
      slug: "vertex-16-creator-workstation",
      brand: "Vertex",
      price: 189900,
      compareAtPrice: 209900,
      description:
        "16-inch colour-accurate mini-LED display with 12-core CPU and a dedicated GPU. Built for 4K timelines and heavy renders.",
      stock: 7,
      tags: "laptop workstation video editing design rendering",
      palette: ["#fb923c", "#ef4444"],
      glyph: "laptop",
    },
    {
      name: "Tactile Pro Mechanical Keyboard",
      slug: "tactile-pro-mechanical-keyboard",
      brand: "Tactile",
      price: 13900,
      compareAtPrice: 16900,
      description:
        "Hot-swappable 75% keyboard with gasket mount, PBT double-shot keycaps and three layers of sound dampening. Wired or 2.4 GHz.",
      stock: 46,
      featured: true,
      tags: "keyboard mechanical typing gaming office hot-swap",
      palette: ["#f59e0b", "#f97316"],
      glyph: "keyboard",
    },
    {
      name: "Glide Wireless Mouse",
      slug: "glide-wireless-mouse",
      brand: "Glide",
      price: 5900,
      compareAtPrice: 6900,
      description:
        "Ergonomic 8K polling mouse with 70-hour battery and near-silent switches. Works across three devices with one click.",
      stock: 88,
      tags: "mouse wireless ergonomic productivity",
      palette: ["#fbbf24", "#f43f5e"],
      glyph: "mouse",
    },
    {
      name: "Hub 9-in-1 Docking Station",
      slug: "hub-9-in-1-docking-station",
      brand: "Hub",
      price: 8900,
      compareAtPrice: 10900,
      description:
        "One cable for dual 4K displays, 100W power delivery, gigabit ethernet and an SD card reader. Works with any USB-C laptop.",
      stock: 65,
      tags: "dock hub usb-c adapter display ethernet",
      palette: ["#fb7185", "#c026d3"],
      glyph: "hub",
    },
    {
      name: "Vault 2TB Portable SSD",
      slug: "vault-2tb-portable-ssd",
      brand: "Vault",
      price: 14900,
      compareAtPrice: 18900,
      description:
        "1050 MB/s transfer speeds in a shock-proof aluminium shell with hardware encryption. Password protection and a USB-C cable included.",
      stock: 54,
      tags: "ssd storage drive backup external usb-c",
      palette: ["#f97316", "#8b5cf6"],
      glyph: "ssd",
    },
  ],
  photography: [
    {
      name: "Lumen R7 Mirrorless Camera",
      slug: "lumen-r7-mirrorless-camera",
      brand: "Lumen",
      price: 149900,
      compareAtPrice: 169900,
      description:
        "33 MP full-frame sensor with in-body stabilisation and 8K video. Subject-detection autofocus that actually keeps up with pets.",
      stock: 9,
      featured: true,
      tags: "camera mirrorless photography video full-frame",
      palette: ["#10b981", "#84cc16"],
      glyph: "camera",
    },
    {
      name: "Prime 35mm f/1.8 Lens",
      slug: "prime-35mm-f-1-8-lens",
      brand: "Lumen",
      price: 54900,
      compareAtPrice: 62900,
      description:
        "Fast, sharp standard prime with a clicky aperture ring and a weather-sealed magnesium barrel. The do-everything street lens.",
      stock: 15,
      tags: "lens prime 35mm photography fast aperture",
      palette: ["#34d399", "#22d3ee"],
      glyph: "lens",
    },
    {
      name: "Grip Carbon Travel Tripod",
      slug: "grip-carbon-travel-tripod",
      brand: "Grip",
      price: 32900,
      compareAtPrice: 39900,
      description:
        "Carbon-fibre legs that fold to 42 cm and hold 12 kg. Centre column flips to macro position and a built-in ball head comes standard.",
      stock: 27,
      tags: "tripod carbon photography travel",
      palette: ["#22c55e", "#0ea5e9"],
      glyph: "tripod",
    },
    {
      name: "Daylight 5-in-1 Reflector",
      slug: "daylight-5-in-1-reflector",
      brand: "Grip",
      price: 4900,
      compareAtPrice: 6400,
      description:
        "Silver, gold, white, black and diffusion panels in one collapsible disc. The cheapest way to make a room look professional.",
      stock: 110,
      tags: "reflector lighting studio photography",
      palette: ["#84cc16", "#facc15"],
      glyph: "reflector",
    },
    {
      name: "Snap Pocket Camera",
      slug: "snap-pocket-camera",
      brand: "Lumen",
      price: 17900,
      compareAtPrice: 21900,
      description:
        "Compact point-and-shoot with a tilting viewfinder, film simulation modes and instant Wi-Fi transfer to your phone.",
      stock: 38,
      tags: "camera compact point and shoot travel retro",
      palette: ["#10b981", "#f97316"],
      glyph: "camera",
    },
  ],
  home: [
    {
      name: "Glow Smart Bulb 4-Pack",
      slug: "glow-smart-bulb-4-pack",
      brand: "Glow",
      price: 4900,
      compareAtPrice: 6900,
      description:
        "Sixteen million colours, tunable whites and Matter support. Schedule scenes, sync to music or dim for bedtime automatically.",
      stock: 150,
      featured: true,
      tags: "smart bulb light lighting matter home automation",
      palette: ["#8b5cf6", "#ec4899"],
      glyph: "bulb",
    },
    {
      name: "Brew Precision Kettle",
      slug: "brew-precision-kettle",
      brand: "Brew",
      price: 8900,
      compareAtPrice: 10900,
      description:
        "Variable temperature control to the degree for coffee and tea, a 60-minute hold mode and a gooseneck spout that pours clean.",
      stock: 47,
      tags: "kettle coffee tea kitchen pour over",
      palette: ["#a855f7", "#f97316"],
      glyph: "kettle",
    },
    {
      name: "Air Sense Smart Purifier",
      slug: "air-sense-smart-purifier",
      brand: "Air Sense",
      price: 24900,
      compareAtPrice: 29900,
      description:
        "True HEPA filtration for rooms up to 80 m² with a live air-quality readout on the display and whisper-quiet night mode.",
      stock: 30,
      featured: true,
      tags: "air purifier hepa home health quiet",
      palette: ["#6366f1", "#06b6d4"],
      glyph: "purifier",
    },
    {
      name: "Sweep Robot Vacuum",
      slug: "sweep-robot-vacuum",
      brand: "Sweep",
      price: 32900,
      compareAtPrice: 39900,
      description:
        "Lidar mapping, self-emptying dock and a mop that lifts over carpets. Schedule it once and stop thinking about floors.",
      stock: 22,
      tags: "robot vacuum cleaning home smart",
      palette: ["#8b5cf6", "#0ea5e9"],
      glyph: "robot",
    },
    {
      name: "Terra Ceramic Cookware Set",
      slug: "terra-ceramic-cookware-set",
      brand: "Terra",
      price: 15900,
      compareAtPrice: 19900,
      description:
        "Non-stick ceramic pans and a 3.2 L pot that work on induction. Oven-safe to 220 °C and free of PFAS.",
      stock: 52,
      tags: "cookware pan kitchen non stick induction set",
      palette: ["#f43f5e", "#f59e0b"],
      glyph: "pan",
    },
  ],
  gaming: [
    {
      name: "Arcade Pro Controller",
      slug: "arcade-pro-controller",
      brand: "Arcade",
      price: 6900,
      compareAtPrice: 8900,
      description:
        "Hall-effect sticks with zero drift, back paddles and swappable stick heights. Works on PC, console and mobile via USB-C or 2.4 GHz.",
      stock: 95,
      featured: true,
      tags: "controller gamepad hall effect gaming ps5 xbox",
      palette: ["#14b8a6", "#06b6d4"],
      glyph: "controller",
    },
    {
      name: "Nova Handheld Console",
      slug: "nova-handheld-console",
      brand: "Nova",
      price: 39900,
      compareAtPrice: 44900,
      description:
        "7-inch 120 Hz OLED handheld with hall-effect triggers, 512 GB of storage and a battery that survives a long flight.",
      stock: 16,
      featured: true,
      tags: "handheld console gaming portable steamdeck switch",
      palette: ["#14b8a6", "#8b5cf6"],
      glyph: "console",
    },
    {
      name: "Halo RGB Gaming Headset",
      slug: "halo-rgb-gaming-headset",
      brand: "Halo",
      price: 10900,
      compareAtPrice: 13900,
      description:
        "50 mm drivers, a broadcast-clear boom mic and 16.8 million colour lighting you can sync with your game.",
      stock: 71,
      tags: "headset gaming rgb headset console pc",
      palette: ["#22d3ee", "#a855f7"],
      glyph: "headset",
    },
    {
      name: "Titan RGB Gaming Mouse",
      slug: "titan-rgb-gaming-mouse",
      brand: "Titan",
      price: 7900,
      compareAtPrice: 9900,
      description:
        "58 g magnesium shell, 26K DPI sensor and optical switches rated to 100 million clicks. A genuinely lightweight esports mouse.",
      stock: 83,
      tags: "mouse gaming esports lightweight rgb",
      palette: ["#06b6d4", "#14b8a6"],
      glyph: "mouse",
    },
    {
      name: "Core Portable Gaming Monitor",
      slug: "core-portable-gaming-monitor",
      brand: "Core",
      price: 29900,
      compareAtPrice: 34900,
      description:
        "15.6-inch 240 Hz IPS with 1 ms response, folded into a 1.4 kg shell with a built-in kickstand. One USB-C cable powers it.",
      stock: 24,
      tags: "monitor portable gaming display esports",
      palette: ["#0d9488", "#22d3ee"],
      glyph: "monitor",
    },
  ],
};

/** Deterministic SVG artwork so the catalogue ships with local images. */
function productSvg(
  product: SeedProduct,
  category: string,
  variant = 0,
): string {
  const [from, to] = product.palette;
  const seed = product.slug.length;
  const angle = (seed * 37 + variant * 121) % 360;
  const blobs = Array.from({ length: 5 }, (_, i) => {
    const cx = ((seed * (i + 3) + variant * 17) % 100) + 10;
    const cy = ((seed * (i + 7) + variant * 29) % 100) + 10;
    const r = 18 + ((seed * (i + 5) + variant * 11) % 26);
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" fill-opacity="0.07" />`;
  }).join("");
  const initials = product.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  const label = variant === 0 ? category.toUpperCase() : `VIEW ${variant + 1}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" role="img" aria-label="${product.name}">
  <defs>
    <linearGradient id="g" gradientTransform="rotate(${angle} .5 .5)">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#g)"/>
  ${blobs}
  <g fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="3">
    <circle cx="400" cy="360" r="${190 - variant * 28}"/>
    <circle cx="400" cy="360" r="${250 - variant * 28}" stroke-opacity="0.15"/>
  </g>
  <text x="400" y="400" font-family="Segoe UI, Arial, sans-serif" font-size="150" font-weight="700" fill="#ffffff" fill-opacity="0.92" text-anchor="middle">${initials}</text>
  <text x="400" y="620" font-family="Segoe UI, Arial, sans-serif" font-size="34" letter-spacing="6" fill="#ffffff" fill-opacity="0.85" text-anchor="middle">${label}</text>
  <text x="400" y="672" font-family="Segoe UI, Arial, sans-serif" font-size="22" fill="#ffffff" fill-opacity="0.6" text-anchor="middle">${product.brand.toUpperCase()}</text>
</svg>`;
}

async function main() {
  const publicDir = join(process.cwd(), "public", "products");
const photoDir = join(publicDir, "photos");
mkdirSync(photoDir, { recursive: true });
  mkdirSync(publicDir, { recursive: true });

  const createdCategories = new Map<string, string>();
  for (const category of categories) {
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: `/products/category-${category.slug}.svg`,
      },
    });
    createdCategories.set(category.slug, record.id);

    writeFileSync(
      join(publicDir, `category-${category.slug}.svg`),
      productSvg(
        {
          name: category.name,
          slug: category.slug,
          brand: "BuyZen",
          price: 0,
          description: "",
          stock: 0,
          tags: "",
          palette: category.palette,
          glyph: "category",
        },
        "Collection",
      ),
    );
  }

  let index = 0;
  for (const [categorySlug, items] of Object.entries(products)) {
    const categoryId = createdCategories.get(categorySlug)!;
    for (const item of items) {
      index += 1;
      const gallery = Array.from(
        { length: 3 },
        (_, variant) => `/products/${item.slug}-${variant + 1}.svg`,
      );
      const image = gallery[0];

      // Prefer real photography that was already downloaded for this product.
      const photoFiles = readdirSync(photoDir)
        .filter(
          (file) =>
            file.startsWith(`${item.slug}-`) &&
            /\.(jpg|jpeg|png|webp)$/i.test(file),
        )
        .sort();
      if (photoFiles.length > 0) {
        gallery.length = 0;
        for (const file of photoFiles) {
          gallery.push(`/products/photos/${file}`);
        }
      }
      for (const [variant] of gallery.entries()) {
        writeFileSync(
          join(publicDir, `${item.slug}-${variant + 1}.svg`),
          productSvg(item, categorySlug, variant),
        );
      }      writeFileSync(
        join(publicDir, `${item.slug}.svg`),
        productSvg(item, categorySlug, 0),
      );
      const reviewCount = (index * 7) % 5 + 1;
      const rating = Math.round((3.7 + ((index * 13) % 13) / 10) * 10) / 10;

      await prisma.product.upsert({
        where: { slug: item.slug },
        update: {
          name: item.name,
          price: item.price,
          compareAtPrice: item.compareAtPrice ?? null,
          description: item.description,
          stock: item.stock,
          featured: item.featured ?? false,
          brand: item.brand,
          categoryId,
          reviewCount,
          rating,
          ...(photoFiles.length > 0
            ? { image, gallery: JSON.stringify(gallery) }
            : {}),
        },
        create: {
          name: item.name,
          slug: item.slug,
          sku: `BZ-${categorySlug.slice(0, 3).toUpperCase()}-${String(index).padStart(4, "0")}`,
          brand: item.brand,
          price: item.price,
          compareAtPrice: item.compareAtPrice ?? null,
          description: item.description,
          stock: item.stock,
          featured: item.featured ?? false,
          image,
          gallery: JSON.stringify(gallery),
          categoryId,
          reviewCount,
          rating,
        },
      });
    }
  }

  // Demo accounts -------------------------------------------------------
  const { hash } = await import("bcryptjs");
  const adminPassword = await hash("admin12345", 10);
  const customerPassword = await hash("customer123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@buyzen.com" },
    update: { role: "SUPER_ADMIN", passwordHash: adminPassword },
    create: {
      email: "admin@buyzen.com",
      name: "Ada Admin",
      passwordHash: adminPassword,
      role: "SUPER_ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "orders@buyzen.com" },
    update: { role: "ORDER_MANAGER", passwordHash: adminPassword },
    create: {
      email: "orders@buyzen.com",
      name: "Omar Orders",
      passwordHash: adminPassword,
      role: "ORDER_MANAGER",
    },
  });

  await prisma.user.upsert({
    where: { email: "support@buyzen.com" },
    update: { role: "SUPPORT", passwordHash: adminPassword },
    create: {
      email: "support@buyzen.com",
      name: "Sana Support",
      passwordHash: adminPassword,
      role: "SUPPORT",
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: { passwordHash: customerPassword },
    create: {
      email: "customer@example.com",
      name: "Chris Customer",
      passwordHash: customerPassword,
      role: "CUSTOMER",
    },
  });

  // Reviews -------------------------------------------------------------
  const reviewCopy = [
    { rating: 5, title: "Exceeded expectations", body: "Exactly as described and it arrived two days early. Would buy again." },
    { rating: 4, title: "Great value", body: "Solid build quality for the price. Only wish the case was a little slimmer." },
    { rating: 5, title: "Instant favourite", body: "I've replaced three other devices with this one. Setup took five minutes." },
    { rating: 4, title: "Very good", body: "Does the job well. Delivery was quick and packaging was tidy." },
    { rating: 3, title: "Decent but pricey", body: "Quality is good but I expected a bit more at this price point." },
  ];

  const allProducts = await prisma.product.findMany({ orderBy: { createdAt: "asc" } });

  // A handful of reviewer accounts so products show believable review counts
  const reviewerNames = ["Mia Reyes", "Tom Novak", "Priya Shah", "Jonas Berg", "Lena Ortiz"];
  const reviewers = [];
  for (let i = 0; i < reviewerNames.length; i += 1) {
    reviewers.push(
      await prisma.user.upsert({
        where: { email: `reviewer${i + 1}@example.com` },
        update: {},
        create: {
          email: `reviewer${i + 1}@example.com`,
          name: reviewerNames[i],
          passwordHash: customerPassword,
          role: "CUSTOMER",
        },
      }),
    );
  }

  for (const product of allProducts) {
    const count = Math.min(product.reviewCount, reviewers.length);
    for (let i = 0; i < count; i += 1) {
      const copy = reviewCopy[(i + product.name.length) % reviewCopy.length];
      const reviewer = reviewers[(i + product.name.length) % reviewers.length];
      await prisma.review.upsert({
        where: { productId_userId: { productId: product.id, userId: reviewer.id } },
        update: { rating: copy.rating, title: copy.title, body: copy.body },
        create: {
          productId: product.id,
          userId: reviewer.id,
          rating: copy.rating,
          title: copy.title,
          body: copy.body,
        },
      });
    }
  }

  // Coupons -------------------------------------------------------------
  const coupons = [
    { code: "WELCOME10", type: "PERCENT", value: 10, minSubtotal: 5000, description: "10% off your first order over $50" },
    { code: "SAVE20", type: "PERCENT", value: 20, minSubtotal: 20000, description: "20% off orders over $200" },
    { code: "TECHDEAL", type: "PERCENT", value: 15, minSubtotal: 10000, description: "15% off tech over $100" },
    { code: "FLAT25", type: "FIXED", value: 2500, minSubtotal: 15000, description: "$25 off orders over $150" },
  ];
  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: coupon,
      create: coupon,
    });
  }

  // Wishlist starter for the demo customer
  const firstProduct = allProducts[0];
  if (firstProduct) {
    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: customer.id, productId: firstProduct.id } },
      update: {},
      create: { userId: customer.id, productId: firstProduct.id },
    });
  }

  // Admin roles (mirrors src/lib/permissions.ts) ---------------------------
  const roles = [
    { slug: "SUPER_ADMIN", name: "Super Admin" },
    { slug: "ADMIN", name: "Admin" },
    { slug: "ORDER_MANAGER", name: "Order Manager" },
    { slug: "PRODUCT_MANAGER", name: "Product Manager" },
    { slug: "SUPPORT", name: "Customer Support" },
    { slug: "MARKETING_MANAGER", name: "Marketing Manager" },
  ];
  for (const role of roles) {
    await prisma.adminRole.upsert({
      where: { slug: role.slug },
      update: { name: role.name },
      create: {
        ...role,
        permissions: "[]",
        description: `Built-in ${role.name} role`,
        isSystem: true,
      },
    });
  }

  // Demo marketing + content ----------------------------------------------
  const bannerCount = await prisma.banner.count();
  if (bannerCount === 0) {
    await prisma.banner.createMany({
      data: [
        {
          title: "Eid tech week",
          subtitle: "Up to 25% off selected audio and wearables",
          body: "Use code WELCOME10 for an extra 10% on your first order.",
          link: "/products?deals=1",
          position: "home",
          active: true,
        },
        {
          title: "Free delivery over ৳15,000",
          subtitle: "Across Dhaka and all 64 districts",
          link: "/help#shipping",
          position: "sidebar",
          active: true,
        },
      ],
    });
  }

  const pageCount = await prisma.pageContent.count();
  if (pageCount === 0) {
    await prisma.pageContent.createMany({
      data: [
        {
          slug: "about",
          title: "About Us",
          body: "BuyZen curates premium tech, audio, gaming and home goods for Bangladesh. We source directly, ship nationwide and support every order from one team.",
        },
        {
          slug: "faq",
          title: "Frequently Asked Questions",
          body: "Delivery takes 2-5 business days, is free over ৳15,000, and every unopened item can be returned within 30 days.",
        },
        {
          slug: "returns",
          title: "Return and Refund Policy",
          body: "Request a return within 30 days of delivery. We email a prepaid label and refund the original payment method within 3-5 days of the parcel being scanned.",
        },
      ],
    });
  }

  const settings = [
    ["site_name", "BuyZen", "site"],
    ["contact_email", "support@buyzen.com", "contact"],
    ["contact_phone", "+880 1710-000000", "contact"],
    ["contact_address", "42 Gulshan Avenue, Dhaka 1212, Bangladesh", "contact"],
    ["seo_title", "BuyZen — premium tech & lifestyle", "seo"],
    [
      "seo_description",
      "Premium audio, computing, gaming and home gear with free delivery over ৳15,000.",
      "seo",
    ],
    ["shipping_flat_rate", "9.90", "shipping"],
    ["shipping_free_threshold", "150", "shipping"],
    ["tax_rate", "8", "tax"],
    ["currency_default", "BDT", "currency"],
    ["language_default", "bn", "language"],
    ["usd_to_bdt_rate", "120", "currency"],
    ["support_email", "support@buyzen.com", "support"],
    ["invoice_prefix", "INV", "invoice"],
    ["session_timeout_minutes", "60", "security"],
    ["max_login_attempts", "5", "security"],
    ["require_2fa", "false", "security"],
    ["mask_sensitive_data", "true", "security"],
    ["segment_new_days", "30", "segmentation"],
    ["segment_inactive_days", "90", "segmentation"],
    ["segment_regular_orders", "3", "segmentation"],
    ["segment_high_value_cents", "50000", "segmentation"],
  ];
  for (const [key, value, group] of settings) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value, group },
    });
  }

  // Demo location data so the admin map has something to show ---------------
  const locations = [
    ["Dhaka", "Dhaka", "Dhaka"],
    ["Dhaka", "Dhaka", "Gulshan"],
    ["Dhaka", "Dhaka", "Dhanmondi"],
    ["Chattogram", "Chattogram", "Chattogram"],
    ["Chattogram", "Chattogram", "Cox's Bazar"],
    ["Sylhet", "Sylhet", "Sylhet"],
    ["Rajshahi", "Rajshahi", "Rajshahi"],
    ["Khulna", "Khulna", "Khulna"],
    ["Mymensingh", "Mymensingh", "Mymensingh"],
    ["Rangpur", "Rangpur", "Rangpur"],
    ["Barishal", "Barishal", "Barishal"],
  ];

  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: { id: true },
  });
  for (const [index, customer] of customers.entries()) {
    const [division, district, city] = locations[index % locations.length];
    await prisma.user.update({
      where: { id: customer.id },
      data: {
        division,
        district,
        city,
        country: "Bangladesh",
        phone: `+880171${String(1000000 + index).slice(-7)}`,
        locationConsent: index % 2 === 0,
        lastActiveAt: new Date(Date.now() - index * 36e5 * 9),
      },
    });
  }

  const ticketCount = await prisma.supportTicket.count();
  if (ticketCount === 0 && customers[0]) {
    const ticket = await prisma.supportTicket.create({
      data: {
        number: "TKT-1001",
        userId: customers[0].id,
        subject: "Wrong item delivered",
        category: "order",
        priority: "HIGH",
        status: "OPEN",
        messages: {
          create: {
            authorType: "CUSTOMER",
            authorId: customers[0].id,
            body: "I ordered the wireless earbuds but received the speaker. Can I exchange it?",
          },
        },
      },
    });
    console.log(`Seeded support ticket ${ticket.number}`);
  }

  console.log(`Seeded ${allProducts.length} products, ${categories.length} categories.`);
  console.log("Admin login:    admin@buyzen.com / admin12345");
  console.log("Customer login: customer@example.com / customer123");
  void admin;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
