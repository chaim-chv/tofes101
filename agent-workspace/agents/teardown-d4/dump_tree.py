#!/usr/bin/env python3
"""Dump tepez form schema (start.json) into a readable outline."""
import json
import re
from pathlib import Path

SRC = Path('/Users/chv/develop/tofes101/research/raw/start.json')
OUT = Path('/Users/chv/develop/tofes101/research/raw/site/form-tree.txt')

d = json.loads(SRC.read_text())
fs = d['formSchema']
root = fs['rootElem']

CONTAINER = {'root', 'cSection', 'cRow', 'cRepeat'}
lines = []


def strip_html(s, n=260):
    s = re.sub(r'(?is)<(script|style)[^>]*>.*?</\1>', ' ', s or '')
    s = re.sub(r'(?is)<br\s*/?>', ' / ', s)
    s = re.sub(r'(?is)</(p|div|li|h\d)>', ' / ', s)
    s = re.sub(r'(?s)<[^>]+>', '', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s[:n] + ('…' if len(s) > n else '')


def opts(n):
    o = n.get('options')
    if isinstance(o, list):
        vals = []
        for x in o:
            if isinstance(x, dict):
                vals.append(str(x.get('value', x.get('name', ''))))
            else:
                vals.append(str(x))
        return '[' + ' | '.join(vals)[:300] + ']'
    return ''


def walk(n, depth=0, path=''):
    if not isinstance(n, dict):
        return
    t = n.get('type', '')
    name = n.get('name', '')
    p = f'{path}/{name}' if name else path
    ind = '  ' * depth
    bits = [f'{ind}{t}:{name}']
    if n.get('label'):
        bits.append(f'label="{n["label"]}"')
    if n.get('secLegend'):
        bits.append(f'LEGEND="{n["secLegend"]}"')
    if n.get('displayNameLabel'):
        bits.append(f'display="{n["displayNameLabel"]}"')
    if n.get('relevant'):
        bits.append(f'relevant=({n["relevant"]})')
    if n.get('show') not in (None, True):
        bits.append(f'show=({n["show"]})')
    if n.get('req') is not None:
        bits.append(f'req={n["req"]}')
    if n.get('reqValidator'):
        bits.append(f'reqValidator={n["reqValidator"]}')
    if n.get('typeValidator'):
        bits.append(f'typeValidator={n["typeValidator"]}')
    vs = n.get('validators')
    if isinstance(vs, list) and vs:
        vs_txt = []
        for v in vs:
            if isinstance(v, dict):
                vs_txt.append(f'{v.get("type","")}({v.get("message","")})')
            else:
                vs_txt.append(str(v))
        bits.append('validators=' + '; '.join(vs_txt)[:260])
    if n.get('eqEquation'):
        bits.append(f'eq=({n["eqEquation"]})')
    if n.get('helpText'):
        bits.append(f'help="{strip_html(n["helpText"], 140)}"')
    if n.get('helpBubText'):
        bits.append(f'helpBub="{strip_html(n["helpBubText"], 160)}"')
    o = opts(n)
    if o:
        bits.append('options=' + o)
    if n.get('initialValue') not in (None, ''):
        bits.append(f'init={str(n["initialValue"])[:40]}')
    if n.get('print') is False:
        bits.append('print=false')
    if n.get('secType'):
        bits.append(f'secType={n["secType"]}')
    if n.get('btnText'):
        bits.append(f'btn="{n["btnText"]}"')
    if n.get('btnAction'):
        bits.append(f'btnAction={n["btnAction"]}')
    if n.get('url'):
        bits.append(f'url={n["url"]}')
    if n.get('adSlot'):
        bits.append(f'adSlot={n["adSlot"]}')
    content = n.get('content')
    if content:
        bits.append(f'content="{strip_html(content)}"')
    lines.append(' '.join(bits))
    for c in n.get('children') or []:
        walk(c, depth + 1, p)


lines.append(f'# FORM: {d.get("id")} / publicName={d.get("publicName")!r} locale={fs.get("locale")}')
lines.append(f'# flags: showActionBar={fs.get("showActionBar")} showFooter={fs.get("showFooter")} '
             f'showTemplateCreateDefaultUi={fs.get("showTemplateCreateDefaultUi")}')
lines.append(f'# rootConfig: {json.dumps(fs.get("rootConfig"), ensure_ascii=False)}')
lines.append(f'# unsavedMessage: {fs.get("unsavedMessage")!r}')
lines.append(f'# auxData keys: {sorted(fs["auxData"].keys())}')
lines.append('')
walk(root)

OUT.write_text('\n'.join(lines))
print('lines', len(lines), 'bytes', OUT.stat().st_size)
