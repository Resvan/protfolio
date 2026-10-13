#!/usr/bin/env bash
# Captures 1280x800 screenshots of live project sites into src/assets/projects/<slug>.png.
# Sites that fail or return an error page are skipped; the placeholder is used instead.
set -u
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
command -v google-chrome >/dev/null && CHROME=google-chrome
OUT=src/assets/projects
mkdir -p "$OUT"
while IFS='|' read -r slug url; do
  tmp="$(mktemp -d)"
  if "$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=1280,800 --virtual-time-budget=8000 \
      --screenshot="$tmp/shot.png" "$url" >/dev/null 2>&1 && [ -s "$tmp/shot.png" ]; then
    mv "$tmp/shot.png" "$OUT/$slug.png" && echo "ok   $slug"
  else
    echo "skip $slug ($url)"
  fi
  rm -rf "$tmp"
done <<'LIST'
cleverpush-landing|https://landing.cleverpush.com/
rentdigicare|https://rentdigicare.com/
ayurvedalayam|https://www.ayurvedalayam.com/home
xylothia|https://xylothia.vercel.app/
basekamp|https://basekamp.co.uk/
virtual-solutions|https://www.virtualksa.com/
ecommerce-ui-template|https://3legant-ecru.vercel.app
hawr-learn|https://www.hawrlearn.com
LIST
