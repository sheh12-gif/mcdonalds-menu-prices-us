# Performance & Technical SEO Audit

**Target:** `https://mcdonaldsmenu-prices.us/`
**Audit basis:** the PageSpeed Insights snapshot supplied with this task, plus inspection of the checked-out repository on `arena/cbd1e987-mcdonalds-menu-prices-us`.
**Baseline run:** Lighthouse 13.5.0, Moto G Power emulation, Slow 4G, Oct 24, 2026.

## Executive summary

The supplied score is **87/100**. The two weak Core Web Vitals-related paint metrics are **FCP 3.1 s** and **LCP 3.1 s**. **TBT is already 0 ms** and **CLS is 0.011**, so the primary opportunity is the critical rendering path and image selection—not reducing JavaScript execution at any cost.

The PSI report identifies the main causes:

1. **Render-blocking external assets:** the Tailwind CDN script transfers 124.1 KiB and takes about 780 ms; Google Fonts adds a blocking CSS request and a 48.1 KiB font, with a reported critical-path latency of 1,247 ms. PSI estimates up to **2,150 ms** of render-blocking savings.
2. **Oversized image candidates:** WebP is a good format, but several source files have far more pixels than the card displays. The image audit estimates **127 KiB** of savings.
3. **The first featured image is marked lazy:** the first image that may be visible near the initial viewport should not wait on lazy-load heuristics.
4. **A layout read/write sequence forces reflow:** the category-pill handler changes classes and then reads element geometry; the initial slider measurement also followed a large `innerHTML` update.
5. **Seven-day cache lifetime:** this primarily affects repeat visits; PSI estimates around 20 KiB of opportunity. The correct fix belongs in the CDN/hosting configuration, not HTML.

The code changes on this branch address items 1–4 while retaining the page’s sections, design tokens, menu content, and behavior. The actual PageSpeed score has **not** been remeasured after the changes; a post-deployment run is required before claiming the site is above 90 or that FCP/LCP are green.

## Baseline metrics and targets

| Metric | Supplied result | Good/target range | Assessment |
| --- | ---: | ---: | --- |
| Performance score | 87 | 90+ requested | Just below the requested target |
| First Contentful Paint | 3.1 s | ≤ 1.8 s | Needs improvement |
| Largest Contentful Paint | 3.1 s | ≤ 2.5 s | Needs improvement |
| Speed Index | 3.2 s | Lower is better | Consistent with late initial rendering |
| Total Blocking Time | 0 ms | ≤ 200 ms | Already excellent |
| Cumulative Layout Shift | 0.011 | ≤ 0.1 | Already excellent |

These are Lighthouse lab results for one simulated device/network profile. Scores vary between runs; CrUX field data was not included in the supplied report.

## Findings in the repository

### 1. Tailwind CDN was on the critical path — highest priority

The document loaded `https://cdn.tailwindcss.com` synchronously in the head and configured Tailwind at runtime. That forces a browser-side script to download, execute, inspect the page, and generate styles before the design is fully styled. PSI measured 124.1 KiB and about 780 ms for this request.

**Change made:** Tailwind is now compiled at build time to a local, minified `styles.css`. The output is 26,435 bytes (about 5.7 KiB when gzip-compressed) and contains only classes found in the page. The runtime CDN script and inline Tailwind configuration were removed. Tailwind is pinned as a development-only dependency; it is not shipped as runtime JavaScript.

### 2. Google Fonts introduced a cross-origin request chain

The page already had preconnect hints, but the Google Fonts stylesheet still had to be fetched before the browser discovered the WOFF2 file. The supplied report shows a 1.54 KiB CSS request, a 48.09 KiB font, and a 1,247 ms maximum critical path.

**Change made:** Inter is self-hosted as a 48,256-byte variable WOFF2 file. It uses `font-display: swap`; a low-priority same-origin preload starts the fetch early without blocking fallback text. The Google Fonts CSS and preconnects were removed. The Inter typeface and existing Tailwind font stack are preserved.

### 3. Product images were sent at larger dimensions than their display size

The PageSpeed audit specifically identifies the 768×768 10-piece McNuggets image and several 442–547 px wide product photos as oversized for card images displayed around 144 CSS px high. WebP alone does not solve responsive sizing.

**Change made:** responsive WebP `srcset` candidates and matching `sizes` were added for the eight featured images identified in the PSI image/cache audits: McNuggets, Big Mac, Quarter Pounder, Spicy McCrispy, Egg McMuffin, iced coffee, Sausage Burrito, and Ranch Snack Wrap. Appropriate intrinsic `width`/`height` values are supplied for these variants. The two wide Spicy McNuggets photos added previously were also reduced to 900×401 and now weigh about 43 KiB and 39 KiB, respectively.

The original supplied size-specific nugget assets remain intact. Browser-selected candidate size varies by viewport and device pixel ratio, so confirm actual transfer savings in the next PSI run.

### 4. Lazy loading and priority for the first featured image

The card renderer applied `loading="lazy"` to every product image. Lazy loading is appropriate for the long menu, but can delay an image that participates in initial rendering.

**Change made:** the first Featured Favorites image is marked `loading="eager"` and `fetchpriority="high"`; remaining product images stay lazy-loaded. This is a conservative likely-LCP choice, not a claim that PSI identified that exact image as the LCP element. The provided excerpt did not include the “Largest Contentful Paint element” diagnostic. If the next report identifies a different LCP element, move priority to that resource and avoid prioritizing multiple images.

### 5. Forced reflow in the category bar

The category-pill handler changed button classes before reading `offsetLeft` and `clientWidth`; the slider also reads `scrollWidth`/`clientWidth` after menu rendering. PSI attributed about 160 ms of reflow time to the page.

**Change made:** the active pill geometry is read before class changes; scrolling is applied after batched class updates. On initial DOM ready, the static category-bar geometry is read before the menu wrapper’s `innerHTML` update. This should avoid the avoidable synchronous layout in those flows. Reflow was unscored and was not the main 3.1-second paint bottleneck.

### 6. Cache lifetime is a hosting/CDN setting

PSI reports a seven-day TTL for first-party images and estimates about 20 KiB of repeat-visit savings. This is not a first-visit FCP fix.

**Deployment recommendation:** for content-hashed/versioned CSS, fonts, and images, serve `Cache-Control: public, max-age=31536000, immutable`. Serve HTML with short caching or revalidation (`no-cache`/ETag) so updates are visible. If Webflow or the current host controls headers, configure this there; do not apply a one-year immutable policy to unchanged filenames unless each asset update also changes its URL.

### 7. Dynamic rendering and deployment ownership

The menu’s 220 cards are assembled by inline JavaScript after DOM ready. TBT is 0 ms, so a complete rewrite is not justified for this request. Longer term, server-rendering or statically pre-rendering at least the hero and first Featured Favorites row would make the first content available without waiting for the menu renderer and help crawlers that do not execute JavaScript.

The checked-out repository contains a static `index.html`, not a Webflow project/export or visible deployment configuration. The production effect of these changes depends on Webflow/hosting publishing this repository’s files, including the new `styles.css` and `fonts/` directory. Confirm the actual publish path before treating a repository change as live.

## Implemented files and build instructions

- `index.html` — local stylesheet/font links, responsive image candidates, first-image priority, and batched category-bar geometry reads/writes.
- `styles.css` — generated production stylesheet.
- `src/tailwind.css` and `tailwind.config.js` — reproducible Tailwind input and configuration, using the existing custom colors/shadows/font family.
- `package.json` and `package-lock.json` — pinned CSS build tooling.
- `fonts/inter-latin-wght-normal.woff2`, `fonts/OFL.txt`, and `fonts/README.md` — self-hosted Inter font and license.
- `images/*-160.webp`, `*-240.webp`, `*-320.webp`, `*-432.webp`, and `*-480.webp` — responsive derivatives for the featured image candidates.

Rebuild the stylesheet with:

```sh
npm ci
npm run build:css
```

The generated stylesheet is checked in, so a static host does not need Node.js during deployment.

## Validation performed

- `npm run build:css` succeeds.
- JavaScript and Tailwind config syntax checks pass; JSON-LD parses as valid JSON.
- Confirmed the page no longer references Tailwind CDN or Google Fonts runtime URLs.
- A VM render check confirms 15 categories, 220 menu cards, 209 cards with valid image paths and non-empty alt text, and no blank image placeholders. All generated `src`/`srcset` candidates exist; exactly one featured image is eager/high priority.
- The WebP assets in `images/` are below 100 KiB each; the new wide spicy images are each below 44 KiB.
- `npm audit` reported zero vulnerabilities after pinning the CSS build tooling; `git diff --check` passes.

No Chromium/Lighthouse binary is available in this workspace, so the modified page could not be subjected to a matching Moto G Power / Slow 4G run here.

## Next steps to confirm the goal

1. Publish this branch’s static output through the actual Webflow/hosting pipeline: `index.html`, `styles.css`, `fonts/`, and `images/` must all be deployed together.
2. Re-run PageSpeed Insights with the same mobile settings. Check that Tailwind CDN and Google Fonts requests are gone and that image transfers use the responsive candidates.
3. Review the full LCP diagnostics. If the LCP element is an image other than the first featured photo, move `fetchpriority="high"` to that one resource; consider a preload only after that resource is confirmed.
4. Target **FCP ≤ 1.8 s**, **LCP ≤ 2.5 s**, and a performance score **above 90**. If the score remains below 90, inspect the new waterfall and LCP breakdown before making further changes.
5. Configure long-lived cache headers for versioned static assets at the host/CDN.
