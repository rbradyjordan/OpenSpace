"""
3D labels for the booth model: dimension lines and part callouts built as
real geometry (text is extruded from font outlines), so they show up in
every 3D format - USDZ, SketchUp DAE, AutoCAD DXF, GLB and the viewer.

Coordinates match generate_booth_10x10: inches, Z up, origin at the
front-left floor corner, front (aisle) along Y = 0.
"""

import math

import numpy as np
import trimesh
from matplotlib.font_manager import FontProperties
from matplotlib.textpath import TextPath
from shapely.geometry import MultiPolygon, Polygon

import generate_booth_10x10 as booth

FONT = FontProperties(family="DejaVu Sans", weight="bold")
CAP = 0.729          # DejaVu Sans cap height as a fraction of font size
DIM_TEXT = 5.0       # dimension text cap height, inches
NOTE_TEXT = 3.5      # callout text cap height
LINE_R = 0.35        # dimension / leader line radius
ARROW_L, ARROW_R = 4.0, 1.4
DEPTH = 0.4          # text extrusion


def _unit(v):
    v = np.asarray(v, float)
    return v / np.linalg.norm(v)


def text_mesh(s, origin, xdir, ydir, h, halign="center", valign="bottom"):
    """Extruded text lying in the plane spanned by xdir (reading direction)
    and ydir (up). The readable face points along xdir x ydir."""
    geom = None
    for ring in TextPath((0, 0), s, size=1, prop=FONT).to_polygons():
        if len(ring) < 3:
            continue
        p = Polygon(ring).buffer(0)
        geom = p if geom is None else geom.symmetric_difference(p)  # even-odd fill
    x0, y0, x1, y1 = geom.bounds
    dx = {"left": -x0, "center": -(x0 + x1) / 2, "right": -x1}[halign]
    dy = {"bottom": 0.0, "middle": -CAP / 2, "top": -CAP}[valign]
    polys = geom.geoms if isinstance(geom, MultiPolygon) else [geom]
    scale = h / CAP
    # extrude in font units so the final thickness is DEPTH inches after scaling
    parts = [trimesh.creation.extrude_polygon(p, DEPTH / scale) for p in polys if p.area > 1e-6]
    m = trimesh.util.concatenate(parts)
    m.apply_translation([dx, dy, -DEPTH / 2 / scale])
    m.apply_scale(scale)
    x, y = _unit(xdir), _unit(ydir)
    T = np.eye(4)
    T[:3, 0], T[:3, 1], T[:3, 2], T[:3, 3] = x, y, np.cross(x, y), origin
    m.apply_transform(T)
    return m


def rod(p, q, r=LINE_R):
    return trimesh.creation.cylinder(radius=r, segment=[p, q], sections=8)


def arrow(tip, direction):
    d = _unit(direction)
    c = trimesh.creation.cone(radius=ARROW_R, height=ARROW_L, sections=16)
    c.apply_transform(trimesh.geometry.align_vectors([0, 0, 1], d))
    c.apply_translation(np.asarray(tip, float) - d * ARROW_L)
    return c


def dimension(p1, p2, offset, text, xdir, ydir, text_side=1, beside=None):
    """Dimension p1->p2 drawn at `offset`, with extension lines, arrows and
    text in the plane (xdir, ydir). text_side=-1 puts text below the line.
    `beside` (a direction) instead sets the text next to the line's midpoint,
    which keeps text on vertical dimensions horizontal."""
    p1, p2, off = (np.asarray(v, float) for v in (p1, p2, offset))
    u = _unit(off)
    a, b = p1 + off, p2 + off
    parts = [
        rod(p1 + u * 1.5, a + u * 2.5),
        rod(p2 + u * 1.5, b + u * 2.5),
        rod(a, b),
        arrow(a, a - b),
        arrow(b, b - a),
    ]
    if beside is not None:
        side = _unit(beside)
        parts.append(text_mesh(text, (a + b) / 2 + side * 3.0, xdir, ydir, DIM_TEXT,
                               halign="left" if side @ _unit(xdir) > 0 else "right",
                               valign="middle"))
    else:
        mid = (a + b) / 2 + _unit(ydir) * 2.0 * text_side
        parts.append(text_mesh(text, mid, xdir, ydir, DIM_TEXT,
                               valign="bottom" if text_side > 0 else "top"))
    return trimesh.util.concatenate(parts)


# iso-facing plane for callouts: readable from the front-right corner
ISO_X = (1 / math.sqrt(2), 1 / math.sqrt(2), 0)
ISO_Y = (0, 0, 1)


def callout(lines, text_at, anchor, halign="left"):
    """Multi-line note at text_at with a leader to anchor (a dot at the end)."""
    text_at, anchor = np.asarray(text_at, float), np.asarray(anchor, float)
    parts = []
    lead = NOTE_TEXT * 1.55
    for i, line in enumerate(lines):
        o = text_at - np.array(ISO_Y) * lead * i
        parts.append(text_mesh(line, o, ISO_X, ISO_Y, NOTE_TEXT if i == 0 else NOTE_TEXT * 0.8,
                               halign=halign, valign="middle"))
    # leader starts just beside the first line of text
    side = -1 if halign == "left" else 1
    start = text_at + np.array(ISO_X) * side * 2.5
    parts.append(rod(start, anchor, r=0.3))
    parts.append(trimesh.creation.icosphere(subdivisions=1, radius=1.2).apply_translation(anchor))
    return trimesh.util.concatenate(parts)


def build_label_meshes():
    """[(name, 'label', mesh)] for all dimensions and callouts."""
    W, D = booth.BOOTH_W, booth.BOOTH_D
    fi = booth.ft_in
    ot, ob, inn = booth.triangle_geometry()
    posts = booth.build_parts()[1]
    y_front = D - booth.FRAME_DEPTH
    zt = booth.TRI_TOP
    z = 0.4  # lift floor annotations off the carpet
    X, Y, Z = (1, 0, 0), (0, 1, 0), (0, 0, 1)
    nX, nY = (-1, 0, 0), (0, -1, 0)

    labels = [
        # footprint, flat on the floor
        ("Label_Dim_Width", dimension((0, 0, z), (W, 0, z), (0, -20, 0), fi(W), X, Y, -1)),
        ("Label_Dim_Depth", dimension((W, 0, z), (W, D, z), (20, 0, 0), fi(D), Y, nX, -1)),
        # canopy width along its back edge, read from the front
        ("Label_Dim_Canopy_Width", dimension((*ot[0], zt), (*ot[1], zt), (0, 0, 14),
                                             fi(booth.TRI_SIDE), X, Z)),
        # overall height (top of canopy), left side, read from the front
        ("Label_Dim_Overall_Height", dimension((ot[0][0], ot[0][1], 0), (ot[0][0], ot[0][1], zt),
                                               (-(ot[0][0] + 20), 0, 0), fi(zt), X, Z, beside=nX)),
        # side frame height and depth, right side, read from the right
        ("Label_Dim_Frame_Height", dimension((W, D, 0), (W, D, booth.FRAME_H),
                                             (0, 20, 0), fi(booth.FRAME_H), Y, Z, beside=Y)),
        ("Label_Dim_Frame_Depth", dimension((W, y_front, booth.FRAME_H), (W, D, booth.FRAME_H),
                                            (0, 0, 14), fi(booth.FRAME_DEPTH), Y, Z)),
    ]

    # part callouts, facing the front-right isometric view
    apex = (ot[2][0], ot[2][1], zt)
    labels += [
        ("Label_Canopy", callout(
            ["TRIANGLE CANOPY", f"{fi(booth.TRI_SIDE)} EQUILATERAL, TOP AT {fi(zt)}"],
            (-14, -44, zt + 34), apex, halign="right")),
        ("Label_Side_Frame", callout(
            ["SIDE FRAME (TYP. BOTH SIDES)", f"{booth.MEMBER:g}\" SQ. POSTS + RAIL, {fi(booth.FRAME_H)} HIGH"],
            (W + 44, y_front - 6, 44), (W, y_front + booth.MEMBER / 2, 58))),
        ("Label_Header_Beam", callout(
            ["HEADER BEAM"],
            (W / 2 + 16, D + 30, booth.FRAME_H + 34), (W / 2 + 16, D - booth.HEADER_FROM_BACK - 3,
                                                      booth.FRAME_H))),
        ("Label_Canopy_Posts", callout(
            ["CANOPY POSTS (3)", f"{booth.TRI_POST:g}\" SQ., CLEAR UNDER {fi(zt - booth.TRI_THICK)}"],
            (-40, -20, 34), (posts[0][0], posts[0][1] - booth.TRI_POST / 2, 34), halign="right")),
        ("Label_Front", text_mesh("FRONT  (AISLE)", (W / 2, -44, z), X, Y, 6.0, valign="middle")),
    ]
    return [(name, "label", m) for name, m in labels]
