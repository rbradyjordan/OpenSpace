# Integrating OpenSpace into any site

OpenSpace is portable. Two modes:

| Mode | For | How pages are edited |
|---|---|---|
| **Static** | Plain HTML sites on Vercel (like this one) | Whole page — the published override replaces the file |
| **Slots** | Next.js / React / any framework site | Marked regions (`data-ospace-slot`) — content JSON hydrated by the app |

The fastest path is the installer:

```bash
./install.sh /path/to/other-site            # static HTML site
./install.sh /path/to/next-app --nextjs     # Next.js app
```

Everything below is what the installer does, spelled out.

---

## A. Static HTML site (exact copy of this setup)

1. **Copy these files** into the target repo, same paths:
   ```
   api/_lib.js  api/login.js  api/pages.js  api/upload.js  api/serve.js  api/content.js
   admin/index.html
   assets/editor.js
   vercel.json          (or merge its "rewrites" into an existing one)
   package.json         (or add "@vercel/blob" to dependencies)
   ```
2. **Vercel setup** (one time, ~2 minutes):
   - Storage → Create **Blob** store → Connect (adds `BLOB_READ_WRITE_TOKEN` automatically)
   - Settings → Environment Variables → add `EDITOR_PASSWORD` and `SESSION_SECRET`
3. Deploy. Editor lives at **`/admin/`**. Done — every `.html` file in the repo is now editable.

## B. Next.js site (slots mode)

1. **Copy these files:**
   ```
   api/_lib.js api/login.js api/upload.js api/content.js  →  pages/api/   (works with App Router too)
   admin/index.html                                        →  public/admin/index.html
   assets/editor.js                                        →  public/assets/editor.js
   integrations/nextjs/OpenSlot.jsx                         →  components/OpenSlot.jsx
   ```
2. `npm i @vercel/blob`
3. Same Vercel setup as above (Blob store + the two env vars).
4. **Mark editable regions** in any page/component:
   ```jsx
   import OpenSlot from '@/components/OpenSlot';

   <OpenSlot name="hero">
     <h1>Default headline</h1>
     <p>This shows until an edit is published.</p>
   </OpenSlot>

   <OpenSlot name="pricing-blurb" as="section" className="prose">
     <p>Default pricing copy…</p>
   </OpenSlot>
   ```
   Rules: `name` must be unique per page. The default children render until
   someone publishes an edit; after that the published HTML replaces them.
5. **Edit**: open `/admin/index.html`, log in, click **“Edit a URL (slots)”**
   in the sidebar, type the page path (e.g. `/` or `/about`). Slot regions
   get green labels; edit them like any page, then Save / Publish.

### How slots flow

```
Editor (admin iframe)                    Your Next.js app
  edits [data-ospace-slot] regions            <OpenSlot name="hero">
  Save  → POST /api/content (draft)          fetches GET /api/content?path=/
  Publish → copies draft → published         swaps in published HTML
```

Content is stored in Vercel Blob as JSON per path (`content/published/<path>.json`).
`GET /api/content` is public + CORS-open, so one OpenSpace deployment can even
serve content to other domains if you point `OpenSlot`'s fetch at it.

## Security notes

- All write APIs require the session cookie (login with `EDITOR_PASSWORD`).
- Sessions are HMAC-signed with `SESSION_SECRET`, 7-day expiry, HttpOnly.
- `/admin` is `noindex` and safe to leave at the default path, or rename the folder.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Login says "Can't reach the server" | API routes not deployed — check the files landed in `api/` (static) or `pages/api/` (Next) |
| Login always wrong password | `EDITOR_PASSWORD` env var missing on Vercel |
| 500s mentioning SESSION_SECRET | add the `SESSION_SECRET` env var |
| Saves fail with Blob errors | Blob store not connected to the project |
| Slot edits don't show on the live site | The page isn't using `OpenSlot` (or `name`/`path` mismatch) |
