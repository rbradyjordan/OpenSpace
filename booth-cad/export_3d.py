"""
Export the 10' x 10' booth as a solid 3D model.

  booth_10x10_3d.dxf    AutoCAD 3D (one MESH solid per part, opens in an
                        isometric view), inches, Z up
  booth_10x10.dae       SketchUp / Collada, meters, Y up
  booth_10x10.usdz      Mac / iPhone Quick Look (double-click or spacebar)
  booth_10x10.glb       Web / Windows 3D Viewer / Blender, meters, Y up
  booth_10x10.obj/.mtl  Universal mesh, inches, Z up
  booth_10x10.stl       Universal mesh, inches, Z up
  booth_10x10_3d_views.png  shaded preview renders
  booth_10x10_viewer.html   interactive 3D viewer (double-click to open in
                            any browser; needs internet for three.js)

Geometry comes from generate_booth_10x10.build_parts(), so the 3D model and
the 2D drawing always match. Run:
    pip install ezdxf matplotlib trimesh networkx usd-core pycollada
    python3 export_3d.py
"""

import base64
import os
import sys

import ezdxf
import numpy as np
import trimesh
from ezdxf.render import MeshBuilder

import generate_booth_10x10 as booth

OUT = booth.OUT_DIR
INCH = 0.0254
CARPET_T = 0.5  # carpet pad thickness below the floor line, inches

# name -> (RGBA 0-255, DXF colour index)
MATERIALS = {
    "frame": ((46, 46, 48, 255), 250),
    "canopy": ((242, 242, 240, 255), 7),
    "carpet": ((140, 146, 154, 255), 8),
}


def linear_rgba(rgba):
    """sRGB 0-255 -> linear 0-1; glTF baseColorFactor and USD diffuseColor
    are linear, so passing sRGB values straight through washes colours out."""
    def lin(c):
        c /= 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return [lin(c) for c in rgba[:3]] + [rgba[3] / 255]


def part_meshes():
    """[(name, kind, trimesh.Trimesh)] in inches, Z up, origin front-left."""
    parts, _ = booth.build_parts()
    W, D = booth.BOOTH_W, booth.BOOTH_D
    out = [("Carpet", "carpet", trimesh.creation.box(
        bounds=[[0, 0, -CARPET_T], [W, D, 0]]))]
    for name, kind, faces in parts:
        verts, tris = [], []
        for f in faces:
            base = len(verts)
            verts += f.pts
            for k in range(1, len(f.pts) - 1):   # fan-triangulate convex faces
                tris.append([base, base + k, base + k + 1])
        m = trimesh.Trimesh(np.array(verts), np.array(tris), process=True)
        m.merge_vertices()
        trimesh.repair.fix_normals(m)            # consistent, outward winding
        assert m.is_watertight and m.is_volume, f"{name} is not a closed solid"
        out.append((name, kind, m))
    return out


def to_meters_yup(m):
    """Inches/Z-up/front-left origin -> meters/Y-up/floor-centre origin, with
    the booth front facing +Z (toward the default camera in most viewers)."""
    m = m.copy()
    T = np.eye(4)
    T[:3, 3] = [-booth.BOOTH_W / 2, -booth.BOOTH_D / 2, 0]
    R = np.array([[1, 0, 0, 0], [0, 0, 1, 0], [0, -1, 0, 0], [0, 0, 0, 1]], float)
    S = np.diag([INCH, INCH, INCH, 1])
    m.apply_transform(S @ R @ T)
    return m


def flat(m):
    """Unshare vertices so viewers shade every face flat (crisp box edges)."""
    m = m.copy()
    m.unmerge_vertices()
    return m


def scene(meshes, meters_yup):
    sc = trimesh.Scene()
    for name, kind, m in meshes:
        g = flat(to_meters_yup(m) if meters_yup else m)
        g.visual = trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(
            name=kind, baseColorFactor=linear_rgba(MATERIALS[kind][0]),
            metallicFactor=0.0, roughnessFactor=0.8))
        sc.add_geometry(g, node_name=name, geom_name=name)
    return sc


# ------------------------------------------------------------------ writers
def write_dxf(meshes, path):
    doc = ezdxf.new("R2010", setup=True)
    doc.units = ezdxf.units.IN
    doc.header["$INSUNITS"] = 1
    doc.header["$LUNITS"] = 4
    for kind, (_, aci) in MATERIALS.items():
        doc.layers.add(f"3D-{kind.upper()}", color=aci)
    msp = doc.modelspace()
    for name, kind, m in meshes:
        mb = MeshBuilder()
        mb.vertices = [tuple(v) for v in m.vertices]
        mb.faces = [tuple(int(i) for i in f) for f in m.faces]
        mb.render_mesh(msp, dxfattribs={"layer": f"3D-{kind.upper()}"})
    # open looking at the booth from the front-right, above (SE isometric)
    W, D, H = booth.BOOTH_W, booth.BOOTH_D, booth.TRI_TOP
    doc.set_modelspace_vport(height=max(W, D, H) * 1.8, center=(0, 0))
    vp = doc.viewports.get("*Active")[0]
    vp.dxf.direction = (1, -1, 1)
    vp.dxf.target = (W / 2, D / 2, H / 2)
    vp.dxf.center = (0, 0)
    doc.saveas(path)


def write_usdz(meshes, path):
    from pxr import Gf, Sdf, Usd, UsdGeom, UsdShade, UsdUtils

    usdc = path[:-1] + "c"
    stage = Usd.Stage.CreateNew(usdc)
    UsdGeom.SetStageUpAxis(stage, UsdGeom.Tokens.y)
    UsdGeom.SetStageMetersPerUnit(stage, 1.0)
    root = UsdGeom.Xform.Define(stage, "/Booth")
    stage.SetDefaultPrim(root.GetPrim())

    mats = {}
    for kind, (rgba, _) in MATERIALS.items():
        mat = UsdShade.Material.Define(stage, f"/Booth/Materials/{kind}")
        sh = UsdShade.Shader.Define(stage, f"/Booth/Materials/{kind}/PBR")
        sh.CreateIdAttr("UsdPreviewSurface")
        sh.CreateInput("diffuseColor", Sdf.ValueTypeNames.Color3f).Set(
            Gf.Vec3f(*linear_rgba(rgba)[:3]))
        sh.CreateInput("roughness", Sdf.ValueTypeNames.Float).Set(0.8)
        sh.CreateInput("metallic", Sdf.ValueTypeNames.Float).Set(0.0)
        mat.CreateSurfaceOutput().ConnectToSource(sh.ConnectableAPI(), "surface")
        mats[kind] = mat

    for name, kind, m in meshes:
        g = flat(to_meters_yup(m))
        mesh = UsdGeom.Mesh.Define(stage, f"/Booth/{name}")
        mesh.CreatePointsAttr([Gf.Vec3f(*map(float, v)) for v in g.vertices])
        mesh.CreateFaceVertexCountsAttr([3] * len(g.faces))
        mesh.CreateFaceVertexIndicesAttr([int(i) for i in g.faces.flatten()])
        mesh.CreateNormalsAttr([Gf.Vec3f(*map(float, n)) for n in np.repeat(g.face_normals, 3, axis=0)])
        mesh.SetNormalsInterpolation(UsdGeom.Tokens.faceVarying)
        mesh.CreateSubdivisionSchemeAttr(UsdGeom.Tokens.none)
        mesh.CreateDoubleSidedAttr(False)
        UsdShade.MaterialBindingAPI.Apply(mesh.GetPrim()).Bind(mats[kind])
    stage.GetRootLayer().Save()
    assert UsdUtils.CreateNewARKitUsdzPackage(Sdf.AssetPath(usdc), path), "usdz packaging failed"
    os.remove(usdc)


def write_obj(meshes, path):
    mtl = os.path.splitext(path)[0] + ".mtl"
    with open(mtl, "w") as f:
        for kind, (rgba, _) in MATERIALS.items():
            r, g, b = (c / 255 for c in rgba[:3])
            f.write(f"newmtl {kind}\nKd {r:.4f} {g:.4f} {b:.4f}\nKa 0 0 0\nd 1\nillum 1\n\n")
    with open(path, "w") as f:
        f.write("# 10' x 10' booth - units: inches, Z up\n")
        f.write(f"mtllib {os.path.basename(mtl)}\n")
        base = 1
        for name, kind, m in meshes:
            f.write(f"o {name}\nusemtl {kind}\n")
            for v in m.vertices:
                f.write(f"v {v[0]:.4f} {v[1]:.4f} {v[2]:.4f}\n")
            for t in m.faces:
                f.write("f {} {} {}\n".format(*(int(i) + base for i in t)))
            base += len(m.vertices)


def render_preview(meshes, path):
    """Shaded renders from four corners, to eyeball the model."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from mpl_toolkits.mplot3d.art3d import Poly3DCollection

    light = np.array([0.4, -0.6, 0.9])
    light /= np.linalg.norm(light)
    fig = plt.figure(figsize=(16, 12))
    views = [(-60, 25, "FRONT-RIGHT"), (-120, 25, "FRONT-LEFT"),
             (-90, 8, "FRONT (LOW)"), (60, 30, "BACK-RIGHT")]
    for k, (azim, elev, title) in enumerate(views):
        ax = fig.add_subplot(2, 2, k + 1, projection="3d")
        for _, kind, m in meshes:
            tris = m.vertices[m.faces]
            shade = 0.45 + 0.55 * np.clip(m.face_normals @ light, 0, 1)
            base = np.array(MATERIALS[kind][0][:3]) / 255
            cols = np.clip(base[None, :] * shade[:, None] + 0.08, 0, 1)
            ax.add_collection3d(Poly3DCollection(tris, facecolors=cols, edgecolors=(0, 0, 0, 0.35),
                                                 linewidths=0.3))
        ax.set_xlim(-10, 130)
        ax.set_ylim(-10, 130)
        ax.set_zlim(0, 140)
        ax.set_box_aspect((1, 1, 1))
        ax.view_init(elev=elev, azim=azim)
        ax.set_axis_off()
        ax.set_title(title)
    fig.tight_layout()
    fig.savefig(path, dpi=90, facecolor="white")
    plt.close(fig)


def write_viewer(glb_path, out_path, full_document=True):
    """Fill viewer_template.html with the GLB and the key dimensions."""
    with open(os.path.join(OUT, "viewer_template.html")) as f:
        html = f.read()
    with open(glb_path, "rb") as f:
        glb = base64.b64encode(f.read()).decode("ascii")
    fi = booth.ft_in
    for key, val in {
        "__TRI_TOP__": fi(booth.TRI_TOP),
        "__FRAME_H__": fi(booth.FRAME_H),
        "__FRAME_DEPTH__": fi(booth.FRAME_DEPTH),
        "__TRI_SIDE__": fi(booth.TRI_SIDE),
        "__TRI_CLEAR__": fi(booth.TRI_TOP - booth.TRI_THICK),
        "__MEMBER__": f'{booth.MEMBER:g}"',
        "__TRI_POST__": f'{booth.TRI_POST:g}"',
        "__GLB_BASE64__": glb,
    }.items():
        html = html.replace(key, val)
    if full_document:
        html = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
                '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
                '<style>body{margin:0}</style>\n</head>\n<body>\n' + html + '\n</body>\n</html>\n')
    with open(out_path, "w") as f:
        f.write(html)


def main():
    meshes = part_meshes()
    p = lambda n: os.path.join(OUT, n)  # noqa: E731

    write_dxf(meshes, p("booth_10x10_3d.dxf"))
    scene(meshes, meters_yup=True).export(p("booth_10x10.glb"))
    with open(p("booth_10x10.dae"), "wb") as f:
        f.write(trimesh.exchange.dae.export_collada(list(scene(meshes, meters_yup=True).geometry.values())))
    write_usdz(meshes, p("booth_10x10.usdz"))
    write_obj(meshes, p("booth_10x10.obj"))
    trimesh.util.concatenate([m for _, _, m in meshes]).export(p("booth_10x10.stl"))
    render_preview(meshes, p("booth_10x10_3d_views.png"))
    write_viewer(p("booth_10x10.glb"), p("booth_10x10_viewer.html"))
    if len(sys.argv) > 1:  # optional: body-only copy for publishing as a web page
        write_viewer(p("booth_10x10.glb"), sys.argv[1], full_document=False)
    print("wrote 3D model:", ", ".join(sorted(
        f for f in os.listdir(OUT) if f.startswith("booth_10x10") and "drawing" not in f)))


if __name__ == "__main__":
    main()
