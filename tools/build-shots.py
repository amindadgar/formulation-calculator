#!/usr/bin/env python3
"""Regenerate the How-to screenshots in img/ and re-place their pins.

    python3 tools/build-shots.py

Serves the app, photographs it with headless Chrome at a fixed 1180 px width,
crops the six regions used by the How-to dialog, and rewrites the <span
class="pin"> markers inside index.html so they stay on their targets.

Needs Google Chrome and Pillow (pip install pillow).

PIN and BOX coordinates below are CSS pixels in the 1180 px-wide page. They were
read off the live page with getBoundingClientRect(); each pin is deliberately
placed in whitespace beside its target rather than on top of it. If you restyle
the app, re-measure and update them here.
"""
import functools, http.server, os, re, shutil, socketserver, subprocess, sys, tempfile, threading, time
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PORT = 8899
DPR = 2                      # capture at 2× so the images stay sharp
WIDTH, HEIGHT = 1180, 2600
CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')

SHOTS = {
 'ingredients': dict(file='1-ingredients', view='ingredients',  box=(10,127,1170,452),
                     pins=[(210,250),(660,250),(775,250),(917,250),(1144,155)]),
 'product':     dict(file='2-product',     view='formulations', box=(288,127,1180,344),
                     pins=[(440,204),(833,233),(1001,233),(329,299)]),
 'recipe':      dict(file='3-recipe',      view='formulations', box=(288,340,1180,991),
                     pins=[(362,468),(620,468),(685,468),(940,469),(420,953)]),
 'costs':       dict(file='4-costs',       view='formulations', box=(288,986,1180,1217),
                     pins=[(329,1085),(497,1085),(665,1085),(833,1085),(1001,1085)]),
 'price':       dict(file='5-price',       view='formulations', box=(288,1213,1180,1862),
                     pins=[(728,1270),(894,1270),(1059,1270),(530,1502)]),
 'toolbar':     dict(file='6-toolbar',     view='formulations', box=(525,0,1180,108),
                     pins=[(600,86),(761,86),(939,86),(1017,86),(1110,86)]),
}


def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
    handler.log_message = lambda *a, **k: None
    httpd = socketserver.TCPServer(('127.0.0.1', PORT), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def capture(view, out):
    """A fresh profile means empty localStorage, so the app seeds its demo data."""
    profile = tempfile.mkdtemp(prefix='shot-profile-')
    proc = subprocess.Popen([
        CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars',
        f'--force-device-scale-factor={DPR}', f'--window-size={WIDTH},{HEIGHT}',
        f'--user-data-dir={profile}', '--virtual-time-budget=4000',
        f'--screenshot={out}', f'http://127.0.0.1:{PORT}/#{view}',
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(30):                       # chrome does not always exit on its own
        if os.path.exists(out) and os.path.getsize(out) > 0:
            time.sleep(1)
            break
        time.sleep(1)
    proc.kill()
    shutil.rmtree(profile, ignore_errors=True)
    if not os.path.exists(out):
        sys.exit(f'Chrome produced no screenshot for #{view}')


def main():
    if not os.path.exists(CHROME):
        sys.exit(f'Chrome not found at {CHROME} (set the CHROME env var)')
    httpd = serve()
    try:
        tmp = Path(tempfile.mkdtemp(prefix='shots-'))
        full = {}
        for view in sorted({s['view'] for s in SHOTS.values()}):
            path = tmp / f'{view}.png'
            capture(view, str(path))
            full[view] = Image.open(path)

        (ROOT / 'img').mkdir(exist_ok=True)
        html = (ROOT / 'index.html').read_text()
        for key, s in SHOTS.items():
            x0, y0, x1, y1 = s['box']
            full[s['view']].crop((x0*DPR, y0*DPR, x1*DPR, y1*DPR)).save(
                ROOT / 'img' / f"{s['file']}.png", optimize=True)
            w, h = x1 - x0, y1 - y0
            pins = ''.join(
                '\n        <span class="pin" style="--x:%.2f%%;--y:%.2f%%" aria-hidden="true">%d</span>'
                % ((px - x0) / w * 100, (py - y0) / h * 100, i + 1)
                for i, (px, py) in enumerate(s['pins']))
            pat = re.compile(
                r'(<figure class="shot" data-shot="%s">.*?<img[^>]*>)(.*?)(\n      </figure>)' % key,
                re.S)
            if not pat.search(html):
                sys.exit(f'index.html has no figure for "{key}"')
            html = pat.sub(lambda m: m.group(1) + pins + m.group(3), html)
            print(f'  img/{s["file"]}.png  ({w}×{h} css, {len(s["pins"])} pins)')
        (ROOT / 'index.html').write_text(html)
        print('index.html pins updated')
    finally:
        httpd.shutdown()


if __name__ == '__main__':
    main()
