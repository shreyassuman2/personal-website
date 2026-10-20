# Personal Website — Spec

Owner: Shreyas Suman · Drafted: 2026-10-19 · Last updated: 2026-10-19 (end of session 1)

## 0. Status / handoff

**Where things stand**
- Site is built (Hugo, hand-written theme) and pushed to the private repo `github.com/shreyassuman2/personal-website`, branch `main`. Latest pushed commit: `5b722ed` (taste-skill install). Nothing is deployed yet.
- Domain `shreyassuman.com` is registered on Cloudflare. Nameservers, registrar lock, DNSSEC and the null-mail records (§5.3) are all live and verified with `dig`.
- Local preview: `hugo server` from the project root → http://localhost:1313 (live reload; `_headers` is not applied locally).

**Design decision (2026-10-19): keep the original v1 design.** Two redesigns were built and rejected by the user: a taste-skill "split stage" (orange, Imbue, sticky photo half) and a terminal/CRT look (green mono, scanlines). The user found both ugly and asked to go back to v1. Both are saved in `git stash` ("terminal + split-stage redesigns"). Don't propose either again; any future design change should be small tweaks to v1, asked about first.

**Deploy steps (after the redesign is approved)**
1. Cloudflare → Workers & Pages → Create → Pages → Connect to Git, GitHub App scoped to **only** `personal-website`.
2. Build command `hugo --gc --minify`, output `public`, env var `HUGO_VERSION=0.168.0`.
3. Custom domains: `shreyassuman.com` and `www.shreyassuman.com`; redirect `www` → apex.
4. Then: SSL Full (strict), Always Use HTTPS, CAA records (Cloudflare adds its own CAs once any CAA exists), Web Analytics token → `cfBeaconToken` in `hugo.toml`, run the checklist in §6.

**Still needed from the user**
- Confirm the TalosAI "My role" text (it came from hackathon notes, not the repo): malware lead, co-owned prompts, built the first triage backend, ran the accuracy evals.
- OK from teammate Enrique Mowad, whose name shows in the TalosAI screenshots' sidebar (optional).
- Optionally a still screenshot of Sleeper's results for its card (the GIF's first frame is a faded empty state).

## 1. Goals

- **Primary audience: internship recruiters.** A technical screener should understand who Shreyas is and what they have built within ~30 seconds.
- Show personal projects in depth, and link to GitHub and LinkedIn.
- Run on a custom domain, `shreyassuman.com`, with strong security defaults. Running cost is the domain only (~$10–15/yr).

### Out of scope for v1

- Resume (skipped for now; LinkedIn covers it). If it's added later, publish a PDF without phone number or home address.
- Blog. Not planned. Hugo makes it easy to add later as a new content section.
- Contact form and email on the domain. Contact is through socials only.
- Separate music/3D sections, audio players, and WebGL.

## 2. Content

### Home page (`/`)
- **Bio (user-approved, keep exactly):** one sentence, "Incoming freshman at Santa Clara University studying Computer Science and Engineering." Do not add an internship line; the user removed it on purpose.
- Name, bio, GitHub (and LinkedIn once the URL exists), then the projects.
- Footer: © year, GitHub/LinkedIn. The repo is private, so no source link.

### Projects
- Section page at `/projects/` titled **"Projects"** (renamed from "Selected work"/"Work" at the user's request; nav link and "← All projects" back link match). The home page section heading is still "Selected work".
- One page bundle per project in `content/projects/<slug>/` with front matter: `title, kicker, date, weight, summary, role, team, stack[], repo, demo, cover, coverAlt`. Screenshots go in the bundle and are placed with the `{{< shot src alt caption >}}` shortcode.
- `content/projects/_index.md` sets `cascade.build.publishResources: false`, so original PNGs are never published; only resized WebP (which also strips EXIF) and the GIF actually referenced go out.
- Each page: Problem → Approach → Result, My role, screenshots, stack tags, repo/demo links.

Launch set:
- **TalosAI** (the hackathon project's final name; it was called TriageLens during planning). Repo `shreyassuman2/soc-phish-triage` (public), live demo `https://rise-riff-67930737.figma.site`. CrowdStrike × AIC Hackathon, 2026-10-12, 4-person team. Screenshots used: `2-phishing-trap.png` (cover), `1-alert-critical.png`, `3-ransomware.png`. The dashboard screenshot was dropped because browser-extension icons show on its edge.
- **Sleeper.** Repo `shreyassuman2/sleeper` (public), live `https://sleeper-pick.vercel.app/`. Solo. Cover is `demo.gif` from the repo.

### Socials
GitHub (`https://github.com/shreyassuman2`) and LinkedIn (URL pending). Use `rel="me noopener"` on external links.

## 3. Design

Current (v1 layout, dark restyle 2026-10-19): same layout as v1, restyled with small changes only. Dark only (`#0a0a0a` ground, `#eaeaea` ink, one red accent `#ff2a2a`, one green `>` prompt). Fonts: Inter 800 uppercase for the name and page titles (home, Projects, 404); IBM Plex Mono for project titles, labels, nav, tags; Space Grotesk 600 for prose headings (Problem/Approach/Result); system sans for body. Square corners, no grain. User-approved; change only on request.

Fixed requirements regardless of look:
- **Creative / personal, expressed only through styling.** Only code projects are listed; music/3D shows up in the look, not as content.
- **Theme:** dark only (user's choice, replaces the earlier follow-the-OS rule). All colours as CSS custom properties.
- Pages render fully without JS. The only third-party script allowed is Cloudflare Web Analytics.
- Self-hosted fonts (WOFF2). No Google Fonts request.
- Responsive down to 360px. Target Lighthouse ≥ 95 in all four categories.
- **Link previews (done):** per-page OG image generated at build time in `layouts/_partials/og-image.html` from `assets/og/base.png` plus `images.Text` with `assets/og/InstrumentSerif-Regular.ttf`. Update its colours/font if the redesign changes them.
- SEO (done): title, description, canonical, `sitemap.xml`, `robots.txt`. Taxonomies and RSS are disabled in `hugo.toml`.

## 4. Technical stack

| Piece | Choice | Notes |
|---|---|---|
| Generator | **Hugo v0.168.0 extended** | Binary at `~/.local/bin/hugo` (checksum verified, Apple-notarized). Uses the new template layout: `layouts/baseof.html`, `home.html`, `section.html`, `page.html`, `404.html`, `_partials/`, `_shortcodes/` |
| Hosting | **Cloudflare Pages** | Not connected yet; see §0 |
| Registrar + DNS | **Cloudflare Registrar** | Done |
| Analytics | **Cloudflare Web Analytics** | `cfBeaconToken` param in `hugo.toml`; the beacon script only renders when set |
| Repo | **Private GitHub repo** `shreyassuman2/personal-website` | |

Key files: `hugo.toml`, `assets/css/main.css` (minified, fingerprinted, SRI), `layouts/_partials/{head,header,footer,card,img,og-image}.html`, `layouts/_shortcodes/shot.html`, `static/_headers`, `static/favicon.svg`, `static/fonts/`.

Config notes: `locale` (not `languageCode`), `[imaging.webp] quality` (top-level `imaging.quality` is deprecated in 0.163+), `markup.highlight.noClasses = false` for the CSP.

### Repo and git (done)
- The old git repo at `/Users/shreyas` (home directory) was **deleted** (it only held a README commit). The site has its own repo.
- Global and local git identity: `shreyassuman2 <338907229+shreyassuman2@users.noreply.github.com>`. `gh` is logged in as `shreyassuman2`.
- `http.postBuffer` is raised to 50 MB in this repo's config; pushes with images failed with HTTP 400 without it.
- `.gitignore`: `.DS_Store`, `public/`, `resources/_gen/`, `.hugo_build.lock`, `.env*`. `.taste-skill/` (the skill's working files and screenshots) is ignored too.
- `.claude/skills/design-taste-frontend/` and `skills-lock.json` are committed (installed with `npx skills@1.7.2 add Leonxlnx/taste-skill -a claude-code`). Hugo never publishes them.
- Folder name still has a space (`personal website`); quote paths in shell commands. Watch zsh: unquoted `?` in `gh api` URLs globs, and `set -- $var` doesn't word-split.

## 5. Security

Most threats to a static personal site come from **account takeover, domain loss, and impersonation**, not from bugs in the code.

### 5.1 Accounts
- Cloudflare, GitHub, and the owning Gmail all use **passkeys**. No SMS fallback. Recovery codes stored offline.
- The owning email is **personal Gmail**.
- Cloudflare API tokens, if any, scoped narrowly. Never the Global API key.
- Cloudflare Pages' GitHub App gets access to **only this repo**.

### 5.2 Domain (verified 2026-10-19)
- ✅ Registered at Cloudflare, nameservers `scott`/`susan.ns.cloudflare.com`, `client transfer prohibited` (registrar lock).
- ✅ DNSSEC active (DS record in `.com`, resolvers validate).
- ⚠️ Registered for **1 year**, expiring **2027-10-20**. Keep auto-renew on; reminder set for 2027-08-20.
- ⏳ CAA records: add after Pages is connected.
- ⏳ Redirect `www` → apex.
- Avoid dangling DNS: when removing a Pages project or service, delete its DNS record at the same time.

### 5.3 Anti-spoofing (✅ live and verified)
```
shreyassuman.com.          TXT  "v=spf1 -all"
_dmarc.shreyassuman.com.   TXT  "v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s"
shreyassuman.com.          MX   0 .          ; null MX (RFC 7505)
*._domainkey.shreyassuman.com. TXT "v=DKIM1; p="
```

### 5.4 HTTPS & headers (`static/_headers`, written; applies once on Cloudflare Pages)
- Cloudflare SSL mode **Full (strict)**, *Always Use HTTPS* on, minimum TLS 1.2.
- HSTS preload: submit to hstspreload.org only after about a week live with every subdomain on HTTPS.
- Headers on `/*`:
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; connect-src 'self' https://cloudflareinsights.com; img-src 'self' data:; style-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'; object-src 'none'; upgrade-insecure-requests
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
Cross-Origin-Opener-Policy: same-origin
```
- Also: `/css/*` cached 1 year immutable (fingerprinted), `/fonts/*` cached 30 days.
- The current build has **no inline styles or scripts** (checked with grep over `public/`). Re-check after the redesign: `grep -rlE 'style=|<script>' public --include='*.html'`.
- Target **A+** on securityheaders.com and Mozilla HTTP Observatory.
- `*.pages.dev` preview deploys are public; add Cloudflare Access or accept that.

### 5.5 Content & privacy
- Only resized WebP copies of screenshots are published (EXIF stripped by re-encoding); originals stay in the private repo.
- Screenshots were checked: demo data only (`.example` domains, lab-generated alerts). A teammate's name is visible (see §0).
- Never commit `.env` files or API keys. The site needs none.

## 6. Deployment flow & launch checklist

1. `git push` to `main` → Cloudflare Pages builds `hugo --gc --minify` → production.
2. Other branches → preview URL on `*.pages.dev`.
3. After launch, check: securityheaders.com, Mozilla HTTP Observatory, SSL Labs (A+), Lighthouse, link preview in LinkedIn Post Inspector, `dig TXT _dmarc.shreyassuman.com`, `www` redirect, 404 page.

## 7. Progress

- [x] Register `shreyassuman.com` (1 year, auto-renew), registrar lock, DNSSEC
- [x] Null-mail DNS records
- [x] Private repo, own git identity, home-dir repo removed
- [x] Hugo installed and site scaffolded
- [x] Layouts, CSS tokens (light/dark), home page, Projects page, TalosAI and Sleeper pages, 404
- [x] `_headers`, `robots.txt`, sitemap, favicon, per-page OG images
- [x] taste-skill installed and committed
- [x] Redesign tried twice (taste-skill split stage, terminal/CRT); user rejected both and kept v1
- [x] LinkedIn URL (https://www.linkedin.com/in/shreyas-suman-ba9691355/)
- [x] Connect Cloudflare Pages, custom domain, `www` → apex redirect (Redirect Rule, 301), SSL Full (strict), Always Use HTTPS, min TLS 1.2, CAA (verified 2026-10-19; Mozilla Observatory A+ 130/130, cert from Google Trust Services)
- [ ] Web Analytics token
- [x] Launch checklist (§6), except LinkedIn Post Inspector
- [ ] HSTS preload: submit at hstspreload.org on or after 2026-10-26
- [ ] Later, optional: resume PDF, blog section

## 8. Open questions
- Confirm the TalosAI role wording.
