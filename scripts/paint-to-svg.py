# Recolor the user's Paint sketch to the app's dark theme and embed it in an SVG
# (DiagramBoard loads SVG via ?raw, so wrapping the PNG as a base64 <image>
# keeps everything working). Markers overlay on top via elementPositions.
from PIL import Image
import base64, io, os

SRC = r"c:/Darbai/Freelance darbai/Winero notes/screenshots for claude/railapp schema.png"
im = Image.open(SRC).convert("L")           # grayscale
W0, H0 = im.size

# auto-crop to the drawing (non-white) bounding box + padding
px = im.load()
minx, miny, maxx, maxy = W0, H0, 0, 0
for y in range(H0):
    for x in range(W0):
        if px[x, y] < 160:
            if x < minx: minx = x
            if y < miny: miny = y
            if x > maxx: maxx = x
            if y > maxy: maxy = y
pad = 30
minx = max(0, minx - pad); miny = max(0, miny - pad)
maxx = min(W0, maxx + pad); maxy = min(H0, maxy + pad)
im = im.crop((minx, miny, maxx, maxy))

# recolor: dark bg (#0f172a) where light, light line (#cbd5e1) where dark,
# with anti-alias blend so lines stay smooth.
bg = (15, 23, 42); ln = (203, 213, 225)
rgb = Image.new("RGB", im.size)
sp = im.load(); dp = rgb.load()
for y in range(im.size[1]):
    for x in range(im.size[0]):
        g = sp[x, y]
        t = 1.0 - g / 255.0            # 1 at black line, 0 at white bg
        dp[x, y] = (
            int(bg[0] + (ln[0]-bg[0])*t),
            int(bg[1] + (ln[1]-bg[1])*t),
            int(bg[2] + (ln[2]-bg[2])*t),
        )

# scale to a base width, then STRETCH horizontally so tracks are longer and
# markers have more room (schematic, not to scale).
tw = 2000
STRETCH = 1.8
r = tw / rgb.width
base_h = int(rgb.height * r)
rgb = rgb.resize((int(tw * STRETCH), base_h), Image.LANCZOS)
W, H = rgb.size

buf = io.BytesIO(); rgb.save(buf, "PNG", optimize=True)
b64 = base64.b64encode(buf.getvalue()).decode()
svg = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" class="schematic">\n'
    '  <image x="0" y="0" width="%d" height="%d" '
    'href="data:image/png;base64,%s"/>\n</svg>\n' % (W, H, W, H, b64)
)
dest = r"C:/Darbai/Freelance darbai/railapp/src/assets/schematics/rimkai.svg"
with open(dest, "w", encoding="utf-8") as f:
    f.write(svg)
print("bbox", (minx, miny, maxx, maxy), "-> svg", W, H, "kb", round(len(svg)/1024))
