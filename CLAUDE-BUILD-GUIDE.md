# OpenSpace — Build & Integration Guide for Claude

You are being handed a complete, working system. This folder contains every file.
Your job is one of three tasks — identify which one the user wants:

- **Task A — Install into a static HTML site** (plain .html files, hosted on Vercel)
- **Task B — Install into a Next.js site** (hosted on Vercel)
- **Task C — Rebuild or extend the system** (use the Architecture section)

Do not rewrite files that already exist in this kit. Copy them. Only write new code
when extending functionality.

---

## What this system is

OpenSpace is a login-gated, in-browser visual CMS ("like Wix/Squarespace") that
overlays a live site. Editors click text to edit it, click images/videos to replace
them, drag sections to reorder, insert block templates, adjust styles/filters/
animations, and Save (private draft) or Publish (instantly live — no rebuild).

It is serverless: five tiny Vercel Functions + Vercel Blob storage. No database,
no framework, no build step. The public site stays static; published edits are
Blob overrides served in front of the repo's files.

## The 3 environment variables (Vercel)

Set these in the Vercel project → **Settings → Environment Variables** (all three
scopes: Production, Preview, Development):

| Name | Value | Notes |
|---|---|---|
| `EDITOR_PASSWORD` | any password the user chooses | Plaintext compare (single-user). This is what they type at `/admin` |
| `SESSION_SECRET` | long random string | Generate: `openssl rand -hex 32`. Signs session cookies (HMAC-SHA256) |
| `BLOB_READ_WRITE_TOKEN` | copy from the store | Vercel's newer connect flow adds `BLOB_STORE_ID` instead of this token. Create the store (**Public** access!), open it → Quickstart → **.env.local** tab, copy the `BLOB_READ_WRITE_TOKEN` value, and add it manually. The code also accepts any `*BLOB_READ_WRITE_TOKEN`-suffixed name |

After adding env vars, **redeploy** (env changes don't apply to existing deployments).

## Task A — static HTML site

1. Copy into the target repo root, preserving paths:
   ```
   api/            (all 8 files)
   admin/index.html
   assets/editor.js
   vercel.json     (merge "rewrites" if one exists)
   package.json    (or add "@vercel/blob": "^0.23.4" to dependencies)
   ```
2. Env vars + Blob store (table above).
3. Deploy. Editor = `https://site.com/admin/`. Every `.html` page is editable.

The `install.sh` in this folder automates step 1: `./install.sh /path/to/site`

## Task B — Next.js site

1. Copy:
   ```
   api/_lib.js api/login.js api/upload.js api/content.js api/pages.js → pages/api/
   admin/index.html   → public/admin/index.html
   assets/editor.js   → public/assets/editor.js
   integrations/nextjs/OpenSlot.jsx → components/OpenSlot.jsx
   ```
   (`pages/api` works even in App Router projects — hybrid is supported.
   Do NOT copy serve.js or vercel.json into a Next.js project.)
2. `npm i @vercel/blob`
3. Env vars + Blob store (table above).
4. Mark editable regions in the user's pages:
   ```jsx
   import OpenSlot from '@/components/OpenSlot';
   <OpenSlot name="hero"><h1>Default content</h1></OpenSlot>
   ```
   `name` unique per page. Children render until an edit is published.
5. Editing flow: `/admin/index.html` → login → sidebar **"Edit a URL (slots)"** →
   enter the path (`/`, `/about`). Slot regions show green labels.

`./install.sh /path/to/next-app --nextjs` automates step 1.

## Task C — architecture (for rebuilding or extending)

### Files

| File | Role |
|---|---|
| `api/_lib.js` | Shared: HMAC session cookies (sign/verify/timing-safe), password check, Blob read/write/delete helpers, body reader, `PAGE_NAME_RE` |
| `api/login.js` | POST {password} → sets cookie; DELETE → clears it |
| `api/pages.js` | Auth-gated page CRUD. GET: list pages / read draft/published HTML / `?history=` version list. POST actions: `save`, `publish`, `restore`, `discard-draft`, `revert`, `create`, `delete`. Saves auto-snapshot history (25 kept, ≥1min apart) |
| `api/serve.js` | PUBLIC. Serves every page request: published Blob override → fallback to repo file. Wired by vercel.json rewrites |
| `api/upload.js` | Auth-gated media. POST raw body `?name=` → Blob `media/`; GET lists library; DELETE removes |
| `api/social.js` | Social & Links manager: profile list stored at `config/social.json` in Blob; 'apply' rewrites the header/footer anchor blocks of every page server-side. NOTE: its regexes target the `.h-right`/`.h-book`/`.f-social` class names — adapt `applyToHtml()` if the site's markup differs |
| `api/health.js` | PUBLIC setup-status booleans (env vars present? Blob working?) — drives the Studio's onboarding checklist and missing-env login guidance |
| `api/content.js` | Slot mode for framework sites. Draft/published JSON per path key. GET is public + CORS for hydration |
| `admin/index.html` | The Studio shell: login, page list w/ status pills, iframe artboard, device widths, save-state indicator, autosave (3s debounce), toasts, ⌘K palette, History modal, SEO modal, "Edit a URL" slot mode |
| `assets/editor.js` | The overlay editor injected into the iframe (~1k lines). All editor UI carries `data-ospace` |
| `integrations/nextjs/OpenSlot.jsx` | React client component: renders children as default, fetches published slot JSON and swaps in HTML |

### Blob data model
```
pages/draft/<page>.html         working copy
pages/published/<page>.html     what serve.js delivers
pages/history/<page>/<ts>       snapshots (restore → draft)
content/draft/<key>.json        slot JSON per path ("/" → "index", "/a/b" → "a__b")
content/published/<key>.json
media/<timestamp>-<filename>    uploads (public CDN URLs)
```

### Editor ⇄ shell protocol (postMessage)
- shell → editor: `ospace-get-html`, `ospace-undo`, `ospace-redo`, `ospace-seo {title,description}`, `ospace-find`
- editor → shell: `ospace-dirty` (any change), `ospace-html {html}` (serialized full page), `ospace-slots {slots, html}` (slot pages)
- The shell loads a page via `fetch` → injects `<script src="/assets/editor.js">` before `</body>` → sets `iframe.srcdoc`. Same-origin, so the shell can also read `frame.contentDocument` (used by SEO modal).

### Editor internals worth knowing
- **Serializer** clones `documentElement`, removes `[data-ospace]` nodes, editor
  classes (`ospace-*`), `contenteditable`/`draggable` attrs. Anything the editor adds
  that must SHIP (the scroll-animation runtime `#ospace-anim-css` / `#ospace-anim-js`)
  uses ids, not `data-ospace`, and is kept only while `[data-anim]` elements exist.
- **Undo** = full-body innerHTML snapshot stack (80 deep). After any `restore`,
  `bindAll()` re-appends persistent UI nodes and re-binds grid drag handlers.
- **Section detection**: an element's top-level ancestor directly under `<body>`
  (`SECTION/HEADER/FOOTER/DIV/MAIN`). Section rail = drag handle (HTML5 DnD),
  move up/down, duplicate, style, delete; hover also shows the green
  "+ Add section" lines at the section's top/bottom edges.
- **Entrance animations**: `data-anim="fade-up|fade-in|slide-left|slide-right|zoom"`;
  runtime is a ~20-line IntersectionObserver + keyframes, injected into the page
  itself so published sites animate with zero dependencies. Respects
  `prefers-reduced-motion`.
- **Slot mode**: if the loaded page contains `[data-ospace-slot]`, `ospace-get-html`
  responds with `ospace-slots` and the shell saves to `/api/content` instead of
  `/api/pages` (only when opened via "Edit a URL").

### Security model
- Single editor role. Password compared via SHA-256 digests + `timingSafeEqual`.
- Cookie: `ospace_session`, HMAC-signed payload with 7-day expiry, HttpOnly,
  SameSite=Lax, Secure on Vercel.
- Every mutating endpoint calls `requireAuth`. Public surface: `serve.js`,
  `content.js` GET (published only; drafts require auth), login POST.
- Upload allowlist by extension, 50MB cap.

### Local development
Static preview works with any file server, but APIs need `vercel dev`:
```bash
npm i -g vercel && vercel link && vercel env pull && vercel dev
```

### Verification checklist after any install (do these, don't assume)
1. `/admin/` shows the login card; wrong password shakes, right one enters.
2. Page list renders with status pills; selecting a page loads it in the artboard.
3. Click a heading → orange outline + "Heading 1" badge + right panel.
4. Double-click → in-place editing; type; save-state turns amber then autosaves.
5. Upload an image replacement → it swaps and appears in the media library.
6. Publish → open the public URL in an incognito tab → the edit is live.
7. History → versions listed → Restore returns an older draft.
8. (Next.js) `OpenSlot` page shows defaults; publish a slot edit; refresh shows it.

### Known gotchas
- `vercel.json` rewrites route ALL `*.html` through serve.js — filesystem assets
  (`/assets/*`, `/admin/*`) still win because Vercel checks the filesystem first.
- `serve.js` needs `includeFiles: "*.html"` (already in vercel.json) to read the
  repo's fallback pages at runtime.
- Editing a page that itself sets `X-Frame-Options` will fail in the iframe —
  don't add that header to editable pages.
- The `srcdoc` iframe has no URL; relative links resolve via the injected
  `<base>` only in URL/slot mode. Static mode pages use relative asset paths
  that resolve against the admin origin — fine on the deployed site.
- After changing env vars on Vercel: redeploy, or the functions keep old values.
