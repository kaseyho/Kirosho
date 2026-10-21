import {DefaultLeafInteractor} from "Leaf 2.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {LeafHandInteractor} from "Leaf 2.lspkg/Interactors/interactor/LeafTwoHandInteractor"
import {findInteractableByName} from "Leaf 2.lspkg/Interactors/InteractableUtils"
import {findSceneObjectByName,sleep} from "Leaf 2.lspkg/Utils/common/Utils"
import {expect} from "Leaf 2.lspkg/Utils/common/Expect"
import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import {ShadeShiftMain} from "../../Scripts/ShadeShiftMain"
import {Point,layoutFingerprint} from "../../Scripts/Engine/ShadeEngine"

export function mainComponent():ShadeShiftMain {
  const walk=(object:SceneObject):ShadeShiftMain|null=>{
    const component=object.getComponent(ShadeShiftMain.getTypeName()) as ShadeShiftMain
    if(component)return component
    for(let i=0;i<object.getChildrenCount();i++){const found=walk(object.getChild(i));if(found)return found}
    return null
  }
  for(let i=0;i<global.scene.getRootObjectsCount();i++) {const found=walk(global.scene.getRootObject(i));if(found)return found}
  throw new Error("No authored ShadeShiftMain component is present")
}
export function control(name:string):Interactable {
  const target=findInteractableByName(name)
  if(!target)throw new Error("Missing or unavailable ShadeShift interactable: "+name)
  return target
}
export function text(name:string):string {
  const object=findSceneObjectByName(name)
  const component=object?.getComponent("Component.Text") as Text
  if(!component)throw new Error("Missing ShadeShift text: "+name)
  return component.text
}
export async function until(predicate:()=>boolean,label:string,timeoutMs=10000):Promise<void> {
  const start=getRealTimeNanos()
  while(!predicate()) {
    if((getRealTimeNanos()-start)/1e6>timeoutMs)throw new Error("Timed out waiting for "+label)
    await sleep(40)
  }
}

/** Sends normal input only. Session/audit access is read-only. */
export class ShadeShiftLeafInteractor extends DefaultLeafInteractor {
  readonly main:ShadeShiftMain
  constructor(private defaultSettleMs=120) {super("ShadeShiftFunctionalInteractor");this.main=mainComponent()}
  async tap(name:string,settleMs=this.defaultSettleMs):Promise<void> {
    await this.trigger(control(name));if(settleMs>0)await sleep(settleMs)
  }
  async reset():Promise<void> {
    await until(()=>!!this.main.session,"initial session")
    if(this.main.session!.viewMode==="fullscale")await this.tap("ShadeOverview")
    await this.tap("ShadeReset")
    await until(()=>this.main.session!.status==="ready","reset calculation")
  }
  async find():Promise<void> {
    await this.tap("ShadeFind",0)
    await until(()=>this.main.session!.status!=="searching","placement search",15000)
    await sleep(Math.max(120,this.defaultSettleMs))
  }
  async dragShelter(id:string,destination:Point,durationMs=1500):Promise<{reasons:string[];sawGhost:boolean}> {
    const target=control("ShadeShiftShelter"+id),main=this.main
    const desired=main.view.pointToWorld(destination.e,destination.n,main.session!.scenario.roof.height+.3)
    const vector=new vec3(0,0,0),reasons:string[]=[];let sawGhost=false
    const update=()=>{
      const delta=desired.sub(target.getSceneObject().getTransform().getWorldPosition())
      // LEAF drag vectors are per update, not destinations. Follow observable
      // position with bounded feedback; normal SIK movement owns the transform.
      const limit=(v:number)=>Math.max(-1.2,Math.min(1.2,v*.45))
      vector.x=limit(delta.x);vector.y=limit(delta.y);vector.z=limit(delta.z)
      const drag=main.session!.drag
      if(drag){sawGhost=true;if(!drag.check.valid && !reasons.includes(drag.check.reason))reasons.push(drag.check.reason)}
    }
    update();const unsubscribe=target.onDragUpdate.add(update)
    try {await LeafHandInteractor.get("right").drag(target,vector,durationMs)}
    finally {unsubscribe()}
    await until(()=>!main.session!.drag && main.session!.status!=="updating","drag release and calculation")
    await sleep(Math.max(120,this.defaultSettleMs))
    return {reasons,sawGhost}
  }
  async dragTimeline():Promise<number> {
    const slider=control("ShadeTimelineSlider"),before=this.main.session!.minute
    let starts=0,changedWhileDragging=false
    const unsubscribe=slider.onDragStart.add(()=>starts++)
    const unsubscribeUpdate=slider.onDragUpdate.add(()=>{
      if(this.main.session!.minute!==before)changedWhileDragging=true
    })
    try {await this.drag(slider,new vec3(.25,0,0),900)}
    finally {unsubscribe();unsubscribeUpdate()}
    await until(()=>this.main.session!.status!=="updating","timeline calculation")
    expect(starts).toBeGreaterThan(0)
    expect(changedWhileDragging).toBe(true)
    expect(this.main.session!.minute-before).toBeGreaterThan(0)
    return this.main.session!.minute
  }
  fingerprint():string {return layoutFingerprint(this.main.session!.layout)}
}
