#!/usr/bin/env bash
set -e

cd /var/www/cdn/folder-opening-animation

VERSIONS=$(ls -d [0-9]*/ 2>/dev/null | sed 's/\///' | sort -V)
LATEST=$(echo "$VERSIONS" | sort -V | tail -1)

{
    printf '{"versions":['
    first=true
    for dir in $VERSIONS; do
        ts=$(stat -c '%Y' "$dir" 2>/dev/null || echo 0)
        date=$(date -d "@$ts" -u '+%Y-%m-%dT%H:%M:%SZ')
        [ "$first" = true ] && first=false || printf ','
        printf '{"version":"%s","deployed_at":"%s"}' "$dir" "$date"
    done
    printf ']}'
} > versions.json

{
    printf '<!doctype html>\n<html lang="en">\n<head>\n'
    printf '<meta charset="utf-8">\n'
    printf '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
    printf '<title>folder-opening-animation CDN</title>\n'
    printf '<style>\n'
    printf '  body{font-family:system-ui,sans-serif;max-width:640px;margin:60px auto;padding:0 20px;color:#1a1a1a}\n'
    printf '  h1{font-size:1.4rem;font-weight:700;margin-bottom:4px}\n'
    printf '  p{color:#666;font-size:.9rem;margin-top:0}\n'
    printf '  table{width:100%%;border-collapse:collapse;margin-top:24px;font-size:.9rem}\n'
    printf '  th{text-align:left;padding:8px 12px;border-bottom:2px solid #e5e5e5;color:#888;font-weight:600;text-transform:uppercase;font-size:.75rem;letter-spacing:.05em}\n'
    printf '  td{padding:10px 12px;border-bottom:1px solid #f0f0f0}\n'
    printf '  tr:last-child td{border-bottom:none}\n'
    printf '  a{color:#2563eb;text-decoration:none}\n'
    printf '  a:hover{text-decoration:underline}\n'
    printf '  .badge{display:inline-block;background:#dcfce7;color:#166534;font-size:.7rem;padding:2px 7px;border-radius:99px;font-weight:600;margin-left:8px;vertical-align:middle}\n'
    printf '</style>\n</head>\n<body>\n'
    printf '<h1>folder-opening-animation CDN</h1>\n'
    printf '<p>Animated folder open/close modal component &mdash; available versions</p>\n'
    printf '<table>\n<thead><tr><th>Version</th><th>JS</th><th>CSS</th><th>Deployed</th></tr></thead>\n<tbody>\n'

    for dir in $(echo "$VERSIONS" | sort -Vr); do
        ts=$(stat -c '%Y' "$dir" 2>/dev/null || echo 0)
        date_human=$(date -d "@$ts" -u '+%Y-%m-%d')
        badge=""
        [ "$dir" = "$LATEST" ] && badge='<span class="badge">latest</span>'
        printf '<tr>\n'
        printf '  <td><strong>%s</strong>%s</td>\n' "$dir" "$badge"
        printf '  <td><a href="%s/folder-animation.min.js">.min.js</a> &middot; <a href="%s/folder-animation.js">.js</a></td>\n' "$dir" "$dir"
        printf '  <td><a href="%s/folder-animation.min.css">.min.css</a> &middot; <a href="%s/folder-animation.css">.css</a></td>\n' "$dir" "$dir"
        printf '  <td>%s</td>\n' "$date_human"
        printf '</tr>\n'
    done

    printf '</tbody>\n</table>\n</body>\n</html>\n'
} > index.html

echo "generated versions.json and index.html"
