import Event from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {ShadeLayoutUI} from "./KiroshoLayoutUI"
import {ShadePresentation} from "./KiroshoPresenter"
import {Slider} from "SpectaclesUIKit.lspkg/Scripts/Components/Slider/Slider"

@component
export class KiroshoTimelineUI extends BaseScriptComponent {
  @ui.label("Kirosho • afternoon timeline")
  @ui.separator
  @input @hint("Width of the timeline in centimetres") @widget(new SliderWidget(54,66,1))
  widthCm:number=60
  @input @hint("Typography multiplier") @widget(new SliderWidget(1.5,2.5,.1))
  typeScale:number=2
  @input @hint("Colour used for the selected time") @widget(new ColorWidget())
  accent:vec4=new vec4(1,.8,.35,1)
  readonly onAction=new Event<string>()
  readonly onMinute=new Event<number>()
  private ui!:ShadeLayoutUI
  private slider!:Slider
  private programmatic=false
  onAwake():void {
    this.ui=new ShadeLayoutUI(this,this.widthCm,this.typeScale,this.accent)
    const stack=this.ui.mount(this.sceneObject,"Timeline"),width=this.widthCm-3
    const fine=this.ui.row(stack,"ShadeFineTime",width,5.5)
    this.ui.button(fine,"ShadeEarlier","< 15 min",12,5.5,()=>this.onAction.invoke("earlier"))
    this.ui.label(fine,"ShadeClock","12:00 SGT","Title",5.5,width-25.2,this.accent)
    this.ui.button(fine,"ShadeLater","15 min >",12,5.5,()=>this.onAction.invoke("later"))
    this.ui.child(stack,"ShadeTimelineSlider",width,5,object=>{
      this.slider=object.createComponent(Slider.getTypeName()) as Slider
      // Slider fill/knob sizing must be assigned before its OnStart initialization.
      this.slider.size=new vec3(width,4,1)
      this.slider.currentValue=0
    })
    this.createEvent("OnStartEvent").bind(()=>{
      const change=(value:number)=>{
        if(!this.programmatic)this.onMinute.invoke(Math.round(720+300*value))
      }
      // UIKit's committed value changes on release; knob movement supplies
      // continuous shade inspection while the pinch is still held.
      this.slider.onKnobMoved.add(change)
      this.slider.onValueChange.add(change)
    })
    const hours=this.ui.row(stack,"ShadeHourRow",width,6)
    const itemWidth=(width-3)/6
    for(let hour=12;hour<=17;hour++) {
      this.ui.button(hours,"ShadeTime"+hour,hour+":00",itemWidth,6,
        ()=>this.onAction.invoke("time:"+hour*60))
    }
    this.ui.label(stack,"ShadeActivities","Lunch 12–14 • Seating 12–16 • Pickup 15–17","Caption",2.4)
    this.ui.label(stack,"ShadePlaneLegend","1.6 m analysis plane • Cyan = shade","Caption",2.3)
  }
  render(vm:ShadePresentation):void {
    this.ui.setAccent("ShadeClock",vm.clock)
    this.ui.set("ShadePlaneLegend",vm.plane)
    this.ui.set("ShadeActivities",vm.profile==="School day"?
      "Lunch 12–14 • Seating 12–16 • Pickup 15–17":
      vm.profile==="Lunch event"?"Lunch event 12–14 • Illustrative schedules":"No scheduled activity • Illustrative scenario")
  }
  setMinute(minute:number):void {
    const value=(minute-720)/300
    if(Math.abs(this.slider.currentValue-value)<.0001)return
    this.programmatic=true;this.slider.currentValue=value;this.programmatic=false
  }
}
