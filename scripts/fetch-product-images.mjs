/**
 * Downloads real product photography for every seeded product from
 * Wikimedia Commons (CC / public-domain images) and points the catalogue at it.
 *
 *   node scripts/fetch-product-images.mjs
 *
 * Images land in public/products/photos/<slug>.jpg and the attribution for each
 * file is written to public/products/photos/credits.json.
 */
import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const OUT_DIR = join(process.cwd(), "public", "products", "photos");
mkdirSync(OUT_DIR, { recursive: true });

/** Commons search queries (short + high signal) per product slug. */
const PHOTOS = {
  "aurex-pro-noise-cancelling-headphones": {
    queries: ["over-ear headphones", "headphones white background"],
    prefer: ["headphone", "headset", "headphones"],
  },
  "pebble-mini-wireless-earbuds": {
    queries: ["wireless earbuds", "earbuds apple", "in-ear headphones"],
    prefer: ["earbud", "earphone", "earbuds", "headphone"],
  },
  "lumen-smart-speaker": {
    queries: ["smart speaker", "voice assistant speaker"],
    prefer: ["speaker"],
  },
  "studio-one-condenser-microphone": {
    queries: ["condenser microphone", "studio microphone"],
    prefer: ["microphone"],
  },
  "nomad-portable-bluetooth-speaker": {
    queries: ["portable speaker", "bluetooth speaker"],
    prefer: ["speaker"],
  },
  "cordless-studio-headset": {
    queries: ["headset", "headphones with microphone"],
    prefer: ["headset", "headphone"],
  },
  "pulse-x-smartwatch": {
    queries: ["smartwatch", "smart watch wrist"],
    prefer: ["watch"],
  },
  "trail-running-watch-2": {
    queries: ["running watch", "sports watch wrist"],
    prefer: ["watch"],
  },
  "band-flex-fitness-tracker": {
    queries: ["fitness tracker", "activity tracker band"],
    prefer: ["tracker", "band", "watch"],
  },
  "aviator-titanium-sunglasses": {
    queries: ["aviator sunglasses", "sunglasses"],
    prefer: ["sunglasses", "glasses"],
  },
  "meridian-chrono-watch": {
    queries: ["chronograph watch", "mechanical wristwatch"],
    prefer: ["watch"],
  },
  "vertex-14-ultralight-laptop": {
    queries: ["ultrabook laptop", "thin laptop computer"],
    prefer: ["laptop", "notebook", "macbook"],
  },
  "vertex-16-creator-workstation": {
    queries: ["laptop computer desk", "laptop workstation"],
    prefer: ["laptop", "notebook", "computer"],
  },
  "tactile-pro-mechanical-keyboard": {
    queries: ["mechanical keyboard", "computer keyboard"],
    prefer: ["keyboard"],
  },
  "glide-wireless-mouse": {
    queries: ["computer mouse", "wireless mouse"],
    prefer: ["mouse"],
  },
  "hub-9-in-1-docking-station": {
    queries: ["usb hub", "usb c dock adapter"],
    prefer: ["hub", "dock", "adapter"],
  },
  "vault-2tb-portable-ssd": {
    queries: ["portable ssd", "external hard drive usb"],
    prefer: ["ssd", "drive", "storage"],
  },
  "lumen-r7-mirrorless-camera": {
    queries: ["mirrorless camera", "digital camera body"],
    prefer: ["camera"],
  },
  "prime-35mm-f-1-8-lens": {
    queries: ["camera lens", "prime lens photography"],
    prefer: ["lens"],
  },
  "grip-carbon-travel-tripod": {
    queries: ["tripod", "camera tripod"],
    prefer: ["tripod"],
  },
  "daylight-5-in-1-reflector": {
    queries: ["photography reflector", "studio softbox light"],
    prefer: ["reflector", "softbox"],
  },
  "snap-pocket-camera": {
    queries: ["compact camera", "point and shoot camera"],
    prefer: ["camera"],
  },
  "glow-smart-bulb-4-pack": {
    queries: ["led bulb", "smart light bulb"],
    prefer: ["bulb", "lamp"],
  },
  "brew-precision-kettle": {
    queries: ["electric kettle", "gooseneck kettle"],
    prefer: ["kettle"],
  },
  "air-sense-smart-purifier": {
    queries: ["air purifier", "hepa filter appliance"],
    prefer: ["purifier", "filter"],
  },
  "sweep-robot-vacuum": {
    queries: ["robot vacuum", "vacuum cleaner robot"],
    prefer: ["vacuum", "robot"],
  },
  "terra-ceramic-cookware-set": {
    queries: ["frying pan", "ceramic cookware pot"],
    prefer: ["pan", "cookware", "pot", "skillet"],
  },
  "arcade-pro-controller": {
    queries: ["game controller", "gamepad controller"],
    prefer: ["controller", "gamepad"],
  },
  "nova-handheld-console": {
    queries: ["handheld game console", "portable game console"],
    prefer: ["console", "handheld", "portable", "playstation", "nintendo"],
  },
  "halo-rgb-gaming-headset": {
    queries: ["gaming headset", "gaming headphones"],
    prefer: ["headset", "headphone"],
  },
  "titan-rgb-gaming-mouse": {
    queries: ["gaming mouse", "computer mouse rgb"],
    prefer: ["mouse"],
  },
  "core-portable-gaming-monitor": {
    queries: ["portable monitor", "computer display screen"],
    prefer: ["monitor", "display"],
  },
};

/**
 * Hand-picked Commons files that read much better than the automatic pick.
 * The exact file title is matched first and used as the hero image.
 */
const OVERRIDES = {
  "nomad-portable-bluetooth-speaker": "Bluetooth speaker NBY-18 P8041745.jpg",
  "vertex-16-creator-workstation": "Laptop on a neat desk (Unsplash).jpg",
  "grip-carbon-travel-tripod": "Camera Zenit 11 on a tripod.jpg",
  "tactile-pro-mechanical-keyboard": "Mechanical Keyboard.jpg",
  "aurex-pro-noise-cancelling-headphones":
    "Bose QuietComfort 25 Acoustic Noise Cancelling Headphones with Carry Case.jpg",
  "core-portable-gaming-monitor": "Apple computer monitors desk (Unsplash).jpg",
  "terra-ceramic-cookware-set": "Brass pot Bhadi (बाड़ी) 2.jpg",
  "brew-precision-kettle": "Electric kettle philips white.JPG",
  "daylight-5-in-1-reflector":
    "Professionelle Produktfotografie im Fotostudio.jpg",
  "snap-pocket-camera": "PentaxOptioS550.jpg",
  "sweep-robot-vacuum": "Mi Robot Vacuum.jpg",
  "titan-rgb-gaming-mouse":
    "2023 Mysz komputerowa Logitech G903 Lightspeed.jpg",
  "air-sense-smart-purifier": "Xiaomi Smart Air Purifier 25.jpg",
  "lumen-smart-speaker": "Sonos PLAY 1 wireless speaker.jpg",
};

async function fetchByTitle(title) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&titles=" +
    encodeURIComponent(`File:${title}`) +
    "&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1000&format=json&origin=*";
  const pages = await fetchCommons(url);
  return pages?.[0] ?? null;
}

const REJECT = /(logo|icon|diagram|map|chart|graph|poster|cover|book|page|sign|painting|drawing|illustration|screenshot|flag|coat of arms|stamp|banknote|portrait of|drawing of|iconography|logo of)/i;

/** Photos of these things are not product shots - push them down the list. */
const DEMOTE =
  /(sign|exhibition|trade fair|fair|shop window|store|counter|museum|shelf|specification|instruction|manual|diagram of|wiring|circuit|connector|charger|cable|unboxing|packaging|box set|workshop)/i;

/** Titles that suggest a clean product shot - push them up. */
const BOOST =
  /(product|studio shot|isolated|white background|light background|packshot|device|front view|side view|close-?up|new |model\b)/i;

const USER_AGENT =
  "BuyZenDemo/1.0 (https://example.com/buyzen-demo; demo@example.com) node-fetch";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchCommons(url) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });

    if (response.status === 429 || response.status === 503) {
      const wait = 4000 * (attempt + 1);
      console.log(`      rate limited - retrying in ${wait}ms`);
      await sleep(wait);
      continue;
    }
    if (!response.ok) return null;

    const payload = await response.json();
    return payload?.query?.pages
      ? Object.values(payload.query.pages)
      : [];
  }
  return null;
}

async function searchCommons(query, limit = 14) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
    `&gsrsearch=${encodeURIComponent(`filetype:bitmap ${query}`)}` +
    "&gsrnamespace=6&gsrlimit=" +
    limit +
    "&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1000&format=json&origin=*";

  const pages = await fetchCommons(url);
  return pages ?? [];
}

function cleanTitle(title) {
  return title.replace(/^File:/, "").replace(/\.(jpe?g|png|webp)$/i, "");
}

function scoreCandidate(page, prefer) {
  const title = cleanTitle(page.title ?? "");
  if (REJECT.test(title)) return -1;

  const info = page.imageinfo?.[0];
  if (!info?.thumburl) return -1;
  const width = info.width ?? 0;
  const height = info.height ?? 0;
  if (width < 700 || height < 500) return -1;
  // Skip extreme panoramas / very tall scans.
  const ratio = width / Math.max(height, 1);
  if (ratio > 3 || ratio < 0.45) return -1;

  let score = 0;
  const lower = title.toLowerCase();
  for (const keyword of prefer) {
    if (lower.includes(keyword)) score += 10;
  }
  if (BOOST.test(title)) score += 6;
  if (DEMOTE.test(title)) score -= 9;
  // Prefer square-ish hero images.
  score += Math.max(0, 6 - Math.abs(ratio - 1.2) * 4);
  return score;
}

function creditOf(page) {
  const meta = page.imageinfo?.[0]?.extmetadata ?? {};
  const strip = (value) =>
    String(value ?? "")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  return {
    artist: strip(meta.Artist?.value) || "Wikimedia Commons contributor",
    license: strip(meta.LicenseShortName?.value) || "See Wikimedia Commons",
    source: `https://commons.wikimedia.org/wiki/${encodeURIComponent(
      page.title ?? "",
    )}`,
  };
}

async function download(url, destination) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (response.status === 429 || response.status === 503) {
      await sleep(3000 * (attempt + 1));
      continue;
    }
    if (!response.ok) throw new Error(`download failed: ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 4000) throw new Error("image too small");
    writeFileSync(destination, buffer);
    return buffer.length;
  }
  throw new Error("download rate limited");
}

const credits = {};
let ok = 0;
let failed = 0;

for (const [slug, config] of Object.entries(PHOTOS)) {
  try {
    let ranked = [];
    for (const query of config.queries) {
      const candidates = await searchCommons(query);
      await sleep(1200);
      ranked = candidates
        .map((page) => ({ page, score: scoreCandidate(page, config.prefer) }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score);
      if (ranked.length >= 3) break;
    }

    if (ranked.length === 0) {
      console.log(`MISS  ${slug} (no candidate)`);
      failed += 1;
      continue;
    }

    const picked = ranked.slice(0, 3);

    // A hand-picked file always becomes the hero image when it exists.
    const override = OVERRIDES[slug];
    if (override) {
      const page = await fetchByTitle(override);
      await sleep(800);
      if (page?.imageinfo?.[0]?.thumburl) {
        console.log(`      override -> ${override}`);
        picked.unshift({ page, score: 100 });
        const withoutDuplicate = picked.filter(
          (entry, index) =>
            index === 0 || entry.page.title !== page.title,
        );
        picked.length = 0;
        picked.push(...withoutDuplicate.slice(0, 3));
      }
    }

    const paths = [];
    const files = [];

    for (const [index, entry] of picked.entries()) {
      const info = entry.page.imageinfo[0];
      const extension = (info.thumburl.match(/\.(jpe?g|png|webp)/i) ?? [
        ".jpg",
      ])[0].toLowerCase();
      // A content hash in the file name busts the Next.js image optimiser cache
      // whenever a photo changes.
      const hash = createHash("sha1")
        .update(`${entry.page.title}-${info.thumburl}`)
        .digest("hex")
        .slice(0, 6);
      const fileName = `${slug}-${index + 1}-${hash}${extension}`;
      const destination = join(OUT_DIR, fileName);
      try {
        await download(info.thumburl, destination);
        paths.push(`/products/photos/${fileName}`);
        files.push({ path: fileName, ...creditOf(entry.page) });
      } catch {
        /* try the next candidate */
      }
    }

    if (paths.length === 0) {
      console.log(`MISS  ${slug} (download failed)`);
      failed += 1;
      continue;
    }

    credits[slug] = files;
    await prisma.product.update({
      where: { slug },
      data: { image: paths[0], gallery: JSON.stringify(paths) },
    });

    console.log(`OK    ${slug} -> ${paths.length} photo(s)`);
    ok += 1;
  } catch (error) {
    console.log(`ERR   ${slug}: ${error.message}`);
    failed += 1;
  }
}

writeFileSync(
  join(OUT_DIR, "credits.json"),
  JSON.stringify(credits, null, 2),
  "utf8",
);

// Remove photos that are no longer referenced (old file names / replaced picks).
const referenced = new Set(
  Object.values(credits)
    .flat()
    .map((file) => file.path),
);
for (const file of readdirSync(OUT_DIR)) {
  if (file === "credits.json") continue;
  if (!referenced.has(file)) {
    try {
      unlinkSync(join(OUT_DIR, file));
    } catch {
      /* ignore */
    }
  }
}

console.log(`\n${ok} updated, ${failed} failed`);
await prisma.$disconnect();
