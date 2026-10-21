import Event from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import {InteractableManipulation} from "SpectaclesInteractionKit.lspkg/Components/Interaction/InteractableManipulation/InteractableManipulation"
import {ShadeMesh} from "./ShadeShiftGeometry"

@component
export class ShadeShiftShelterController extends BaseScriptComponent {
  @ui.label("ShadeShift • shelter grab handle")
  @ui.separator
  @input @hint("Inventory identifier for this authored shelter handle")
  shelterId:string="A"
  @input @hint("Bundled vertex-colour material")
  material!:Material
  @input @hint("Forgiving axis-aligned grab volume in centimetres") @widget(new SliderWidget(6,12,1))
  targetCm:number=8
  @input @hint("Visual grab handle width in centimetres") @widget(new SliderWidget(3,6,.5))
  handleCm:number=4
  @input @hint("Show collider bounds for diagnostics")
  debugColliders:boolean=false
  readonly onGrab=new Event<string>()
  readonly onMove=new Event<{id:string;world:vec3}>()
  readonly onRelease=new Event<string>()
  private manipulation!:InteractableManipulation
  private interactable!:Interactable
  private mesh!:ShadeMesh
  private dragging=false
  private invalid=false
  onAwake():void {
    if(!this.material)return
    this.mesh=new ShadeMesh(this.sceneObject,"Shelter"+this.shelterId+"Grip",this.material)
    this.paint(false)
    const collider=this.sceneObject.createComponent("Physics.ColliderComponent")
    const shape=Shape.createBoxShape();shape.size=new vec3(this.targetCm,this.targetCm,this.targetCm)
    collider.shape=shape;collider.intangible=false;collider.debugDrawEnabled=this.debugColliders
    this.interactable=this.sceneObject.createComponent(Interactable.getTypeName()) as Interactable
    this.interactable.targetingMode=3
    this.manipulation=this.sceneObject.createComponent(InteractableManipulation.getTypeName()) as InteractableManipulation
    this.manipulation.setCanRotate(false);this.manipulation.setCanScale(false)
    this.createEvent("OnStartEvent").bind(()=>{
      this.manipulation.onManipulationStart.add(()=>{
        this.dragging=true;this.onGrab.invoke(this.shelterId)
      })
      this.manipulation.onManipulationUpdate.add(()=>this.onMove.invoke({
        id:this.shelterId,world:this.sceneObject.getTransform().getWorldPosition()}))
      this.manipulation.onManipulationEnd.add(()=>{
        this.onMove.invoke({id:this.shelterId,world:this.sceneObject.getTransform().getWorldPosition()})
        this.dragging=false;this.onRelease.invoke(this.shelterId)
      })
    })
  }
  isDragging():boolean {return this.dragging}
  place(world:vec3,invalid:boolean,interactive:boolean):void {
    if(!this.mesh)return
    this.sceneObject.getTransform().setWorldPosition(world)
    this.sceneObject.getTransform().setWorldRotation(quat.quatIdentity())
    this.sceneObject.enabled=interactive
    if(invalid!==this.invalid)this.paint(invalid)
  }
  private paint(invalid:boolean):void {
    this.invalid=invalid
    this.mesh.begin();this.mesh.box(0,0,0,this.handleCm,this.handleCm*.55,this.handleCm,
      invalid?[1,.42,.2,1]:[.22,.95,1,1]);this.mesh.commit()
  }
}
