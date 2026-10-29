#!/bin/bash
# one request per URL, short delay, log status
cd /Users/chv/develop/tofes101
OUT=research/raw/site
: > "$OUT/_status.tsv"
while read -r path; do
  [ -z "$path" ] && continue
  slug=$(echo "$path" | sed 's#^/##; s#/$##; s#/#_#g')
  [ -z "$slug" ] && slug="home"
  code=$(curl -sS --compressed -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36" \
    -o "$OUT/$slug.html" -w "%{http_code}" "https://tofes101.co.il$path")
  size=$(wc -c < "$OUT/$slug.html" | tr -d ' ')
  printf "%s\t%s\t%s\t%s\n" "$path" "$code" "$size" "$slug" | tee -a "$OUT/_status.tsv"
  sleep 0.9
done <<'EOF'
/
/forms/
/forms/itc-101/
/forms/itc-101/submit/
/forms/itc-101/create/
/forms/itc-101/organizations/
/forms/itc-119/
/forms/bank-account/
/forms/electronic-pay-slip/
/forms/electronic-pay-slip/create/
/forms/itc-1516/
/directory/
/accessibility/
/privacy/
/terms/
/cookies/
/about/
/contact/
/feedback/
/fill-form-101-english/
/docs/
/docs/introduction/
/docs/introduction/download/
/docs/introduction/archive/
/docs/online-form/
/docs/online-form/faq/
/docs/online-form/attached-files/
/docs/online-form/custom-form/
/docs/online-form/mobile-data-pickers/
/docs/tax-adjustment/
/docs/tax-reductions/
/docs/tax-reductions/resident/
/docs/tax-reductions/female/
/docs/tax-reductions/youth/
/docs/tax-reductions/children/
/docs/tax-reductions/child-support/
/docs/tax-reductions/unemployed-spouse/
/docs/tax-reductions/studies/
/docs/tax-reductions/national-and-military-service/
/docs/tax-reductions/newcomer/
/docs/tax-reductions/returning-resident/
/child-support-docs/introduction/
/forms/vat-calculator/
/forms/percentage-calculator/
/forms/child-support-calculator/
/forms/anti-sexual-harassment/
/forms/anti-sexual-harassment/create/
EOF
