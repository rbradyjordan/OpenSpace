#!/usr/bin/env bash
# OpenSpace installer — copies the editing system into another project.
#
#   ./install.sh /path/to/other-site            # static HTML site on Vercel
#   ./install.sh /path/to/next-app --nextjs     # Next.js app on Vercel
#
# After running, follow the printed checklist (env vars + Blob store).
set -euo pipefail

SRC="$(cd "$(dirname "$0")" && pwd)"
DEST="${1:?Usage: ./install.sh /path/to/target-project [--nextjs]}"
MODE="${2:-static}"

if [ ! -d "$DEST" ]; then echo "✗ Target directory not found: $DEST"; exit 1; fi

echo "Installing OpenSpace → $DEST"

if [ "$MODE" = "--nextjs" ]; then
  # Next.js: api routes go in pages/api (works alongside the App Router),
  # editor + admin are static assets in /public.
  mkdir -p "$DEST/pages/api" "$DEST/public/admin" "$DEST/public/assets" "$DEST/components"
  cp "$SRC/api/_lib.js" "$SRC/api/login.js" "$SRC/api/upload.js" "$SRC/api/content.js" "$DEST/pages/api/"
  cp "$SRC/admin/index.html" "$DEST/public/admin/index.html"
  cp "$SRC/assets/editor.js" "$DEST/public/assets/editor.js"
  cp "$SRC/integrations/nextjs/OpenSlot.jsx" "$DEST/components/OpenSlot.jsx"
  # pages.js is optional in Next mode (no static .html pages) but harmless to include:
  cp "$SRC/api/pages.js" "$DEST/pages/api/"
  echo ""
  echo "✔ Files installed (Next.js mode)"
  echo ""
  echo "Next steps:"
  echo "  1. npm i @vercel/blob"
  echo "  2. In Vercel: connect a Blob store, then add env vars"
  echo "     EDITOR_PASSWORD and SESSION_SECRET"
  echo "  3. Wrap editable regions:  import OpenSlot from '@/components/OpenSlot'"
  echo "     <OpenSlot name=\"hero\"><h1>Default content</h1></OpenSlot>"
  echo "  4. Deploy, open /admin/index.html, log in,"
  echo "     click 'Edit a URL (slots)' and enter the page path (e.g. / )."
else
  mkdir -p "$DEST/api" "$DEST/admin" "$DEST/assets"
  cp "$SRC/api/_lib.js" "$SRC/api/login.js" "$SRC/api/pages.js" "$SRC/api/upload.js" "$SRC/api/serve.js" "$SRC/api/content.js" "$SRC/api/social.js" "$DEST/api/"
  cp "$SRC/admin/index.html" "$DEST/admin/index.html"
  cp "$SRC/assets/editor.js" "$DEST/assets/editor.js"
  if [ ! -f "$DEST/package.json" ]; then
    printf '{\n  "name": "site",\n  "private": true,\n  "dependencies": { "@vercel/blob": "^0.23.4" }\n}\n' > "$DEST/package.json"
  else
    echo "  ! Add \"@vercel/blob\" to $DEST/package.json dependencies if missing"
  fi
  if [ ! -f "$DEST/vercel.json" ]; then
    cp "$SRC/vercel.json" "$DEST/vercel.json"
  else
    echo "  ! Merge the rewrites from $SRC/vercel.json into $DEST/vercel.json"
  fi
  echo ""
  echo "✔ Files installed (static mode)"
  echo ""
  echo "Next steps:"
  echo "  1. In Vercel: connect a Blob store, then add env vars"
  echo "     EDITOR_PASSWORD and SESSION_SECRET"
  echo "  2. Deploy, open /admin/, log in — every .html page is editable."
fi
