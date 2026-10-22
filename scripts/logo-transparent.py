"""Makes a transparent-background copy of the supplied logo without redrawing it.

Background = every near-white pixel (including enclosed areas like the holes in "e"),
made fully transparent. Anti-aliased edge pixels next to the background get partial alpha by
removing white from them ("colour to alpha"), so edges stay smooth on any background.
All other pixels (lettering, ear, question mark) are kept exactly as supplied.

Usage: python3 scripts/logo-transparent.py public/brand/seeksense-logo.png public/brand/seeksense-logo-transparent.png
"""
import sys
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGBA")
w, h = im.size
px = im.load()

def near_white(p, t=232):
    return min(p[0], p[1], p[2]) >= t

# Every near-white pixel is background, including enclosed areas such as the
# holes in the letter "e" and the space inside the ear.
bg = [[near_white(px[x, y]) for x in range(w)] for y in range(h)]

def touches_bg(x, y, r=2):
    for yy in range(max(0, y - r), min(h, y + r + 1)):
        for xx in range(max(0, x - r), min(w, x + r + 1)):
            if bg[yy][xx]:
                return True
    return False

out = Image.new("RGBA", (w, h))
o = out.load()
for y in range(h):
    for x in range(w):
        r, g, b, _ = px[x, y]
        if bg[y][x]:
            o[x, y] = (255, 255, 255, 0)
        elif touches_bg(x, y):
            a = max(255 - r, 255 - g, 255 - b) / 255
            if a <= 0.02:
                o[x, y] = (255, 255, 255, 0)
            else:
                un = lambda c: max(0, min(255, round(255 - (255 - c) / a)))
                o[x, y] = (un(r), un(g), un(b), round(a * 255))
        else:
            o[x, y] = (r, g, b, 255)

bbox = out.getchannel("A").getbbox()
out = out.crop((max(0, bbox[0] - 2), max(0, bbox[1] - 2), min(w, bbox[2] + 2), min(h, bbox[3] + 2)))
out.save(dst, optimize=True)
print(dst, out.size)
