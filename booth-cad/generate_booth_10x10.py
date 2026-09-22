"""
IAAPA Expo 10' x 10' booth - concept drawing generator.

Scaled-down version of the 20' x 20' triangle-canopy booth concept:
two side frames on the back half of the booth, a header beam between
them, and a raised triangular canopy on three posts at the front.

Builds a simple 3D model (boxes + triangle frame), then projects it to
plan / front / side / isometric views with hidden-line removal and writes:

  booth_10x10_drawing.dxf   2D drawing sheet (model space, 1 unit = 1 inch)
  booth_10x10_drawing.pdf   print-ready sheet, ARCH C (24" x 18")
  booth_10x10_drawing.png   preview

The 3D model files come from export_3d.py, which reuses build_parts().

All dimensions are in inches. Edit the PARAMETERS block and re-run:
    pip install ezdxf matplotlib
    python3 generate_booth_10x10.py
"""

import datetime
import math
import os

import ezdxf
from ezdxf.addons.drawing import Frontend, RenderContext
from ezdxf.addons.drawing.config import (BackgroundPolicy, ColorPolicy,
                                         Configuration, LineweightPolicy)
from ezdxf.addons.drawing.matplotlib import MatplotlibBackend
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------- PARAMETERS
# Origin = front-left corner of the booth floor. X = width (left -> right),
# Y = depth (front aisle -> back), Z = height.
BOOTH_W = 120.0            # 10'-0"
BOOTH_D = 120.0            # 10'-0"

MEMBER = 6.0               # side-frame posts / rails / header beam, square
FRAME_H = 90.0             # top of side frames + header beam   (7'-6")
FRAME_DEPTH = 63.0         # side frame depth, measured from back (5'-3")
HEADER_FROM_BACK = 12.0    # clear gap from back line to header beam (1'-0")

TRI_SIDE = 81.0            # triangle canopy, equilateral side (6'-9")
TRI_BACK_FROM_BACK = 48.0  # back edge of triangle from back line (4'-0")
TRI_TOP = 96.0             # top of triangle canopy            (8'-0")
TRI_THICK = 5.0            # canopy fascia height
TRI_BEVEL = 2.0            # fascia batter (bottom edge set in from top edge)
TRI_BAND = 8.0             # canopy frame width (top face)
TRI_POST = 5.0             # canopy support posts, square

# Sheet: ARCH C landscape, plotted at 1/2" = 1'-0"
SHEET_W_IN, SHEET_H_IN = 24.0, 18.0
SCALE = 24.0               # model inches per paper inch
SCALE_LABEL = '1/2" = 1\'-0"'

PROJECT = "IAAPA EXPO - 10' x 10' BOOTH"
SHEET_TITLE = "BOOTH CONCEPT - PLAN, ELEVATIONS & ISOMETRIC"


# --------------------------------------------------------------- formatting
def ft_in(inches):
    """Architectural string, e.g. 81 -> 6'-9", 2.5 -> 0'-2 1/2"."""
    sixteenths = round(abs(inches) * 16)
    feet, rem = divmod(sixteenths, 12 * 16)
    whole, frac = divmod(rem, 16)
    s = f"{feet}'-{whole}"
    if frac:
        g = math.gcd(frac, 16)
        s += f" {frac // g}/{16 // g}"
    return ("-" if inches < 0 else "") + s + '"'


# -------------------------------------------------------------------- model
class Face:
    """Planar convex polygon. `draw[i]` says whether edge i -> i+1 is a
    real edge (False for internal splits of a larger face)."""

    def __init__(self, pts, layer, draw=None):
        self.pts = [tuple(map(float, p)) for p in pts]
        self.layer = layer
        self.draw = draw if draw is not None else [True] * len(pts)


def box(x0, y0, z0, x1, y1, z1, layer="A-STRC"):
    p = lambda x, y, z: (x, y, z)  # noqa: E731
    return [
        Face([p(x0, y0, z0), p(x1, y0, z0), p(x1, y1, z0), p(x0, y1, z0)], layer),
        Face([p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1)], layer),
        Face([p(x0, y0, z0), p(x1, y0, z0), p(x1, y0, z1), p(x0, y0, z1)], layer),
        Face([p(x0, y1, z0), p(x1, y1, z0), p(x1, y1, z1), p(x0, y1, z1)], layer),
        Face([p(x0, y0, z0), p(x0, y1, z0), p(x0, y1, z1), p(x0, y0, z1)], layer),
        Face([p(x1, y0, z0), p(x1, y1, z0), p(x1, y1, z1), p(x1, y0, z1)], layer),
    ]


def centered_box(cx, cy, size, z0, z1, layer="A-STRC"):
    h = size / 2
    return box(cx - h, cy - h, z0, cx + h, cy + h, z1, layer)


def offset_triangle(tri, d):
    """Offset an equilateral triangle's edges inward by d (vertices move 2d
    toward the centroid along the bisectors)."""
    cx = sum(p[0] for p in tri) / 3
    cy = sum(p[1] for p in tri) / 3
    out = []
    for x, y in tri:
        dx, dy = cx - x, cy - y
        L = math.hypot(dx, dy)
        out.append((x + dx / L * 2 * d, y + dy / L * 2 * d))
    return out


def triangle_geometry():
    cx = BOOTH_W / 2
    y_back = BOOTH_D - TRI_BACK_FROM_BACK
    h = TRI_SIDE * math.sqrt(3) / 2
    outer_top = [(cx - TRI_SIDE / 2, y_back), (cx + TRI_SIDE / 2, y_back),
                 (cx, y_back - h)]                     # back-L, back-R, apex
    inner = offset_triangle(outer_top, TRI_BAND)
    outer_bot = offset_triangle(outer_top, TRI_BEVEL)
    return outer_top, outer_bot, inner


def _in_tri(tri, p):
    s = [(b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])
         for a, b in zip(tri, tri[1:] + tri[:1])]
    return all(x >= -1e-9 for x in s) or all(x <= 1e-9 for x in s)


def _fit_post(po, pi, ob, inn):
    """Slide a post along the bisector from the bottom-outer corner `po`
    toward the inner corner `pi`; return the first centre (on a 1/2" grid)
    where the post section is fully under the band (inside the bottom
    outline and clear of the opening)."""
    h = TRI_POST / 2
    for k in range(1, 201):
        t = k / 200
        c = (round((po[0] + (pi[0] - po[0]) * t) * 2) / 2,
             round((po[1] + (pi[1] - po[1]) * t) * 2) / 2)
        corners = [(c[0] + dx, c[1] + dy) for dx in (-h, h) for dy in (-h, h)]
        if all(_in_tri(ob, q) for q in corners) and not any(_in_tri(inn, q) for q in corners):
            return c
    raise ValueError("canopy post does not fit under the canopy band - "
                     "increase TRI_BAND or reduce TRI_POST / TRI_BEVEL")


def build_parts():
    """The booth as named solid parts: [(name, kind, faces)], where kind is
    'frame' or 'canopy'. Every part is a closed solid."""
    parts = []
    W, D, M = BOOTH_W, BOOTH_D, MEMBER

    # Side frames: back post, front post, top rail between them
    y_front = D - FRAME_DEPTH
    for side, x0 in (("Left", 0.0), ("Right", W - M)):
        parts.append((f"{side}_Back_Post", "frame", box(x0, D - M, 0, x0 + M, D, FRAME_H)))
        parts.append((f"{side}_Front_Post", "frame",
                      box(x0, y_front, 0, x0 + M, y_front + M, FRAME_H)))
        parts.append((f"{side}_Top_Rail", "frame",
                      box(x0, y_front + M, FRAME_H - M, x0 + M, D - M, FRAME_H)))

    # Header beam spanning between the side rails
    yb = D - HEADER_FROM_BACK - M
    parts.append(("Header_Beam", "frame", box(M, yb, FRAME_H - M, W - M, yb + M, FRAME_H)))

    # Triangle canopy: top band, bottom band, battered fascia, inner face
    ot, ob, inn = triangle_geometry()
    zt, zb = TRI_TOP, TRI_TOP - TRI_THICK
    canopy = []
    for i in range(3):
        j = (i + 1) % 3
        # top / bottom band segments (trapezoids) - miter edges are internal splits
        canopy.append(Face([(*ot[i], zt), (*ot[j], zt), (*inn[j], zt), (*inn[i], zt)],
                           "A-STRC", draw=[True, False, True, False]))
        canopy.append(Face([(*ob[i], zb), (*ob[j], zb), (*inn[j], zb), (*inn[i], zb)],
                           "A-STRC", draw=[True, False, True, False]))
        canopy.append(Face([(*ot[i], zt), (*ot[j], zt), (*ob[j], zb), (*ob[i], zb)], "A-STRC"))
        canopy.append(Face([(*inn[i], zt), (*inn[j], zt), (*inn[j], zb), (*inn[i], zb)], "A-STRC"))
    parts.append(("Triangle_Canopy", "canopy", canopy))

    # Canopy posts at the three corners of the frame, on the corner bisector,
    # placed so the whole post section sits under the canopy's bottom band.
    posts = [_fit_post(po, pi, ob, inn) for po, pi in zip(ob, inn)]
    for name, (px, py) in zip(("Left", "Right", "Front"), posts):
        parts.append((f"Canopy_Post_{name}", "frame", centered_box(px, py, TRI_POST, 0, zb)))
    return parts, posts


def build_model():
    """Flat face list for the 2D views: floor outline + all parts."""
    W, D = BOOTH_W, BOOTH_D
    parts, posts = build_parts()
    faces = [Face([(0, 0, 0), (W, 0, 0), (W, D, 0), (0, D, 0)], "A-FLOR")]
    for _, _, part_faces in parts:
        faces += part_faces
    return faces, posts


# ------------------------------------------------------ projection + HLR
SQ2, SQ3, SQ6 = math.sqrt(2), math.sqrt(3), math.sqrt(6)

VIEWS = {
    # name: function (x,y,z) -> (u, v, depth toward viewer)
    "plan": lambda x, y, z: (x, y, z),
    "front": lambda x, y, z: (x, z, -y),
    "side": lambda x, y, z: (y, z, x),        # right side, front of booth on the left
    # isometric from the front-right corner, looking down
    "iso": lambda x, y, z: ((x + y) / SQ2, (-x + y + 2 * z) / SQ6, (x - y + z) / SQ3),
}

EPS = 1e-6


def _plane(proj):
    """Return (a, b, c) with w = a*u + b*v + c, or None if face is edge-on."""
    (u0, v0, w0), (u1, v1, w1), (u2, v2, w2) = proj[0], proj[1], proj[2]
    best = None
    n = len(proj)
    # find three non-collinear projected points
    for i in range(n):
        for j in range(i + 1, n):
            for k in range(j + 1, n):
                a, b, c = proj[i], proj[j], proj[k]
                det = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])
                if best is None or abs(det) > abs(best[0]):
                    best = (det, a, b, c)
    det, a, b, c = best
    if abs(det) < 1e-9:
        return None
    # solve for w = A u + B v + C
    du1, dv1, dw1 = b[0] - a[0], b[1] - a[1], b[2] - a[2]
    du2, dv2, dw2 = c[0] - a[0], c[1] - a[1], c[2] - a[2]
    A = (dw1 * dv2 - dw2 * dv1) / det
    B = (du1 * dw2 - du2 * dw1) / det
    C = a[2] - A * a[0] - B * a[1]
    return A, B, C


def _inside_strict(poly, u, v, tol=1e-5):
    """Point strictly inside convex polygon (not on boundary)."""
    sign = 0
    n = len(poly)
    for i in range(n):
        x0, y0 = poly[i]
        x1, y1 = poly[(i + 1) % n]
        L = math.hypot(x1 - x0, y1 - y0)
        if L < 1e-12:
            continue
        cr = ((x1 - x0) * (v - y0) - (y1 - y0) * (u - x0)) / L
        if abs(cr) <= tol:
            return False
        s = 1 if cr > 0 else -1
        if sign == 0:
            sign = s
        elif s != sign:
            return False
    return True


def _seg_params(p, q, a, b):
    """Parameter t on p->q where it crosses segment a->b (proper or touching)."""
    rx, ry = q[0] - p[0], q[1] - p[1]
    sx, sy = b[0] - a[0], b[1] - a[1]
    den = rx * sy - ry * sx
    if abs(den) < 1e-12:
        return []
    t = ((a[0] - p[0]) * sy - (a[1] - p[1]) * sx) / den
    s = ((a[0] - p[0]) * ry - (a[1] - p[1]) * rx) / den
    if -1e-9 <= t <= 1 + 1e-9 and -1e-9 <= s <= 1 + 1e-9:
        return [min(max(t, 0.0), 1.0)]
    return []


def hidden_line_view(faces, view):
    f = VIEWS[view]
    occluders = []
    for face in faces:
        proj = [f(*p) for p in face.pts]
        pl = _plane(proj)
        if pl is not None:
            poly2 = [(p[0], p[1]) for p in proj]
            xs = [p[0] for p in poly2]
            ys = [p[1] for p in poly2]
            occluders.append((poly2, pl, (min(xs), min(ys), max(xs), max(ys))))
    all_edges2 = [(poly[i], poly[(i + 1) % len(poly)])
                  for poly, _, _ in occluders for i in range(len(poly))]

    # unique drawable 3D edges
    seen = {}
    for face in faces:
        n = len(face.pts)
        for i in range(n):
            if not face.draw[i]:
                continue
            a, b = face.pts[i], face.pts[(i + 1) % n]
            key = tuple(sorted((tuple(round(c, 4) for c in a), tuple(round(c, 4) for c in b))))
            if key[0] == key[1]:
                continue
            seen.setdefault(key, face.layer)

    segments = []  # (layer, (u0,v0), (u1,v1))
    for (a, b), layer in seen.items():
        pa, pb = f(*a), f(*b)
        p2, q2 = (pa[0], pa[1]), (pb[0], pb[1])
        if math.hypot(q2[0] - p2[0], q2[1] - p2[1]) < 1e-6:
            continue  # edge seen end-on
        ts = {0.0, 1.0}
        for ea, eb in all_edges2:
            ts.update(_seg_params(p2, q2, ea, eb))
        ts = sorted(ts)
        runs = []
        for t0, t1 in zip(ts, ts[1:]):
            if t1 - t0 < 1e-7:
                continue
            tm = (t0 + t1) / 2
            u = p2[0] + (q2[0] - p2[0]) * tm
            v = p2[1] + (q2[1] - p2[1]) * tm
            w = pa[2] + (pb[2] - pa[2]) * tm
            hidden = False
            for poly, (A, B, C), (x0, y0, x1, y1) in occluders:
                if u < x0 or u > x1 or v < y0 or v > y1:
                    continue
                if A * u + B * v + C > w + 1e-4 and _inside_strict(poly, u, v):
                    hidden = True
                    break
            if not hidden:
                if runs and abs(runs[-1][1] - t0) < 1e-7:
                    runs[-1][1] = t1
                else:
                    runs.append([t0, t1])
        for t0, t1 in runs:
            s = (p2[0] + (q2[0] - p2[0]) * t0, p2[1] + (q2[1] - p2[1]) * t0)
            e = (p2[0] + (q2[0] - p2[0]) * t1, p2[1] + (q2[1] - p2[1]) * t1)
            segments.append((layer, s, e))
    return _dedupe(segments)


def _dedupe(segments):
    out, keys = [], set()
    for layer, s, e in segments:
        k = tuple(sorted((tuple(round(c, 3) for c in s), tuple(round(c, 3) for c in e))))
        if k not in keys:
            keys.add(k)
            out.append((layer, s, e))
    return out


def bbox(segments):
    xs = [p[0] for _, s, e in segments for p in (s, e)]
    ys = [p[1] for _, s, e in segments for p in (s, e)]
    return min(xs), min(ys), max(xs), max(ys)


# --------------------------------------------------------------- DXF sheet
def setup_doc():
    doc = ezdxf.new("R2010", setup=True)
    doc.units = ezdxf.units.IN
    doc.header["$MEASUREMENT"] = 0
    doc.header["$LUNITS"] = 4       # architectural
    doc.header["$LUPREC"] = 4
    doc.header["$INSUNITS"] = 1
    layers = {
        "A-FLOR": (8, 25),    # floor / carpet line
        "A-STRC": (7, 50),    # booth structure
        "A-DIMS": (1, 18),    # dimensions
        "A-ANNO": (7, 25),    # view titles, notes
        "A-TTLB": (7, 35),    # sheet border, title block
        "A-TTLB-THIN": (8, 13),
    }
    for name, (color, lw) in layers.items():
        doc.layers.add(name, color=color, lineweight=lw)
    doc.styles.add("ARCH-TXT", font="arial.ttf")
    txt = 3.0  # 1/8" at 1/2" = 1'-0"
    doc.dimstyles.new("ARCH", dxfattribs={
        "dimtxsty": "ARCH-TXT", "dimtxt": txt, "dimasz": 2.5, "dimexo": 1.5,
        "dimexe": 1.5, "dimgap": 1.0, "dimtad": 0, "dimtih": 1, "dimtoh": 1,
        "dimlunit": 4, "dimzin": 1, "dimdec": 4, "dimclrd": 1, "dimclre": 1,
        "dimclrt": 7, "dimtix": 1,
    })
    return doc


def add_segments(msp, segments, dx, dy):
    for layer, s, e in segments:
        msp.add_line((s[0] + dx, s[1] + dy), (e[0] + dx, e[1] + dy), dxfattribs={"layer": layer})


def dim(msp, p1, p2, base, vertical=False):
    d = msp.add_linear_dim(
        base=base, p1=p1, p2=p2, angle=90 if vertical else 0, dimstyle="ARCH",
        text=ft_in(abs((p2[1] - p1[1]) if vertical else (p2[0] - p1[0]))),
        dxfattribs={"layer": "A-DIMS"})
    d.render()


def text(msp, s, x, y, h, align="MIDDLE_CENTER", layer="A-ANNO", style="ARCH-TXT"):
    from ezdxf.enums import TextEntityAlignment
    t = msp.add_text(s, height=h, dxfattribs={"layer": layer, "style": style})
    t.set_placement((x, y), align=getattr(TextEntityAlignment, align))
    return t


def view_title(msp, title, cx, y, scale=True):
    text(msp, title, cx, y, 6.0)
    w = len(title) * 6.0 * 0.62
    msp.add_line((cx - w / 2, y - 5), (cx + w / 2, y - 5), dxfattribs={"layer": "A-ANNO"})
    if scale:
        text(msp, "SCALE: " + SCALE_LABEL, cx, y - 11, 3.5)


def callout_2d(msp, anchor, text_at, lines, h=3.5):
    """Leader from a dot at `anchor` to a short landing, then text lines."""
    ax, ay = anchor
    tx, ty = text_at
    right = tx >= ax
    land = (tx - 3 if right else tx + 3, ty)
    msp.add_line((ax, ay), land, dxfattribs={"layer": "A-ANNO"})
    msp.add_line(land, (tx - 0.5 if right else tx + 0.5, ty), dxfattribs={"layer": "A-ANNO"})
    dot = msp.add_hatch(dxfattribs={"layer": "A-ANNO"})
    dot.paths.add_edge_path().add_arc((ax, ay), radius=0.9, start_angle=0, end_angle=360)
    for i, line in enumerate(lines):
        text(msp, line, tx + (1 if right else -1), ty - i * h * 1.6,
             h if i == 0 else h * 0.85, align="MIDDLE_LEFT" if right else "MIDDLE_RIGHT")


def iso_callouts(msp, P, Q, posts):
    """Part labels on the isometric view, set in the empty corners of the
    iso's bounding box. P maps model (x, y, z) -> sheet; Q maps raw iso
    projection (u, v) -> sheet."""
    W, D = BOOTH_W, BOOTH_D
    ot, _, _ = triangle_geometry()
    y_front = D - FRAME_DEPTH
    fi = ft_in
    h = 3.0
    # top-left corner: canopy
    callout_2d(msp, P(ot[2][0], ot[2][1], TRI_TOP), Q(34, 118),
               ["TRIANGLE CANOPY", f"{fi(TRI_SIDE)} EQUILATERAL", f"TOP AT {fi(TRI_TOP)}"], h)
    # top-right corner: header beam
    callout_2d(msp, P(W / 2 + 24, D - HEADER_FROM_BACK - MEMBER / 2, FRAME_H), Q(128, 114),
               ["HEADER BEAM", f"{MEMBER:g}\" SQ., TOP AT {fi(FRAME_H)}"], h)
    # left, below the left frame: canopy posts
    callout_2d(msp, P(posts[0][0], posts[0][1] - TRI_POST / 2, 34), Q(33, 44),
               ["CANOPY POSTS (3)", f"{TRI_POST:g}\" SQ.", f"{fi(TRI_TOP - TRI_THICK)} CLEAR UNDER"], h)
    # bottom-left corner: front / aisle
    callout_2d(msp, P(W / 2, 0, 0), Q(22, -30), ["FRONT (AISLE)"], h)
    # bottom-right corner: side frame
    callout_2d(msp, P(W, y_front + MEMBER / 2, FRAME_H * 0.6), Q(132, -34),
               ["SIDE FRAME (TYP.)", f"{MEMBER:g}\" SQ. POSTS + RAIL", f"{fi(FRAME_H)} HIGH"], h)


def build_sheet(faces, posts):
    doc = setup_doc()
    msp = doc.modelspace()
    S = SCALE
    SW, SH = SHEET_W_IN * S, SHEET_H_IN * S
    margin = 0.5 * S
    tb_w = 4.25 * S

    # ---- border
    msp.add_lwpolyline([(0, 0), (SW, 0), (SW, SH), (0, SH)], close=True,
                       dxfattribs={"layer": "A-TTLB-THIN"})
    bx0, by0, bx1, by1 = margin, margin, SW - margin, SH - margin
    msp.add_lwpolyline([(bx0, by0), (bx1, by0), (bx1, by1), (bx0, by1)], close=True,
                       dxfattribs={"layer": "A-TTLB", "const_width": 0.04 * S})
    tbx = bx1 - tb_w
    msp.add_line((tbx, by0), (tbx, by1), dxfattribs={"layer": "A-TTLB"})

    # ---- views
    plan = hidden_line_view(faces, "plan")
    iso = hidden_line_view(faces, "iso")
    front = hidden_line_view(faces, "front")
    side = hidden_line_view(faces, "side")

    area_w = tbx - bx0
    col1_cx = bx0 + area_w * 0.27
    col2_cx = bx0 + area_w * 0.72
    row1_base = by0 + (by1 - by0) * 0.47   # bottom of top-row drawings
    row2_base = by0 + 2.6 * S              # floor line of elevations

    W, D = BOOTH_W, BOOTH_D
    ot, ob, inn = triangle_geometry()
    apex_y = ot[2][1]

    # PLAN ----------------------------------------------------------------
    pdx = col1_cx - W / 2
    pdy = row1_base + 2.1 * S
    add_segments(msp, plan, pdx, pdy)
    P = lambda x, y: (x + pdx, y + pdy)  # noqa: E731
    dim(msp, P(0, 0), P(W, 0), P(0, -18))                                  # 10'-0" width
    dim(msp, P(0, 0), P(0, D), P(-18, 0), vertical=True)                   # 10'-0" depth
    dim(msp, P(ot[0][0], ot[0][1]), P(ot[1][0], ot[1][1]), P(0, D + 16))   # triangle width
    dim(msp, P(W, D - FRAME_DEPTH), P(W, D), P(W + 18, 0), vertical=True)  # side frame depth
    dim(msp, P(ot[0][0], ot[0][1]), P(ot[0][0], D), P((MEMBER + ot[0][0]) / 2, 0), vertical=True)
    text(msp, "AISLE", P(W / 2, -30)[0], P(W / 2, -30)[1], 4.0)
    # part labels inside the plan
    hb = P(W / 2, D - HEADER_FROM_BACK / 2)
    text(msp, "HEADER BEAM (ABOVE)", hb[0], hb[1], 2.5)
    cen = P(W / 2, (ot[0][1] * 2 + ot[2][1]) / 3)
    text(msp, "TRIANGLE", cen[0], cen[1] + 2, 2.5)
    text(msp, "CANOPY ABOVE", cen[0], cen[1] - 2, 2.5)
    view_title(msp, "PLAN VIEW", P(W / 2, 0)[0], P(0, -42)[1])

    # ISOMETRIC -----------------------------------------------------------
    ix0, iy0, ix1, iy1 = bbox(iso)
    idx = col2_cx - (ix0 + ix1) / 2
    idy = by1 - 0.6 * S - iy1               # top of iso just under the border
    add_segments(msp, iso, idx, idy)
    iso_callouts(msp, lambda x, y, z: (VIEWS["iso"](x, y, z)[0] + idx,
                                       VIEWS["iso"](x, y, z)[1] + idy),
                 lambda u, v: (u + idx, v + idy), posts)
    view_title(msp, "ISOMETRIC VIEW", col2_cx, pdy - 42, scale=False)
    text(msp, "NOT TO SCALE", col2_cx, pdy - 53, 3.5)

    # FRONT ELEVATION -----------------------------------------------------
    fdx = col1_cx - W / 2
    fdy = row2_base
    add_segments(msp, front, fdx, fdy)
    F = lambda u, v: (u + fdx, v + fdy)  # noqa: E731
    dim(msp, F(0, 0), F(W, 0), F(0, -16))
    dim(msp, F(0, 0), F(0, FRAME_H), F(-16, 0), vertical=True)
    dim(msp, F(ot[1][0], 0), F(ot[1][0], TRI_TOP), F(W + 16, 0), vertical=True)
    view_title(msp, "FRONT ELEVATION", F(W / 2, 0)[0], F(0, -34)[1])

    # SIDE ELEVATION ------------------------------------------------------
    sdx = col2_cx - D / 2
    sdy = row2_base
    add_segments(msp, side, sdx, sdy)
    Sd = lambda u, v: (u + sdx, v + sdy)  # noqa: E731
    apex_post_front = posts[2][1] - TRI_POST / 2
    dim(msp, Sd(0, 0), Sd(D, 0), Sd(0, -16))
    dim(msp, Sd(apex_post_front, 0), Sd(D, 0), Sd(0, -26))
    dim(msp, Sd(0, 0), Sd(0, TRI_TOP), Sd(-16, 0), vertical=True)
    dim(msp, Sd(D, 0), Sd(D, FRAME_H), Sd(D + 16, 0), vertical=True)
    text(msp, "AISLE", Sd(-8, 0)[0], Sd(0, -6)[1], 3.0, align="MIDDLE_RIGHT")
    view_title(msp, "SIDE ELEVATION", Sd(D / 2, 0)[0], Sd(0, -44)[1])

    # ---- title block ----------------------------------------------------
    tx = tbx + 0.2 * S
    tcx = tbx + tb_w / 2

    def rule(y):
        msp.add_line((tbx, y), (bx1, y), dxfattribs={"layer": "A-TTLB"})

    y = by1 - 0.45 * S
    text(msp, "BOOTH CONCEPT", tcx, y, 0.28 * S, style="ARCH-TXT")
    y -= 0.4 * S
    text(msp, "10' x 10' EXHIBIT", tcx, y, 0.2 * S)
    y -= 0.35 * S
    rule(y)

    y -= 0.35 * S
    text(msp, "GENERAL NOTES", tx, y, 0.14 * S, align="MIDDLE_LEFT")
    notes = [
        "1. ALL STRUCTURE IS CONTAINED WITHIN THE",
        "   10'-0\" x 10'-0\" BOOTH FOOTPRINT. NOTHING",
        "   PROJECTS INTO THE AISLE.",
        f"2. MAX. OVERALL HEIGHT: {ft_in(TRI_TOP)} (TOP OF",
        "   TRIANGLE CANOPY).",
        f"3. SIDE FRAMES + HEADER BEAM: {ft_in(FRAME_H)} HIGH,",
        f"   {MEMBER:g}\" SQ. POSTS AND BEAMS.",
        f"4. TRIANGLE CANOPY: {ft_in(TRI_SIDE)} EQUILATERAL,",
        f"   {TRI_BAND:g}\" FRAME, {TRI_THICK:g}\" TAPERED FASCIA, ON",
        f"   (3) {TRI_POST:g}\" SQ. POSTS.",
        f"5. CLEAR HEIGHT UNDER CANOPY: {ft_in(TRI_TOP - TRI_THICK)}.",
        "6. MEMBER SIZES & MATERIALS ARE NOMINAL",
        "   (CONCEPT). FINAL BY FABRICATOR.",
        "7. EXHIBITOR TO VERIFY HEIGHT AND LINE-OF-",
        "   SIGHT LIMITS FOR THIS BOOTH TYPE IN THE",
        "   IAAPA EXPO EXHIBITOR MANUAL.",
        "8. DIMENSIONS GOVERN - DO NOT SCALE.",
    ]
    y -= 0.12 * S
    for line in notes:
        y -= 0.21 * S
        text(msp, line, tx, y, 0.1 * S, align="MIDDLE_LEFT")
    y -= 0.3 * S
    rule(y)

    rows = [
        ("PROJECT", PROJECT),
        ("SHOW", "IAAPA EXPO"),
        ("EXHIBITOR", ""),
        ("BOOTH NO.", ""),
        ("BOOTH SIZE", "10'-0\" x 10'-0\""),
        ("DRAWING", SHEET_TITLE),
        ("SCALE", SCALE_LABEL + " (ARCH C 24x18)"),
        ("DATE", datetime.date.today().strftime("%m/%d/%Y")),
    ]
    for label, value in rows:
        y -= 0.2 * S
        text(msp, label, tx, y, 0.085 * S, align="MIDDLE_LEFT")
        y -= 0.22 * S
        if value:
            if len(value) > 34:  # wrap long values onto two lines
                cut = value.rfind(" ", 0, 34)
                text(msp, value[:cut], tx, y, 0.12 * S, align="MIDDLE_LEFT")
                y -= 0.2 * S
                value = value[cut + 1:]
            text(msp, value, tx, y, 0.12 * S, align="MIDDLE_LEFT")
        y -= 0.12 * S
        rule(y)

    # sheet number box
    y_sheet = by0 + 0.9 * S
    rule(y_sheet)
    text(msp, "SHEET", tx, y_sheet - 0.2 * S, 0.085 * S, align="MIDDLE_LEFT")
    text(msp, "A-1", tcx, by0 + 0.35 * S, 0.3 * S)

    doc.set_modelspace_vport(height=SH * 1.02, center=(SW / 2, SH / 2))
    return doc, (SW, SH)


# ------------------------------------------------------------------ export
def export_pdf_png(doc, sheet_size, pdf_path, png_path):
    SW, SH = sheet_size
    cfg = Configuration(
        color_policy=ColorPolicy.BLACK,
        background_policy=BackgroundPolicy.WHITE,
        lineweight_policy=LineweightPolicy.ABSOLUTE,
        lineweight_scaling=1.0,
        min_lineweight=0.12,
    )
    for path, dpi in ((pdf_path, 300), (png_path, 110)):
        fig = plt.figure(figsize=(SHEET_W_IN, SHEET_H_IN))
        ax = fig.add_axes([0, 0, 1, 1])
        ctx = RenderContext(doc)
        Frontend(ctx, MatplotlibBackend(ax), config=cfg).draw_layout(doc.modelspace(), finalize=True)
        fig.set_size_inches(SHEET_W_IN, SHEET_H_IN)
        ax.set_xlim(0, SW)
        ax.set_ylim(0, SH)
        ax.set_aspect("equal")
        ax.axis("off")
        fig.savefig(path, dpi=dpi, facecolor="white")
        plt.close(fig)


def main():
    faces, posts = build_model()
    doc, size = build_sheet(faces, posts)
    base = os.path.join(OUT_DIR, "booth_10x10_drawing")
    doc.saveas(base + ".dxf")
    export_pdf_png(doc, size, base + ".pdf", base + ".png")
    print("wrote", base + ".{dxf,pdf,png}")


if __name__ == "__main__":
    main()
