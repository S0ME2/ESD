"""Regenerate lecture register illustrations with the professor's renderer.

Run from the project root after updating course sources:
    python3 scripts/render-registers.py
The original regs definitions remain unchanged in public/source.
"""
import hashlib
import json
import re
from pathlib import Path
from regdiag import render

ROOT = Path(__file__).resolve().parent.parent
manifest = json.loads((ROOT / 'src/course/manifest.json').read_text())
destination = ROOT / 'public/registers'
destination.mkdir(exist_ok=True)
index = {}
style = '''<style>
svg{color:#172640}text{fill:currentColor;font:13px sans-serif;dominant-baseline:middle}
.mono{font-family:monospace}.lbl{fill:#52627a;font-size:11px}
.box{fill:#f0f4fb;stroke:currentColor;stroke-width:1.5}
.reg{fill:none;stroke:currentColor;stroke-width:1.2}
.hi{fill:none;stroke:#2854d9;stroke-width:2}
.hifill{fill:#2854d9;fill-opacity:.14;stroke:#2854d9;stroke-width:1.5}
.wire{fill:none;stroke:currentColor;stroke-width:1.5}
.halo{paint-order:stroke;stroke:white;stroke-width:4px;stroke-linejoin:round}
.dash{fill:none;stroke:#52627a;stroke-width:1.2;stroke-dasharray:4 3}
</style>'''
blocks = 0
for lesson in manifest['lessons']:
    text = (ROOT / 'public/source' / lesson['directory'] / 'Slide.md').read_text()
    for body in re.findall(r'```regs\s*\n([\s\S]*?)\n```', text):
        source = body.strip()
        name = hashlib.sha256(source.encode()).hexdigest()[:24] + '.svg'
        svg = render(source.splitlines())
        svg = svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ', 1)
        first = svg.index('>') + 1
        (destination / name).write_text(svg[:first] + style + svg[first:])
        index[source] = '/registers/' + name
        blocks += 1
(ROOT / 'src/course/register-diagrams.json').write_text(json.dumps(index, indent=2) + '\n')
print(f'Rendered {blocks} register maps ({len(index)} unique diagrams).')
