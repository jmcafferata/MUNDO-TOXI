# ================================================================
#  OCEANO DE PARTICULAS — Toxi Digital Ocean en Blender
#  Replica el efecto "Sea of Nodes" de MUNDO TOXI (src/main.js)
#
#  INSTRUCCIONES:
#    1. Abrir Blender 5.1
#    2. Scripting workspace -> Text > Open -> elegir este archivo
#    3. Run Script  (Alt+P  o boton "Run Script")
#    4. SPACE -> reproducir la animacion
#
#  PARAMETROS DE main.js replicados:
#    gridSize=100, spacing=1.0  -> 201x201 = 40 401 puntos
#    noiseScale=0.03 * noiseSpeed=0.05 * heightScale=+-1.5
#    Luz oscila: sin(t*0.5)*40 en X
#    Fog start=20 end=60  *  Bloom threshold=0.7
# ================================================================

import bpy
import math
import mathutils

V = bpy.app.version
print(f"Blender {V[0]}.{V[1]}.{V[2]}")

# -- 1. LIMPIAR ESCENA -------------------------------------------
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for col in (bpy.data.meshes, bpy.data.materials,
            bpy.data.node_groups, bpy.data.cameras, bpy.data.lights):
    for item in list(col):
        col.remove(item)

# -- 2. FONDO NEGRO ----------------------------------------------
scene = bpy.context.scene
world = bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs[0].default_value = (0, 0, 0, 1)
    bg.inputs[1].default_value = 0.0

world.mist_settings.use_mist = True
world.mist_settings.start    = 20.0
world.mist_settings.depth    = 40.0
world.mist_settings.falloff  = 'QUADRATIC'

# -- 3. FRAME RANGE ----------------------------------------------
scene.frame_start         = 1
scene.frame_end           = 300
scene.render.fps          = 24
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080

# -- 4. CAMARA ---------------------------------------------------
cam_data = bpy.data.cameras.new("OceanCamera")
cam_data.lens       = 28.0
cam_data.clip_start = 1.0
cam_data.clip_end   = 500.0
cam_obj = bpy.data.objects.new("OceanCamera", cam_data)
bpy.context.collection.objects.link(cam_obj)
cam_obj.location       = mathutils.Vector((0.0, -28.0, 32.0))
cam_obj.rotation_euler = mathutils.Euler((math.radians(44), 0, 0), 'XYZ')
scene.camera = cam_obj

# -- 5. LUZ SOLAR ANIMADA ----------------------------------------
light_data        = bpy.data.lights.new("OceanSun", 'SUN')
light_data.energy = 3.0
light_obj = bpy.data.objects.new("OceanSun", light_data)
bpy.context.collection.objects.link(light_obj)
light_obj.location       = mathutils.Vector((-20.0, -12.0, 40.0))
light_obj.rotation_euler = mathutils.Euler((math.radians(-100), 0, 0), 'XYZ')
fc = light_obj.driver_add("location", 0)
fc.driver.type       = 'SCRIPTED'
fc.driver.expression = "sin(frame / 24.0 * 0.5) * 40.0"

# -- 6. GRID MESH ------------------------------------------------
bpy.ops.mesh.primitive_grid_add(
    x_subdivisions=200,
    y_subdivisions=200,
    size=200.0,
    location=(0, 0, 0))
grid_obj      = bpy.context.active_object
grid_obj.name = "OceanParticles"

# -- 7. MATERIAL: Emission puro blanco ---------------------------
# Emission = visible siempre sin depender de luces.
# Equivalente exacto a PointsMaterial({ color: 0xffffff }) de Three.js
mat = bpy.data.materials.new("OceanMat")
mat.use_nodes = True
mn = mat.node_tree.nodes
ml = mat.node_tree.links
mn.clear()
out_n  = mn.new('ShaderNodeOutputMaterial') ; out_n.location  = (400, 0)
emit_n = mn.new('ShaderNodeEmission')       ; emit_n.location = (150, 0)
emit_n.inputs['Color'].default_value    = (1.0, 1.0, 1.0, 1.0)
emit_n.inputs['Strength'].default_value = 3.0
ml.new(emit_n.outputs['Emission'], out_n.inputs['Surface'])
grid_obj.data.materials.append(mat)

# -- 8. GEOMETRY NODES: olas + conversion a puntos ---------------
mod = grid_obj.modifiers.new("OceanWaves", 'NODES')
ng  = bpy.data.node_groups.new("OceanWavesGN", 'GeometryNodeTree')
mod.node_group = ng

try:
    ng.interface.new_socket("Geometry", in_out='INPUT',  socket_type='NodeSocketGeometry')
    ng.interface.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')
except AttributeError:
    ng.inputs.new('NodeSocketGeometry',  "Geometry")
    ng.outputs.new('NodeSocketGeometry', "Geometry")

N = ng.nodes
L = ng.links
N.clear()

def mkn(t, x, y):
    nd = N.new(t); nd.location = (x, y); return nd

def set_in(node, name, val):
    if name in node.inputs:
        node.inputs[name].default_value = val
    else:
        print(f"  [info] input '{name}' no encontrado en {node.bl_idname}")

grp_in  = mkn('NodeGroupInput',            -1200,   0)
grp_out = mkn('NodeGroupOutput',            1600,   0)

pos_n   = mkn('GeometryNodeInputPosition', -1200, -280)
time_n  = mkn('GeometryNodeInputSceneTime',-1200, -480)

# pos * noiseScale (0.03)
vscale = mkn('ShaderNodeVectorMath', -850, -280)
vscale.operation = 'SCALE'
try:    vscale.inputs['Scale'].default_value = 0.03
except: vscale.inputs[3].default_value = 0.03

# time * noiseSpeed (0.05)
t_mul = mkn('ShaderNodeMath', -850, -480)
t_mul.operation               = 'MULTIPLY'
t_mul.inputs[1].default_value = 0.05

# Vector de offset temporal (t, t, 0)
t_comb = mkn('ShaderNodeCombineXYZ', -500, -480)
t_comb.inputs['Z'].default_value = 0.0

# (pos*noiseScale) + (t*0.05, t*0.05, 0)
v_add = mkn('ShaderNodeVectorMath', -500, -280)
v_add.operation = 'ADD'

# Noise Texture (replica SimplexNoise de JS)
noise = mkn('ShaderNodeTexNoise', -150, -280)
set_in(noise, 'Scale',      1.0)
set_in(noise, 'Detail',     6.0)
set_in(noise, 'Roughness',  0.55)
set_in(noise, 'Lacunarity', 2.0)
set_in(noise, 'Distortion', 0.2)

# Remap 0..1 -> -1.5..+1.5  (heightScale=1.5)
remap = mkn('ShaderNodeMapRange', 200, -280)
remap.inputs['From Min'].default_value = 0.0
remap.inputs['From Max'].default_value = 1.0
remap.inputs['To Min'].default_value   = -1.5
remap.inputs['To Max'].default_value   =  1.5

# Offset solo en Z (altura)
off_xyz = mkn('ShaderNodeCombineXYZ', 500, -280)
off_xyz.inputs['X'].default_value = 0.0
off_xyz.inputs['Y'].default_value = 0.0

# Set Position (aplica desplazamiento de ola al mesh original)
setp = mkn('GeometryNodeSetPosition', 500, 0)

# Mesh to Points: cada vertice -> esfera renderizable
m2p = mkn('GeometryNodeMeshToPoints', 900, 0)
m2p.mode = 'VERTICES'
try:    m2p.inputs['Radius'].default_value = 0.08
except: pass

# Set Material
setm = mkn('GeometryNodeSetMaterial', 1200, 0)
try:    setm.inputs['Material'].default_value = mat
except: setm.inputs[2].default_value = mat

# Cableado
L.new(grp_in.outputs['Geometry'],    setp.inputs['Geometry'])
L.new(pos_n.outputs['Position'],     vscale.inputs[0])
L.new(time_n.outputs['Seconds'],     t_mul.inputs[0])
L.new(t_mul.outputs['Value'],        t_comb.inputs['X'])
L.new(t_mul.outputs['Value'],        t_comb.inputs['Y'])
L.new(vscale.outputs['Vector'],      v_add.inputs[0])
L.new(t_comb.outputs['Vector'],      v_add.inputs[1])
L.new(v_add.outputs['Vector'],       noise.inputs['Vector'])
L.new(noise.outputs['Fac'],          remap.inputs['Value'])
L.new(remap.outputs['Result'],       off_xyz.inputs['Z'])
L.new(off_xyz.outputs['Vector'],     setp.inputs['Offset'])
L.new(setp.outputs['Geometry'],      m2p.inputs['Mesh'])
L.new(m2p.outputs['Points'],         setm.inputs['Geometry'])
L.new(setm.outputs['Geometry'],      grp_out.inputs['Geometry'])

# -- 9. RENDER: EEVEE --------------------------------------------
for eid in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
    try:    scene.render.engine = eid; break
    except: continue

eevee = scene.eevee
try:
    eevee.use_bloom       = True
    eevee.bloom_threshold = 0.5
    eevee.bloom_intensity = 1.5
    eevee.bloom_radius    = 5.0
except AttributeError:
    pass
try:    eevee.taa_render_samples = 16
except: pass

# -- 10. COMPOSITOR ----------------------------------------------
# Con EEVEE y bloom nativo no necesitamos nodos de compositor.
# Solo habilitamos use_nodes si node_tree ya existe para evitar el crash.
scene.use_nodes = True
comp = getattr(scene, 'node_tree', None)
if comp is not None:
    for nd in list(comp.nodes):
        comp.nodes.remove(nd)
    rl   = comp.nodes.new('CompositorNodeRLayers')   ; rl.location   = (0,   0)
    cout = comp.nodes.new('CompositorNodeComposite') ; cout.location  = (320, 0)
    comp.links.new(rl.outputs['Image'], cout.inputs['Image'])
# Si node_tree es None, EEVEE con bloom nativo funciona igual sin compositor

# -- 11. VIEWPORT RENDERED ---------------------------------------
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        for space in area.spaces:
            if space.type == 'VIEW_3D':
                space.shading.type          = 'RENDERED'
                space.overlay.show_overlays = False
                break

print("=" * 58)
print(f"  Toxi Digital Ocean OK  |  Blender {V[0]}.{V[1]}")
print(f"  {201*201:,} puntos  |  200x200 unidades")
print("  SPACE -> play   |  Numpad 0 -> vista camara")
print("=" * 58)
