# Personal Website — Spec

Owner: Shreyas Suman · Drafted: 2026-10-19 · Target v1: this weekend (2026-10-24/25)

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
- **Above the fold:** name plus a short 2–3 sentence bio paragraph covering interests (security tooling, building things) and what Shreyas is looking for, e.g. "seeking summer 2027 internships". End with the GitHub and LinkedIn icons.
- **Below:** project card grid.
- Footer: socials, © year, link to the site's own source (repo is private, so omit or link the case study instead).

### Projects (`/projects/<slug>/`)
Card grid on the home page → one detail page per project. Each card: title, one-line summary, 2–4 stack tags, thumbnail.

Each detail page has these sections:
1. **Problem → Approach → Result** (short; ~150–300 words total)
2. **My role & team.** What Shreyas personally built. This is critical for hackathon work.
3. **Screenshots / demo GIF.** Strip EXIF, resize, and serve as WebP/AVIF through Hugo image processing.
4. **Stack tags + repo/demo links**

Launch set:
- **TriageLens.** SOC phishing-triage tool from the 2026-10-12 hackathon (Track 1).
- **Sleeper.** https://github.com/shreyassuman2/sleeper. Confirm the repo is public before linking; if it's private, link a demo or screenshots instead.

### Socials
GitHub and LinkedIn only. Use `rel="me noopener"` on external links.

## 3. Design

- **Direction: creative / personal, expressed only through styling.** Every project listed is a code project. The creative side (music, 3D) shows in the typography, color, layout, and small custom touches, such as a hand-made SVG mark or a subtle texture made from the 3D or art work on the site.
- **Motion:** light touches only (CSS transitions, hover states). Respect `prefers-reduced-motion`.
- **Theme:** follows the OS setting via `prefers-color-scheme`, with no toggle and no JS. Define all colors as CSS custom properties with light and dark sets.
- **No JS required** to render any page. The only script is Cloudflare Web Analytics.
- Fonts: self-hosted (WOFF2, subset). No Google Fonts request; this keeps the CSP tight and avoids a third-party request.
- Responsive down to 360px wide. Target Lighthouse ≥ 95 in all four categories.
- **Link previews:** a custom Open Graph image per page, generated at build time with Hugo's `images.Text` / image filters (project title on the site's background). **Stretch goal.** If it isn't done by the weekend, ship one site-wide OG image and add per-page images later.
- Basic SEO: `<title>`, meta description, canonical URL, `sitemap.xml` (Hugo built-in), `robots.txt`.

## 4. Technical stack

| Piece | Choice | Why |
|---|---|---|
| Generator | **Hugo** (extended, pinned version) | Single binary and no npm dependency tree, so the supply-chain risk is smallest |
| Hosting | **Cloudflare Pages** | Free, global CDN, automatic HTTPS, `_headers` file support |
| Registrar + DNS | **Cloudflare Registrar** | Sells at cost, with registrar, DNS, and hosting in one account to secure |
| Analytics | **Cloudflare Web Analytics** | Cookieless, so no consent banner is needed |
| Repo | **Private GitHub repo** | Cloudflare Pages deploys from it on push to `main` |

- Pin the Hugo version in Cloudflare Pages through the `HUGO_VERSION` env var so builds are reproducible.
- Prefer a hand-built theme, or a small vendored theme copied into the repo. Avoid a git-submodule theme, which pulls code you haven't reviewed on every build.

### Repo hygiene (important)
`/Users/shreyas` is itself a git repo. `git status` in this folder shows the whole home directory (`.zsh_history`, `.claude.json`, `Library/`, …).
- Run `git init` inside `~/programming/personal website/` so the site has its **own** repo. Check that `git rev-parse --show-toplevel` prints the site folder.
- Separately, decide whether the home-directory repo was intentional. If it's ever pushed anywhere, it would leak shell history and tokens.
- Add a `.gitignore` covering `public/`, `resources/_gen/`, `.hugo_build.lock`, and `.DS_Store`.
- Consider renaming the folder to `personal-website` (no space) to avoid quoting problems in scripts.

## 5. Security

Most threats to a static personal site come from **account takeover, domain loss, and impersonation**, not from bugs in the code. The spec addresses them in that order.

### 5.1 Accounts
- Cloudflare, GitHub, and the owning Gmail all use **passkeys or hardware keys**. Turn off SMS as a fallback. Store the recovery codes offline.
- The owning email is **personal Gmail** (not school email, which is deleted after graduation).
- Cloudflare: if you use API tokens, scope them narrowly. Don't use the Global API key.
- GitHub: have Cloudflare Pages use the GitHub App with access to **only this repo**, not "all repositories".

### 5.2 Domain
- Register `shreyassuman.com` for **multiple years** with auto-renew on. Set a calendar reminder 60 days before expiry and whenever the card on file expires.
- Keep **registrar lock** on (Cloudflare's default). Cloudflare redacts WHOIS automatically.
- Turn on **DNSSEC** (one click on Cloudflare Registrar).
- Add a **CAA** record that allows only the CA(s) Cloudflare uses, so no one else can be issued a certificate for the domain.
- Redirect `www` → apex, or apex → `www`; pick one canonical host.
- Avoid dangling DNS: if you remove a Pages project or service, delete its CNAME at the same time, so the subdomain can't be taken over.

### 5.3 Anti-spoofing (no email on the domain)
Publish records saying "this domain sends no mail":
```
shreyassuman.com.          TXT  "v=spf1 -all"
_dmarc.shreyassuman.com.   TXT  "v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s"
shreyassuman.com.          MX   0 .          ; null MX (RFC 7505)
*._domainkey.shreyassuman.com. TXT "v=DKIM1; p="
```

### 5.4 HTTPS & headers (`static/_headers` → Cloudflare Pages)
- Cloudflare SSL mode **Full (strict)**, *Always Use HTTPS* on, minimum TLS 1.2.
- HSTS: `max-age=63072000; includeSubDomains; preload`. Submit to hstspreload.org **only after** confirming every subdomain serves HTTPS, because preload is hard to undo.
- Headers on `/*`:
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; connect-src 'self' https://cloudflareinsights.com; img-src 'self' data:; style-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'; object-src 'none'; upgrade-insecure-requests
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
Cross-Origin-Opener-Policy: same-origin
```
- No inline `<script>` or `style=""` attributes. Hugo templates must put all CSS in files, so `style-src 'self'` holds. Check that Hugo's generated HTML (e.g. syntax highlighting) doesn't emit inline styles. Use `markup.highlight.noClasses = false`.
- Target: **A+** on securityheaders.com and on the Mozilla HTTP Observatory.
- Preview deploys (`*.pages.dev`) are public. Add Cloudflare Access to them, or accept that drafts can be seen there.

### 5.5 Content & privacy
- Strip EXIF/GPS from every image before committing (`exiftool -all= file`). Hugo re-encoding also removes it, but originals in the repo keep it.
- Screenshots: check for visible tokens, emails, internal URLs, and terminal history, especially in TriageLens SOC screenshots and sample phishing data.
- Never commit `.env` files or API keys. The site needs none.

## 6. Deployment flow

1. `git push` to `main` → Cloudflare Pages builds with `hugo --minify` → deploys to production.
2. Other branches → preview URL.
3. After launch, check: securityheaders.com, Mozilla HTTP Observatory, SSL Labs (A+), Lighthouse, link preview in LinkedIn Post Inspector, and that DMARC/SPF records resolve (`dig TXT _dmarc.shreyassuman.com`).

## 7. Weekend plan

**Saturday**
- [ ] Check `shreyassuman.com` availability and register it on Cloudflare (multi-year, auto-renew, DNSSEC).
- [ ] Set up passkeys on Gmail, Cloudflare, and GitHub.
- [ ] Create a new private GitHub repo and `git init` in the site folder; `hugo new site`.
- [ ] Base layout, CSS tokens for light and dark, home page with bio and project grid.

**Sunday**
- [ ] TriageLens and Sleeper detail pages (write-up, role, screenshots, stack).
- [ ] `_headers`, `robots.txt`, favicon, site-wide OG image.
- [ ] Connect Cloudflare Pages, add the custom domain, set SSL to Full (strict), add CAA records and null-mail DNS records.
- [ ] Turn on Web Analytics. Run the verification checklist in §6.

**Later**
- [ ] Per-page generated OG images.
- [ ] HSTS preload submission (after ~1 week with no problems).
- [ ] Resume PDF (optional) and blog section (optional).

## 8. Open questions
- Is `shreyassuman.com` available? If not, the fallback is `shreyassuman.dev`, since the .dev TLD forces HTTPS for the whole domain.
- Is the Sleeper repo public?
- Bio wording and the internship timeframe to mention.
