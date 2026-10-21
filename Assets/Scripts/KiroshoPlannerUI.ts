import Event from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {ShadeLayoutUI} from "./KiroshoLayoutUI"
import {ShadePresentation} from "./KiroshoPresenter"
import {FlexDirection} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"
import {FlexItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem"
import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout"

@component
export class KiroshoPlannerUI extends BaseScriptComponent {
  @ui.label("Kirosho • planner controls")
  @ui.separator
  @input @hint("World-space panel width in centimetres") @widget(new SliderWidget(22,32,1))
  panelWidthCm:number=26
  @input @hint("Typography multiplier for this panel") @widget(new SliderWidget(1.5,2.5,.1))
  typeScale:number=2
  @input @hint("Accent for modeled coverage values") @widget(new ColorWidget())
  accent:vec4=new vec4(.3,.95,1,1)
  @input @hint("Product heading shown on the planner")
  heading:string="Kirosho"
  readonly onAction=new Event<string>()
  private ui!:ShadeLayoutUI
  private normal!:SceneObject
  private inspection!:SceneObject
  private vm:ShadePresentation|null=null
  private inspectionMode=false
  private viewport!:SceneObject
  private stack!:SceneObject
  private lastInspection:boolean|null=null
  onAwake():void {
    this.ui=new ShadeLayoutUI(this,this.panelWidthCm,this.typeScale,this.accent)
    const stack=this.ui.mount(this.sceneObject,"Planner")
    this.stack=stack
    const width=this.panelWidthCm-3
    this.ui.label(stack,"ShadeBrand",this.heading,"Title",5.5)
    this.ui.label(stack,"ShadePlannerCaption","SHADE FOR YOUR SCHEDULE","Caption",3)
    const viewport=this.ui.child(stack,"PlannerViewport",width,59)
    this.viewport=viewport
    this.normal=this.ui.flex(viewport,"PlannerNormal",FlexDirection.Column,width,59,.65)
    this.ui.label(this.normal,"ShadeCoverage","—","Metric",6)
    this.ui.label(this.normal,"ShadeMetricLabel","MODELED COVERAGE","Caption",3)
    this.ui.label(this.normal,"ShadeComparison","Starting —\nCurrent —","Body",7)
    this.ui.button(this.normal,"ShadeFind","Find better placement",width,6.7,()=>this.emit("find"),true)
    this.ui.label(this.normal,"ShadeStatus","Loading courtyard…","Body",7)
    const edits=this.ui.row(this.normal,"ShadeEditRow",width,6)
    this.ui.button(edits,"ShadeCancel","Cancel",(width-.6)/2,6,()=>this.emit("cancel"))
    this.ui.button(edits,"ShadeUndo","Undo",(width-.6)/2,6,()=>this.emit("undo"))
    this.ui.button(this.normal,"ShadeFullscale","Inspect full scale",width,6,()=>this.emit("fullscale"))
    const decision=this.ui.row(this.normal,"ShadeDecisionRow",width,6)
    this.ui.button(decision,"ShadeCommit","Commit",(width-.6)/2,6,()=>this.emit("commit"))
    this.ui.button(decision,"ShadeReset","Reset",(width-.6)/2,6,()=>this.emit("reset"))
    const utilities=this.ui.row(this.normal,"ShadeUtilityRow",width,6)
    this.ui.button(utilities,"ShadeDetails","Model",(width-.6)/2,6,()=>this.emit("details"))
    this.ui.button(utilities,"ShadeRecall","Recall",(width-.6)/2,6,()=>this.emit("recall"))

    this.inspection=this.ui.flex(viewport,"PlannerInspection",FlexDirection.Column,width,44,.8)
    this.ui.label(this.inspection,"ShadeInspectionTitle","FULL-SCALE INSPECTION","Body",12)
    this.ui.label(this.inspection,"ShadeInspectionMetric","Same plan and calculations","Body",8)
    this.ui.button(this.inspection,"ShadeNextObservation","Next observation",width,6,()=>this.emit("next-observation"))
    this.ui.button(this.inspection,"ShadeOverview","Return to overview",width,6,()=>this.emit("overview"),true)
    this.ui.button(this.inspection,"ShadeInspectRecall","Recall controls",width,6,()=>this.emit("recall"))
    this.createEvent("UpdateEvent").bind(()=>{
      this.normal.enabled=!this.inspectionMode;this.inspection.enabled=this.inspectionMode
      if(this.lastInspection!==this.inspectionMode) {
        ;(this.viewport.getComponent(FlexItem.getTypeName()) as FlexItem).overrideHeight=this.inspectionMode?44:59
        ;(this.stack.getComponent(FlexLayout.getTypeName()) as FlexLayout).markDirty()
        this.lastInspection=this.inspectionMode
      }
    })
  }
  private emit(action:string):void {this.onAction.invoke(action)}
  setInspection(active:boolean):void {this.inspectionMode=active}
  render(vm:ShadePresentation):void {
    this.vm=vm
    this.ui.setAccent("ShadeCoverage",vm.metric)
    this.ui.set("ShadeComparison",vm.comparison)
    this.ui.set("ShadeStatus",vm.status,vm.phase==="error"?new vec4(1,.65,.3,1):new vec4(1,1,1,1))
    this.ui.set("ShadeFindLabel",vm.findLabel)
    this.ui.set("ShadeInspectionTitle",vm.inspection)
    this.ui.set("ShadeInspectionMetric",vm.inspectionDetail)
  }
}
