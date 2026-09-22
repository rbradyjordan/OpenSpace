# IAAPA Expo – 10' x 10' booth concept drawing

A 10' x 10' version of the 20' x 20' triangle-canopy booth: two side frames on
the back half, a header beam between them, and a raised triangular canopy on
three posts. Everything stays inside the 10' x 10' footprint and under 8'-0".

| File | What it is |
|---|---|
| `booth_10x10_drawing.pdf` | Print/submit-ready sheet A-1 (ARCH C 24"x18", 1/2" = 1'-0"). Also prints fine scaled to 11x17. |
| `booth_10x10_drawing.dxf` | Same sheet as a CAD file (opens in AutoCAD, Vectorworks, SketchUp, DraftSight, LibreCAD). Model units are inches; layers `A-STRC`, `A-FLOR`, `A-DIMS`, `A-ANNO`, `A-TTLB`. |
| `booth_10x10_3d.dxf` | 3D model of the structure (3DFACE surfaces) for orbiting/rendering. |
| `booth_10x10_drawing.png` | Quick preview image. |
| `generate_booth_10x10.py` | Parametric source. Edit the `PARAMETERS` block and re-run to regenerate everything. |

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
pip install ezdxf matplotlib
python3 generate_booth_10x10.py
```
