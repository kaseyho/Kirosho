import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider"
import {ShadeSession,SiteScenario,clone,layoutFingerprint} from "./Engine/ShadeEngine"
import {courtyardScenario} from "../Data/CourtyardScenario"
import {SOLAR_FIXTURES} from "../Data/SolarFixtures"
import {ShadeShiftSceneView,ShadeDragEvent} from "./ShadeShiftSceneView"
import {ShadeShiftPlannerUI} from "./ShadeShiftPlannerUI"
import {ShadeShiftDetailsUI} from "./ShadeShiftDetailsUI"
import {ShadeShiftTimelineUI} from "./ShadeShiftTimelineUI"
import {presentShade} from "./ShadeShiftPresenter"
import {ShadePerformance} from "./ShadeShiftPerformance"

@component
export class ShadeShiftMain extends BaseScriptComponent {
  @ui.label("ShadeShift • session owner")
  @ui.separator
  @input @hint("Authored courtyard renderer and coordinate adapter")
  view!:ShadeShiftSceneView
  @input @hint("Authored planner UI")
  planner!:ShadeShiftPlannerUI
  @input @hint("Authored zone and comparison UI")
  details!:ShadeShiftDetailsUI
  @input @hint("Authored timeline UI")
  timeline!:ShadeShiftTimelineUI
  @input @hint("Search work units evaluated per rendered frame") @widget(new SliderWidget(128,512,32))
  searchWorkPerFrame:number=512
  @input @hint("Overview model distance in centimetres") @widget(new SliderWidget(140,200,5))
  modelDistanceCm:number=195
  @input @hint("Overview UI distance in centimetres; SIK indirect selection is supported") @widget(new SliderWidget(150,220,5))
  panelDistanceCm:number=200
  @input @hint("Horizontal offset of the side panels in centimetres") @widget(new SliderWidget(38,48,1))
  panelInsetCm:number=44
  @input @hint("Show physical interaction volumes for diagnostics")
  debugColliders:boolean=false
  readonly performance=new ShadePerformance()
  readonly actionCounts:Record<string,number>={}
  session:ShadeSession|null=null
  private camera!:Transform
  private dirty=true
  private searchStarted=0
  private dragChangedAt=0
  private evaluationRequestedAt=0
  private evaluationReadyAt=0
  private evaluationReadyRevision=-1
  private previousPhase=""
  private ready=false
  private startupFrames=0
  private anchored=false
  onAwake():void {
    this.createEvent("OnStartEvent").bind(()=>this.start())
    this.createEvent("UpdateEvent").bind(()=>this.update())
    this.createEvent("LateUpdateEvent").bind(()=>this.render())
  }
  private start():void {
    if(!this.view || !this.planner || !this.details || !this.timeline) {
      console.info("[ShadeShift] Waiting for authored component wiring");return
    }
    this.camera=WorldCameraFinderProvider.getInstance().getComponent().getTransform()
    this.session=new ShadeSession(courtyardScenario(),SOLAR_FIXTURES)
    this.view.initialize()
    this.view.onDrag.add(event=>this.drag(event))
    this.planner.onAction.add(action=>this.act(action))
    this.details.onAction.add(action=>this.act(action))
    this.timeline.onAction.add(action=>this.act(action))
    this.timeline.onMinute.add(minute=>{
      const started=getRealTimeNanos()
      if(this.session?.setMinute(minute)) {
        this.evaluationRequestedAt=this.session.status==="updating"?started:0
        this.dirty=true;this.actionCounts["timeline-drag"]=(this.actionCounts["timeline-drag"]??0)+1
      }
    })
    this.ready=true;this.dirty=true
    if(this.debugColliders)for(let i=0;i<global.scene.getRootObjectsCount();i++)this.debugWalk(global.scene.getRootObject(i))
    console.info("[ShadeShift] Ready • local offline courtyard • "+this.session.evaluation?.coveragePercent)
  }
  private debugWalk(object:SceneObject):void {
    for(const component of object.getComponents("Physics.ColliderComponent"))component.debugDrawEnabled=true
    for(let index=0;index<object.getChildrenCount();index++)this.debugWalk(object.getChild(index))
  }
  private update():void {
    if(!this.ready || !this.session)return
    // Interactive Preview replaces its initial scene camera pose after OnStart.
    // Anchor once after tracking has entered its first update frames.
    if(!this.anchored && ++this.startupFrames>=3) {
      this.reanchor();this.anchored=true
      this.performance.beginActiveWindow()
      console.info("[ShadeShift] World anchor set at camera "+this.camera.getWorldPosition().toString())
    }
    this.performance.frame()
    const s=this.session
    if(s.status==="updating" && !s.drag) {
      const start=getRealTimeNanos();s.flushEvaluation()
      this.evaluationReadyAt=this.evaluationRequestedAt
      this.evaluationReadyRevision=s.revision
      this.performance.evaluationMs.push((getRealTimeNanos()-start)/1e6);this.dirty=true
    }
    if(s.status==="searching") {
      const start=getRealTimeNanos();s.stepSearch(this.searchWorkPerFrame)
      this.performance.searchBatchMs.push((getRealTimeNanos()-start)/1e6);this.dirty=true
      if(s.status!=="searching" && this.searchStarted) {
        const elapsed=(getRealTimeNanos()-this.searchStarted)/1e6
        this.performance.searchWallMs.push(elapsed);this.searchStarted=0
        console.info(`[ShadeShift] search ${s.status}; wallMs=${elapsed}; layouts=${s.search?.evaluatedCount}`)
        console.info("[ShadeShiftSearchAudit] "+JSON.stringify(this.audit()))
      }
    }
    if(s.status!==this.previousPhase) {
      if(s.status==="suggestion")this.details.setPage("review")
      if(s.status==="committed")this.details.setPage("commit")
      this.previousPhase=s.status;this.dirty=true
    }
  }
  private render():void {
    if(!this.ready || !this.session || !this.dirty)return
    const s=this.session
    this.view.render(s)
    if(this.dragChangedAt) {
      this.performance.dragSceneUpdateMs.push((getRealTimeNanos()-this.dragChangedAt)/1e6)
      this.dragChangedAt=0
    }
    const vm=presentShade(s)
    if(vm.noActivity)vm.status="No scheduled activity.\nChoose an active profile."
    this.planner.render(vm);this.details.render(vm);this.timeline.render(vm)
    this.timeline.setMinute(s.minute);this.dirty=false
    if(this.evaluationReadyAt) {
      // A later slider sample can arrive between Update and LateUpdate.
      // Count only a presentation that has caught up with current inputs.
      if(s.status!=="updating" && s.revision===this.evaluationReadyRevision && s.evaluation?.revision===s.revision) {
        this.performance.settledInputToPresentationMs.push((getRealTimeNanos()-this.evaluationReadyAt)/1e6)
        this.evaluationRequestedAt=0
      }
      this.evaluationReadyAt=0
    }
  }
  act(action:string):void {
    const s=this.session;if(!s)return
    const started=getRealTimeNanos()
    this.actionCounts[action]=(this.actionCounts[action]??0)+1
    if(action==="find") {if(s.status!=="searching") {this.searchStarted=getRealTimeNanos();s.requestSearch()}}
    else if(action==="cancel") {s.cancelSearch();this.searchStarted=0}
    else if(action==="apply")s.applySuggestion()
    else if(action==="undo")s.undo()
    else if(action==="reset") {s.reset();this.details.setPage("zones");this.reanchor()}
    else if(action==="earlier")s.setMinute(s.minute-15)
    else if(action==="later")s.setMinute(s.minute+15)
    else if(action.startsWith("time:"))s.setMinute(Number(action.slice(5)))
    else if(action.startsWith("zone:"))s.selectZone(action.slice(5))
    else if(action.startsWith("profile:")) {s.setScenario(courtyardScenario(action.slice(8) as "school-day"|"lunch-event"|"no-activity"));this.details.setPage("zones")}
    else if(action==="details")this.details.setPage("model")
    else if(action==="fullscale") {s.setViewMode("fullscale");s.selectZone(["lunch","seating","pickup"][s.observationIndex]);this.reanchor()}
    else if(action==="overview") {s.setViewMode("overview");this.reanchor()}
    else if(action==="next-observation") {s.nextObservation();s.selectZone(["lunch","seating","pickup"][s.observationIndex]);this.reanchor()}
    else if(action==="recall")this.reanchor()
    else if(action==="commit") {const plan=s.commit();if(plan)console.info("[ShadeShiftPlan] "+JSON.stringify(plan))}
    this.evaluationRequestedAt=s.status==="updating"?started:0
    this.dirty=true
    console.info(`[ShadeShiftAction] ${action}; revision=${s.revision}; phase=${s.status}`)
  }
  private drag(event:ShadeDragEvent):void {
    const s=this.session;if(!s || s.viewMode!=="overview")return
    const started=getRealTimeNanos()
    if(event.phase==="start")s.beginDrag(event.id)
    else if(event.phase==="move" && event.point) {s.previewDrag(event.point);this.dragChangedAt=started}
    else if(event.phase==="end") {
      const valid=s.endDrag();console.info(`[ShadeShiftDrag] ${event.id}; valid=${valid}; layout=${layoutFingerprint(s.layout)}`)
      this.evaluationRequestedAt=s.status==="updating"?started:0
    }
    this.dirty=true
  }
  private reanchor():void {
    const s=this.session;if(!s)return
    this.view.anchor(this.camera,s.viewMode,s.observationIndex,this.modelDistanceCm)
    const inspect=s.viewMode==="fullscale"
    this.view.panelPose(this.planner.sceneObject,inspect?-25:-this.panelInsetCm,inspect?-2:4,inspect?-150:-this.panelDistanceCm)
    this.view.panelPose(this.details.sceneObject,this.panelInsetCm,4,-this.panelDistanceCm)
    this.view.panelPose(this.timeline.sceneObject,0,-28,-this.panelDistanceCm)
    this.planner.setInspection(inspect)
    this.details.sceneObject.enabled=!inspect;this.timeline.sceneObject.enabled=!inspect
    this.dirty=true
  }
  /** Test-only input fault; never changes an evaluation or injects a test result. */
  loadQAScenario(scenario:SiteScenario):void {
    if(!global.deviceInfoSystem.isEditor())throw new Error("QA input fault is Editor-only")
    this.session?.setScenario(scenario);this.dirty=true
  }
  audit():Record<string,unknown> {
    const s=this.session
    return s?{minute:s.minute,revision:s.revision,status:s.status,message:s.message,layout:clone(s.layout),
      selectedZoneId:s.selectedZoneId,viewMode:s.viewMode,observationIndex:s.observationIndex,
      coverage:s.evaluation?.coveragePercent,baseline:s.baselineEvaluation?.coveragePercent,
      suggested:s.suggestion?.evaluation.coveragePercent,hasSuggestion:!!s.suggestion,
      canUndo:s.canUndo,profile:s.scenario.profile,committed:!!s.committedPlan,
      actionCounts:clone(this.actionCounts),searchWorkPerFrame:this.searchWorkPerFrame,performance:this.performance.summary()}:{}
  }
}
