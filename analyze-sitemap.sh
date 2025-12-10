#!/bin/bash
# Sitemap Analyzer - generates JSON metadata for all HTML files
# Run: ./analyze-sitemap.sh > sitemap-data.json

echo "{"
echo '  "generated": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",'
echo '  "files": ['

first=true
for f in *.html; do
  [ "$f" = "*.html" ] && continue
  
  # Get file stats
  size=$(stat -f '%z' "$f" 2>/dev/null || stat -c '%s' "$f" 2>/dev/null)
  modified=$(stat -f '%m' "$f" 2>/dev/null || stat -c '%Y' "$f" 2>/dev/null)
  
  # Detect technologies
  tech=""
  grep -q "three" "$f" 2>/dev/null && tech="$tech\"three\","
  grep -q "BroadcastChannel" "$f" 2>/dev/null && tech="$tech\"broadcast\","
  grep -q -i "tailwind" "$f" 2>/dev/null && tech="$tech\"tailwind\","
  grep -q -i "ldraw\|\.mpd\|\.ldr" "$f" 2>/dev/null && tech="$tech\"ldraw\","
  grep -q "scenario-seeds" "$f" 2>/dev/null && tech="$tech\"seeds\","
  grep -q "FontAwesome\|fa-" "$f" 2>/dev/null && tech="$tech\"fontawesome\","
  tech=$(echo "$tech" | sed 's/,$//')
  
  # Extract outgoing links
  links=$(grep -oE 'href="[^"]+\.html"' "$f" 2>/dev/null | sed 's/href="//;s/"$//' | sort -u | head -20 | while read link; do echo "\"$link\","; done | tr -d '\n' | sed 's/,$//')
  
  # Detect category from filename
  category="misc"
  case "$f" in
    onyx-*) category="onyx" ;;
    homer-*) category="homer" ;;
    block-*) category="block" ;;
    brick-*) category="brick" ;;
    wag-*) category="wag" ;;
    mento-*) category="mento" ;;
    *tutorial*|*Tutorial*) category="tutorial" ;;
    *studio*|*Studio*) category="studio" ;;
    LEGOS-*) category="legos" ;;
    *-ator*.html) category="ator" ;;
  esac
  
  # Extract title
  title=$(grep -oE '<title>[^<]+</title>' "$f" 2>/dev/null | head -1 | sed 's/<title>//;s/<\/title>//' | head -c 100)
  
  # Count lines
  lines=$(wc -l < "$f" | tr -d ' ')
  
  # Output JSON
  [ "$first" = true ] && first=false || echo ","
  
  cat <<EOF
    {
      "name": "$f",
      "title": "$title",
      "size": $size,
      "lines": $lines,
      "modified": $modified,
      "category": "$category",
      "tech": [$tech],
      "links": [$links]
    }
EOF

done

echo ""
echo "  ]"
echo "}"
