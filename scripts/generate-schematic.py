# Generates the clean, WIDE vector station diagram for Rimkų g. st.
# Tracks-only (switches/circuits are user-placed markers). Matches the real
# 2020 plan + the user's sketch shape: Vilkyčiai single + Draugystė branch up
# (west), yard tracks above the mains, 3K below, Pervaža (car road) centre-east,
# industrial sidings east toward Klaipėda.
#
# Usage: python scripts/generate-schematic.py   → src/assets/schematics/rimkai.svg
import os

W, H = 3000, 1120
LX, RX = 80, 2920
CX0, CX1 = 820, 2180          # wide platform zone (room for markers)
PERV = 1960                   # car-road (pervaža) x

# track lanes top->bottom: (key, label, y, kind)
TRACKS = [
    ('glz', 'UAB „Geležies laužas"', 120, 'siding-top'),
    ('sct', 'AB „SCT Lubricants"', 176, 'siding-top'),
    ('t10', '10 kelias', 280, 'yard'),
    ('t8',  '8 kelias', 356, 'yard'),
    ('t6',  '6 kelias', 432, 'yard'),
    ('t4',  '4 kelias', 508, 'yard'),
    ('II',  'II pagr. kelias', 630, 'main'),
    ('I',   'I pagr. kelias', 712, 'main'),
    ('t3',  '3 kelias', 800, 'yard-dn'),
    ('ke',  'UAB „Klaipėdos energija" / AB „Gelsta"', 930, 'siding-bot'),
    ('kk',  'AB „Klaipėdos keliai"', 986, 'siding-bot'),
]
Y = {k: y for k, _, y, _ in TRACKS}
KIND = {k: kind for k, _, _, kind in TRACKS}
Y_II, Y_I = Y['II'], Y['I']

UP = ['t10', 't8', 't6', 't4']
WEST_M = {'t4': 800, 't6': 736, 't8': 672, 't10': 608}
EAST_M = {'t4': 2200, 't6': 2264, 't8': 2328, 't10': 2392}

def esc(s):
    return (s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;'))

L = []
L.append('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" class="schematic">' % (W, H))
L.append('''  <style>
    .schematic .bg{fill:#0f172a}
    .schematic .trk{fill:none;stroke:#8ea0b8;stroke-width:2.5}
    .schematic .main{fill:none;stroke:#dbe4f0;stroke-width:4.5}
    .schematic .ramp{fill:none;stroke:#8ea0b8;stroke-width:2.5}
    .schematic .perv{fill:none;stroke:#e2b04a;stroke-width:3;stroke-dasharray:3 10}
    .schematic .dir{fill:#9fb0c6;font:600 22px system-ui}
    .schematic .title{fill:#e8eef7;font:700 30px system-ui}
    .schematic .tname{fill:#8496ad;font:600 17px system-ui}
    .schematic .siding{fill:#9fb0c6;font:500 17px system-ui}
    .schematic .sig{fill:#8496ad;font:600 16px system-ui}
    .schematic .pervlbl{fill:#e2b04a;font:600 16px system-ui}
  </style>''')
L.append('  <rect class="bg" x="0" y="0" width="%d" height="%d"/>' % (W, H))

# header
L.append('  <text class="dir" x="28" y="46">&#8592; VILKYČIAI (vienkelė)</text>')
L.append('  <text class="dir" x="28" y="74">&#8598; DRAUGYSTĖ</text>')
L.append('  <text class="dir" x="%d" y="46" text-anchor="end">KLAIPĖDA (vienkelė) &#8594;</text>' % (RX))
L.append('  <text class="title" x="%d" y="52" text-anchor="middle">RIMKŲ g. st.</text>' % ((CX0 + CX1) / 2))

L.append('  <g class="lines">')
# mains full width, converging to single at both ends
L.append('    <polyline class="main" points="%d,%d %d,%d"/>' % (LX + 90, Y_I, RX, Y_I))
L.append('    <polyline class="main" points="%d,%d %d,%d"/>' % (300, Y_II, RX - 150, Y_II))
L.append('    <polyline class="ramp" points="%d,%d %d,%d"/>' % (300, Y_II, 180, Y_I))         # west merge to single (Vilkyčiai)
L.append('    <polyline class="ramp" points="%d,%d %d,%d"/>' % (RX - 150, Y_II, RX, Y_I))     # east merge to single (Klaipėda)
# Draugystė branch curves up off the top (west)
L.append('    <polyline class="ramp" points="%d,%d %d,%d %d,%d %d,%d"/>' % (380, Y_I, 470, Y_II, 560, 250, 700, 190))
L.append('    <text class="dir" x="712" y="196">&#8599; DRAUGYSTĖ</text>')
# upper yard tracks: central horizontal + ramps to II at both throats
for k in UP:
    y = Y[k]
    L.append('    <polyline class="trk" points="%d,%d %d,%d"/>' % (CX0, y, CX1, y))
    L.append('    <polyline class="ramp" points="%d,%d %d,%d"/>' % (CX0, y, WEST_M[k], Y_II))
    L.append('    <polyline class="ramp" points="%d,%d %d,%d"/>' % (CX1, y, EAST_M[k], Y_II))
# 3K below, ramps to I
L.append('    <polyline class="trk" points="%d,%d %d,%d"/>' % (CX0, Y['t3'], CX1, Y['t3']))
L.append('    <polyline class="ramp" points="%d,%d %d,%d"/>' % (CX0, Y['t3'], 800, Y_I))
L.append('    <polyline class="ramp" points="%d,%d %d,%d"/>' % (CX1, Y['t3'], 2200, Y_I))
# top sidings branch up off 10K at the east
for k in ('glz', 'sct'):
    L.append('    <polyline class="trk" points="%d,%d %d,%d"/>' % (2360, Y[k], RX - 30, Y[k]))
    L.append('    <polyline class="ramp" points="%d,%d %d,%d"/>' % (2200, Y['t10'], 2360, Y[k]))
# bottom sidings branch down off IK at the east
for k in ('ke', 'kk'):
    L.append('    <polyline class="trk" points="%d,%d %d,%d"/>' % (2320, Y[k], RX - 30, Y[k]))
    L.append('    <polyline class="ramp" points="%d,%d %d,%d"/>' % (2200, Y_I, 2320, Y[k]))
# Pervaža (car road) crossing
L.append('    <polyline class="perv" points="%d,%d %d,%d"/>' % (PERV - 12, 230, PERV - 12, 880))
L.append('    <polyline class="perv" points="%d,%d %d,%d"/>' % (PERV + 12, 230, PERV + 12, 880))
L.append('    <text class="pervlbl" x="%d" y="922" text-anchor="middle">Pervaža (automobilių kelias)</text>' % PERV)
# track name labels
for k, label, y, kind in TRACKS:
    if kind.startswith('yard') or kind == 'main':
        L.append('    <text class="tname" x="%d" y="%d">%s</text>' % (CX0 + 10, y - 8, esc(label)))
L.append('  </g>')

# siding labels
for k, label, y, kind in TRACKS:
    if kind == 'siding-top':
        L.append('  <text class="siding" x="%d" y="%d" text-anchor="end">%s</text>' % (RX - 40, y - 10, esc(label)))
    elif kind == 'siding-bot':
        L.append('  <text class="siding" x="%d" y="%d" text-anchor="end">%s</text>' % (RX - 40, y + 26, esc(label)))
L.append('  <text class="sig" x="%d" y="%d">L</text>' % (LX + 100, Y_I + 30))

L.append('</svg>')
svg = '\n'.join(L)

here = os.path.dirname(os.path.abspath(__file__))
dest = os.path.join(here, '..', 'src', 'assets', 'schematics', 'rimkai.svg')
with open(dest, 'w', encoding='utf-8') as f:
    f.write(svg)
print('wrote', os.path.normpath(dest), len(svg), 'bytes; viewBox', W, H)
