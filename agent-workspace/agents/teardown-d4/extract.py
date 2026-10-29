#!/usr/bin/env python3
"""Strip Next.js HTML into readable text: main, nav, footer sections + meta/head SEO data."""
import html as H
import json
import re
import sys
from pathlib import Path

SITE = Path('/Users/chv/develop/tofes101/research/raw/site')

BLOCK = re.compile(r'</?(p|div|section|article|h[1-6]|li|tr|br|ul|ol|table|thead|tbody|dt|dd|blockquote|figure|figcaption|header|footer|main|nav|form|label|legend|details|summary)[^>]*>', re.I)


def to_text(frag: str) -> str:
    frag = re.sub(r'(?is)<(script|style|svg|noscript)[^>]*>.*?</\1>', ' ', frag)
    frag = re.sub(r'(?is)<!--.*?-->', ' ', frag)
    # keep list structure
    frag = re.sub(r'(?i)<li[^>]*>', '\n- ', frag)
    frag = re.sub(r'(?i)<h([1-6])[^>]*>', lambda m: '\n' + '#' * int(m.group(1)) + ' ', frag)
    frag = re.sub(r'(?i)<(td|th)[^>]*>', ' | ', frag)
    frag = BLOCK.sub('\n', frag)
    frag = re.sub(r'(?is)<[^>]+>', '', frag)
    frag = H.unescape(frag)
    frag = frag.replace('\u200b', '').replace('\xa0', ' ')
    lines = [re.sub(r'[ \t]+', ' ', l).strip() for l in frag.split('\n')]
    out, blank = [], 0
    for l in lines:
        if not l:
            blank += 1
            continue
        if blank and out:
            out.append('')
        blank = 0
        out.append(l)
    return '\n'.join(out)


def region(doc: str, start_pat: str, end_pat: str) -> str:
    i = doc.find(start_pat)
    if i < 0:
        return ''
    j = doc.find(end_pat, i)
    return doc[i: j if j > 0 else len(doc)]


def head_meta(doc: str) -> dict:
    d = {}
    m = re.search(r'(?is)<title>(.*?)</title>', doc)
    d['title'] = H.unescape(m.group(1)).strip() if m else ''
    for m in re.finditer(r'(?is)<meta\s+([^>]+)>', doc):
        attrs = dict(re.findall(r'([a-zA-Z:-]+)="([^"]*)"', m.group(1)))
        k = attrs.get('name') or attrs.get('property')
        if k and 'content' in attrs:
            d.setdefault(k, H.unescape(attrs['content']))
    for m in re.finditer(r'(?is)<link\s+([^>]+)>', doc):
        attrs = dict(re.findall(r'([a-zA-Z:-]+)="([^"]*)"', m.group(1)))
        if attrs.get('rel') == 'canonical':
            d['canonical'] = attrs.get('href')
    return d


def main(path: Path) -> None:
    doc = path.read_text(errors='replace')
    meta = head_meta(doc)
    body = region(doc, '<main', '</main>')
    nav = region(doc, '<nav class="sticky top-0', '</nav>')
    foot = region(doc, '<footer id="tofes-footer"', '</footer>')
    parts = []
    parts.append('# META ' + json.dumps(meta, ensure_ascii=False))
    parts.append('\n## NAV\n' + to_text(nav))
    parts.append('\n## MAIN\n' + to_text(body))
    parts.append('\n## FOOTER\n' + to_text(foot))
    txt = '\n'.join(parts)
    path.with_suffix('.txt').write_text(txt)
    wc = len(re.findall(r'[\u0590-\u05FF]+', to_text(body)))
    print(f'{path.name}\tmain_words={wc}')


if __name__ == '__main__':
    files = sys.argv[1:] or sorted(str(p) for p in SITE.glob('*.html'))
    for f in files:
        main(Path(f))
