# IAAPA Expo – 10' x 10' booth concept drawing

A 10' x 10' version of the 20' x 20' triangle-canopy booth: two side frames on
the back half, a header beam between them, and a raised triangular canopy on
three posts. Everything stays inside the 10' x 10' footprint and under 8'-0".

### Shareable images (same layout as the original 20' x 20' drawing)

| File | What it is |
|---|---|
| `booth_10x10_views.png` / `.jpg` | Plan, isometric, front and side elevations on a white background, with dimensions and labels. 3000 px wide; the JPG is smaller for texting/email. |
| `booth_10x10_plan.png`, `_iso.png`, `_front.png`, `_side.png` | Each view on its own. |

### 3D model (open one of these to orbit the booth)

| File | Open it with |
|---|---|
| `booth_10x10.usdz` | **Mac / iPhone / iPad**: double-click, or select and press Space (Quick Look). |
| `booth_10x10_viewer.html` | **Any browser**: double-click, then drag to orbit (needs internet for three.js). |
| `booth_10x10.dae` | **SketchUp**: File > Import (Collada). |
| `booth_10x10_3d.dxf` | **AutoCAD**: one MESH solid per part, opens in an isometric view. Inches, Z up. |
| `booth_10x10.glb` | Windows 3D Viewer, Blender, web viewers. |
| `booth_10x10.obj` / `.mtl`, `booth_10x10.stl` | Any 3D/CAD tool. Inches, Z up. |
| `booth_10x10_3d_views.png` | Quick shaded preview. |

The 3D files include labels (blue): dimension lines for the footprint,
heights, canopy size and side-frame depth, plus callouts naming each part
and marking the front/aisle side. In SketchUp/AutoCAD they are separate
objects named `Label_*` (layer `3D-LABEL` in the DXF) so they can be hidden;
the browser viewer has a Labels button. The STL has no labels.

### 2D drawing sheet

| File | What it is |
|---|---|
| `booth_10x10_drawing.pdf` | Print/submit-ready sheet A-1 (ARCH C 24"x18", 1/2" = 1'-0"): plan, front and side elevations, isometric. Also prints fine scaled to 11x17. |
| `booth_10x10_drawing.dxf` | Same sheet as a CAD file. Model units are inches; layers `A-STRC`, `A-FLOR`, `A-DIMS`, `A-ANNO`, `A-TTLB`. |
| `booth_10x10_drawing.png` | Preview image of the sheet. |

### Source

`generate_booth_10x10.py` holds all the dimensions (the `PARAMETERS` block)
and builds the 2D sheet. `export_3d.py` builds the 3D files from the same
geometry, so the model and drawing always match; `labels_3d.py` builds the
3D dimensions and callouts. `viewer_template.html` is
the browser viewer's page.

## Key dimensions

- Booth: 10'-0" x 10'-0"
- Side frames + header beam: 7'-6" high, 5'-3" deep from the back line, 6" sq. members
- Header beam: 1'-0" in from the back line
- Triangle canopy: 6'-9" equilateral, 8" frame, 5" tapered fascia, top at 8'-0"
  (7'-7" clear underneath), back edge 4'-0" from the back line, on (3) 5" sq. posts

Member sizes are concept values scaled from the 20' x 20' drawing. Check the
height and line-of-sight rules for this booth type in the IAAPA Expo
exhibitor manual before submitting.

## Regenerate

```
pip install ezdxf matplotlib trimesh networkx shapely mapbox_earcut usd-core pycollada
python3 generate_booth_10x10.py   # 2D sheet + shareable images
python3 export_3d.py              # 3D model files + viewer
```
