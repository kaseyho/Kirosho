/** M0 parametric diagnostic prop. Owns mesh/collider and SIK movement; no app UI. */
import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import {InteractableManipulation} from "SpectaclesInteractionKit.lspkg/Components/Interaction/InteractableManipulation/InteractableManipulation"

@component
export class ShadeShiftSmokeCube extends BaseScriptComponent {
  @ui.label("ShadeShift M0 - draggable diagnostic cube")
  @ui.separator
  @input
  @hint("Official bundled vertex-color material")
  material!: Material

  @input
  @hint("Side length of both visual and collision box in centimetres")
  @widget(new SliderWidget(6, 12, 0.5))
  sideCm: number = 8

  @input("vec4", "{0.2,0.9,1,1}")
  @widget(new ColorWidget())
  @hint("Color of the diagnostic prop")
  tint: vec4

  @input
  @hint("Show the collision box for debugging; keep off for capture")
  debugColliders: boolean = false

  private manipulation!: InteractableManipulation
  private dragCount = 0

  onAwake(): void {
    if (!this.material) return
    const mesh = this.sceneObject.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    const builder = new MeshBuilder([
      {name: "position", components: 3},
      {name: "normal", components: 3, normalized: true},
      {name: "color", components: 4}
    ])
    builder.topology = MeshTopology.Triangles
    builder.indexType = MeshIndexType.UInt16
    const half = this.sideCm / 2
    const vertices: number[] = []
    const indices: number[] = []
    let index = 0
    const face = (p0: number[], p1: number[], p2: number[], p3: number[], normal: number[], shade: number) => {
      const color = [this.tint.x * shade, this.tint.y * shade, this.tint.z * shade, this.tint.w]
      vertices.push(...p0, ...normal, ...color, ...p1, ...normal, ...color,
        ...p2, ...normal, ...color, ...p3, ...normal, ...color)
      indices.push(index, index + 1, index + 2, index, index + 2, index + 3)
      index += 4
    }
    // CCW winding, 24 per-face vertices. Brightness differences expose the 3D faces.
    face([half,-half,-half],[half,half,-half],[half,half,half],[half,-half,half],[1,0,0],0.75)
    face([-half,-half,half],[-half,half,half],[-half,half,-half],[-half,-half,-half],[-1,0,0],0.65)
    face([-half,half,-half],[-half,half,half],[half,half,half],[half,half,-half],[0,1,0],1)
    face([-half,-half,half],[-half,-half,-half],[half,-half,-half],[half,-half,half],[0,-1,0],0.6)
    face([-half,-half,half],[half,-half,half],[half,half,half],[-half,half,half],[0,0,1],0.9)
    face([half,-half,-half],[-half,-half,-half],[-half,half,-half],[half,half,-half],[0,0,-1],0.7)
    builder.appendVerticesInterleaved(vertices)
    builder.appendIndices(indices)
    mesh.mesh = builder.getMesh()
    mesh.mainMaterial = this.material
    builder.updateMesh()
    const collider = this.sceneObject.createComponent("Physics.ColliderComponent")
    const shape = Shape.createBoxShape()
    shape.size = new vec3(this.sideCm, this.sideCm, this.sideCm)
    collider.shape = shape
    collider.intangible = false
    collider.debugDrawEnabled = this.debugColliders
    const interactable = this.sceneObject.createComponent(Interactable.getTypeName()) as Interactable
    interactable.targetingMode = 3
    this.manipulation = this.sceneObject.createComponent(InteractableManipulation.getTypeName()) as InteractableManipulation
    this.createEvent("OnStartEvent").bind(() => {
      this.manipulation.onManipulationEnd.add(() => {
        this.dragCount += 1
        const position = this.sceneObject.getTransform().getWorldPosition()
        console.info(`[ShadeShiftSmoke] dragCount=${this.dragCount} position=${position.toString()}`)
      })
    })
  }
}
