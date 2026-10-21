import Event from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {FlexDirection} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"
import {ShadeLayoutUI,applyTextRole} from "./KiroshoLayoutUI"
import {ShadePresentation} from "./KiroshoPresenter"

type Page="zones"|"review"|"model"|"commit"
@component
export class KiroshoDetailsUI extends BaseScriptComponent {
  @ui.label("Kirosho • zones and tradeoffs")
  @ui.separator
  @input @hint("Detail panel width in centimetres") @widget(new SliderWidget(22,34,1))
  panelWidthCm:number=26
  @input @hint("Typography multiplier") @widget(new SliderWidget(1.5,2.5,.1))
  typeScale:number=2
  @input @hint("Warning colour for a zone losing shade") @widget(new ColorWidget())
  warning:vec4=new vec4(1,.68,.3,1)
  readonly onAction=new Event<string>()
  private ui!:ShadeLayoutUI
  private pages:Record<string,SceneObject>={}
  private page:Page="zones"
  onAwake():void {
    this.ui=new ShadeLayoutUI(this,this.panelWidthCm,this.typeScale)
    const stack=this.ui.mount(this.sceneObject,"Details"),w=this.panelWidthCm-3
    this.ui.label(stack,"ShadeDetailsHeading","ACTIVITY ZONES","Body",3)
    const tabs=this.ui.row(stack,"ShadeTabs",w,6)
    for(const page of ["zones","review","model"] as Page[]) {
      this.ui.button(tabs,"ShadeTab"+page,page==="zones"?"Zones":page==="review"?"Review":"Model",(w-1.2)/3,6,()=>this.setPage(page))
      applyTextRole(this.ui.texts["ShadeTab"+page+"Label"],"Button",this.typeScale*.8)
    }
    const viewport=this.ui.child(stack,"ShadeDetailViewport",w,69)
    for(const page of ["zones","review","model","commit"] as Page[]) {
      this.pages[page]=this.ui.flex(viewport,"ShadePane"+page,FlexDirection.Column,w,69,.55)
    }
    const zones=this.pages.zones
    for(const [id,label] of [["lunch","Lunch queue"],["seating","Outdoor seating"],["pickup","Pickup queue"]]) {
      this.ui.button(zones,"ShadeZone"+id,label+"\nLoading…",w,6.5,()=>this.onAction.invoke("zone:"+id))
    }
    this.ui.label(zones,"ShadeSelectedZone","Lunch queue","Body",2.4)
    this.ui.label(zones,"ShadeSelectedSchedule","1.6 m activity plane","Caption",8)
    this.ui.label(zones,"ShadeSelectedPeriod","Whole period —","Body",2.8)
    this.ui.label(zones,"ShadeProfileLabel","PROFILE: School day","Caption",2)
    const profiles=this.ui.row(zones,"ShadeProfiles",w,6)
    for(const [id,label] of [["school-day","School"],["lunch-event","Event"],["no-activity","Empty"]]) {
      this.ui.button(profiles,"ShadeProfile"+id,label,(w-1.2)/3,6,()=>this.onAction.invoke("profile:"+id))
      applyTextRole(this.ui.texts["ShadeProfile"+id+"Label"],"Button",this.typeScale*.8)
    }
    const review=this.pages.review
    this.ui.label(review,"ShadeReviewMetrics","Starting —\nCurrent —\nSuggested —","Body",9.2)
    this.ui.label(review,"ShadeReviewGain","—","Metric",6.8)
    this.ui.label(review,"ShadeTradeoff","Review each activity zone","Body",6.6,w,this.warning)
    for(const id of ["lunch","seating","pickup"])this.ui.label(review,"ShadeTrade"+id,"—","Body",9)
    this.ui.label(review,"ShadeSearchCount","Best evaluated grid layout","Caption",3)
    this.ui.button(review,"ShadeApply","Apply layout",w,6.5,()=>this.onAction.invoke("apply"),true)
    this.ui.label(review,"ShadeCompareNote","Suggested changes compare with current placement.","Caption",5.2)
    this.ui.label(this.pages.model,"ShadeAssumptions","Loading model details…","Caption",67)
    this.ui.label(this.pages.commit,"ShadeCommittedPlan","Commit records a plan for this session.","Caption",59)
    this.ui.button(this.pages.commit,"ShadeCommitBack","Back to zones",w,6,()=>this.setPage("zones"))
    this.createEvent("UpdateEvent").bind(()=>{
      Object.keys(this.pages).forEach(key=>this.pages[key].enabled=key===this.page)
    })
  }
  setPage(page:Page):void {
    this.page=page
    this.ui.set("ShadeDetailsHeading",page==="zones"?"ACTIVITY ZONES":page==="review"?"REVIEW TRADEOFFS":page==="model"?"MODEL ASSUMPTIONS":"COMMITTED PLAN")
  }
  render(vm:ShadePresentation):void {
    for(const zone of vm.zones) {
      this.ui.set("ShadeZone"+zone.id+"Label",zone.label+"\n"+zone.now)
      this.ui.set("ShadeTrade"+zone.id,zone.label+"\n"+zone.trade,zone.loss?this.warning:new vec4(.45,1,.9,1))
    }
    this.ui.set("ShadeSelectedZone",vm.selectedTitle)
    this.ui.set("ShadeSelectedSchedule",vm.selectedDetail)
    this.ui.set("ShadeSelectedPeriod",vm.selectedPeriod)
    this.ui.set("ShadeProfileLabel","PROFILE: "+vm.profile)
    this.ui.set("ShadeReviewMetrics",vm.reviewMetrics)
    this.ui.setAccent("ShadeReviewGain",vm.gain)
    this.ui.set("ShadeTradeoff",vm.tradeoff,this.warning)
    this.ui.set("ShadeSearchCount",vm.searched)
    this.ui.set("ShadeCompareNote",vm.comparisonNote)
    this.ui.set("ShadeApplyLabel",vm.suggestionReady?"Apply layout":"No layout to apply")
    this.ui.set("ShadeAssumptions",vm.model)
    this.ui.set("ShadeCommittedPlan",vm.committed)
  }
}
