import Event from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {ShadeSession, Point, Rect as PlanRect, Layout, projectRoof, intersection, area, sunAt} from "./Engine/ShadeEngine"
import {ShadeMesh,ShadeColour} from "./KiroshoGeometry"
import {KiroshoShelterController} from "./KiroshoShelterController"
import {KiroshoLabelsUI,MapLabel} from "./KiroshoLabelsUI"

export type ShadeDragEvent={phase:"start"|"move"|"end";id:string;point?:Point}
@component
export class KiroshoSceneView extends BaseScriptComponent {
  @ui.label("Kirosho • ENU scene adapter")
  @ui.separator
  @input @hint("Official bundled vertex-colour material")
  material!:Material
  @input @hint("Authored unit-scale shelter A handle")
  shelterA!:KiroshoShelterController
  @input @hint("Authored unit-scale shelter B handle")
  shelterB!:KiroshoShelterController
  @input @hint("Authored spatial annotation UI")
  labels!:KiroshoLabelsUI
  @input @hint("Overview centimetres representing one metre") @widget(new SliderWidget(4,6,.25))
  overviewCmPerMeter:number=5
  @input @hint("Overview drafting-table tilt in degrees") @widget(new SliderWidget(35,60,1))
  overviewTilt:number=50
  readonly onDrag=new Event<ShadeDragEvent>()
  private meshes:Record<string,ShadeMesh>={}
  private initialized=false
  private centimetres=5
  private staticKey=""
  private dynamicKey=""
  private mode="overview"
  private lastCameraPosition=new vec3(0,0,0)
  private lastYaw=quat.quatIdentity()
  initialize():void {
    if(this.initialized)return
    if(!this.material || !this.shelterA || !this.shelterB || !this.labels)throw new Error("Kirosho scene inputs are missing")
    const overlay=this.material.clone();overlay.mainPass.blendMode=BlendMode.Normal
    overlay.mainPass.depthWrite=false;overlay.mainPass.depthTest=true
    for(const name of ["Ground","ShelterFrames","ZoneFloors","AnalysisPlane","CurrentShade","SuggestedLayout","SunDirection"]) {
      const transparent=name==="AnalysisPlane"||name==="CurrentShade"
      this.meshes[name]=new ShadeMesh(this.sceneObject,"Shade"+name,transparent?overlay:this.material)
    }
    for(const handle of [this.shelterA,this.shelterB]) {
      handle.onGrab.add(id=>this.onDrag.invoke({phase:"start",id}))
      handle.onMove.add(({id,world})=>this.onDrag.invoke({phase:"move",id,point:this.worldToPoint(world)}))
      handle.onRelease.add(id=>this.onDrag.invoke({phase:"end",id}))
    }
    this.initialized=true
  }
  anchor(camera:Transform,mode:"overview"|"fullscale",observation:number,distanceCm:number):void {
    const pos=camera.getWorldPosition(),f=camera.getWorldRotation().multiplyVec3(new vec3(0,0,-1))
    const yaw=Math.atan2(-f.x,-f.z),rotation=quat.fromEulerAngles(0,yaw,0)
    this.lastCameraPosition=pos;this.lastYaw=rotation;this.mode=mode
    const tr=this.sceneObject.getTransform()
    if(mode==="overview") {
      this.centimetres=this.overviewCmPerMeter
      tr.setWorldPosition(pos.add(rotation.multiplyVec3(new vec3(0,8,-distanceCm))))
      tr.setWorldRotation(rotation.multiply(quat.fromEulerAngles(this.overviewTilt*Math.PI/180,0,0)))
    } else {
      this.centimetres=100
      // Fixed eye-height observations inspect each zone without requiring
      // the wearer to walk. ENU geometry retains its exact metre scale.
      const observationPoints=[{e:2.5,n:2},{e:2.5,n:-2},{e:9.5,n:2}]
      const p=observationPoints[observation%3]
      tr.setWorldPosition(pos.add(rotation.multiplyVec3(new vec3(-(p.e-6)*100,-165,(p.n-4)*100))))
      tr.setWorldRotation(rotation)
    }
    this.staticKey="";this.dynamicKey=""
  }
  panelPose(object:SceneObject,x:number,y:number,z:number):void {
    object.getTransform().setWorldPosition(this.lastCameraPosition.add(this.lastYaw.multiplyVec3(new vec3(x,y,z))))
    object.getTransform().setWorldRotation(this.lastYaw)
  }
  localPoint(e:number,n:number,up:number):vec3 {
    return new vec3((e-6)*this.centimetres,up*this.centimetres,-(n-4)*this.centimetres)
  }
  pointToWorld(e:number,n:number,up:number):vec3 {
    return this.sceneObject.getTransform().getWorldTransform().multiplyPoint(this.localPoint(e,n,up))
  }
  worldToPoint(world:vec3):Point {
    const p=this.sceneObject.getTransform().getInvertedWorldTransform().multiplyPoint(world)
    return {e:p.x/this.centimetres+6,n:-p.z/this.centimetres+4}
  }
  private rect(mesh:ShadeMesh,r:PlanRect,height:number,thickness:number,c:ShadeColour,outline=false):void {
    if(area(r)<=0)return
    const p=this.localPoint((r.eMin+r.eMax)/2,(r.nMin+r.nMax)/2,height)
    const width=(r.eMax-r.eMin)*this.centimetres,depth=(r.nMax-r.nMin)*this.centimetres
    if(outline)mesh.outline(p.x,p.y,p.z,width,depth,Math.max(.13,.025*this.centimetres),c)
    else mesh.box(p.x,p.y,p.z,width,thickness*this.centimetres,depth,c)
  }
  render(s:ShadeSession):void {
    this.initialize()
    const layout=s.drag?s.drag.ghost:s.layout
    const staticKey=s.scenario.profile+":"+this.centimetres
    if(staticKey!==this.staticKey) {this.buildGround(s);this.staticKey=staticKey}
    const dynamicKey=JSON.stringify([layout,s.minute,s.selectedZoneId,s.suggestion?.layout,s.drag?.check.valid,this.centimetres,s.status==="error"])
    if(dynamicKey!==this.dynamicKey) {
      this.buildShelters(s,layout);this.buildAnalysis(s,layout);this.dynamicKey=dynamicKey
      for(const handle of [this.shelterA,this.shelterB]) {
        const p=layout.shelters.find(item=>item.id===handle.shelterId)
        if(p)handle.place(this.pointToWorld(p.e,p.n,s.scenario.roof.height+.3),
          !!(s.drag && s.drag.id===handle.shelterId && !s.drag.check.valid),this.mode==="overview" && s.status!=="error")
      }
      this.labels.render(this.labelData(s,layout),this.lastYaw,this.mode==="fullscale"?3:1)
    }
  }
  private buildGround(s:ShadeSession):void {
    const ground=this.meshes.Ground;ground.begin()
    this.rect(ground,s.scenario.site,-.1,.18,[.72,.69,.57,1])
    for(let e=0;e<=12;e++) {
      const p=this.localPoint(e,4,.005);ground.box(p.x,p.y,p.z,.018*this.centimetres,.012*this.centimetres,8*this.centimetres,[.85,.82,.69,1])
    }
    for(let n=0;n<=8;n++) {
      const p=this.localPoint(6,n,.005);ground.box(p.x,p.y,p.z,12*this.centimetres,.012*this.centimetres,.018*this.centimetres,[.85,.82,.69,1])
    }
    for(const blocked of s.scenario.blocked) {
      this.rect(ground,blocked.rect,.018,.012,[.97,.65,.22,1])
      for(let n=.25;n<8;n+=.5)this.rect(ground,{eMin:5.55,eMax:6.45,nMin:n,nMax:n+.06},.03,.01,[1,.88,.55,1])
    }
    ground.commit()
    const zones=this.meshes.ZoneFloors;zones.begin()
    for(const [i,z] of s.scenario.zones.entries())this.rect(zones,z.rect,.045,.02,
      i===1?[.42,.69,.5,1]:[.58,.73,.7,1],true)
    zones.commit()
  }
  private buildShelters(s:ShadeSession,layout:Layout):void {
    const mesh=this.meshes.ShelterFrames;mesh.begin();const roof=s.scenario.roof,cm=this.centimetres
    for(const p of layout.shelters) {
      const c:ShadeColour=s.drag && s.drag.id===p.id && !s.drag.check.valid?[1,.4,.2,1]:[1,.91,.67,1]
      const centre=this.localPoint(p.e,p.n,roof.height)
      mesh.outline(centre.x,centre.y,centre.z,roof.width*cm,roof.depth*cm,.07*cm,c)
      mesh.box(centre.x,centre.y,centre.z,roof.width*cm,.04*cm,.035*cm,c)
      mesh.box(centre.x,centre.y,centre.z,.035*cm,.04*cm,roof.depth*cm,c)
      for(const e of [-1,1])for(const n of [-1,1]) {
        const leg=this.localPoint(p.e+e*(roof.width/2-.06),p.n+n*(roof.depth/2-.06),roof.height/2)
        mesh.box(leg.x,leg.y,leg.z,.065*cm,roof.height*cm,.065*cm,c)
      }
    }
    mesh.commit()
  }
  private buildAnalysis(s:ShadeSession,layout:Layout):void {
    const zone=s.scenario.zones.find(z=>z.id===s.selectedZoneId)??s.scenario.zones[0]
    if(!zone)return
    const sun=sunAt(s.solar,s.minute),plane=this.meshes.AnalysisPlane,shade=this.meshes.CurrentShade
    plane.begin();shade.begin()
    this.rect(plane,zone.rect,zone.activityHeight,.008,[.4,.75,1,.1])
    this.rect(plane,zone.rect,zone.activityHeight+.008,.01,[.35,.85,1,.8],true)
    for(const p of layout.shelters) {
      const projected=projectRoof(p,s.scenario.roof,sun,zone.activityHeight)
      if(projected)this.rect(shade,intersection(zone.rect,projected),zone.activityHeight+.018,.009,[.1,.94,1,.66])
    }
    plane.commit();shade.commit()
    const suggestion=this.meshes.SuggestedLayout;suggestion.begin()
    if(s.suggestion)for(const p of s.suggestion.layout.shelters) {
      const roof=s.scenario.roof
      this.rect(suggestion,{eMin:p.e-roof.width/2,eMax:p.e+roof.width/2,nMin:p.n-roof.depth/2,nMax:p.n+roof.depth/2},.06,.01,[.65,.7,1,1],true)
    }
    suggestion.commit()
    const marker=this.meshes.SunDirection;marker.begin()
    const p=this.localPoint(6+sun.east*2.8,4+sun.north*2.8,3.6)
    marker.box(p.x,p.y,p.z,.22*this.centimetres,.22*this.centimetres,.22*this.centimetres,[1,.8,.25,1]);marker.commit()
  }
  private labelData(s:ShadeSession,layout:Layout):MapLabel[] {
    const labels:MapLabel[]=[{id:"North",text:"N ↑ • 12 × 8 m",position:this.pointToWorld(6,8.6,.1)}]
    for(const p of layout.shelters)labels.push({id:"Shelter"+p.id,text:"SHELTER "+p.id,position:this.pointToWorld(p.e,p.n,3.75)})
    for(const z of s.scenario.zones) {
      const selected=z.id===s.selectedZoneId
      labels.push({id:z.id,text:(selected?"● ":"")+z.label.toUpperCase(),
        position:this.pointToWorld((z.rect.eMin+z.rect.eMax)/2,z.rect.nMin-.25,selected?z.activityHeight+.15:.08)})
    }
    return labels
  }
}
