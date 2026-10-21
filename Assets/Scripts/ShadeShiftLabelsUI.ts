import {applyTextRole} from "./ShadeShiftLayoutUI"

export type MapLabel={id:string;text:string;position:vec3}
@component
export class ShadeShiftLabelsUI extends BaseScriptComponent {
  @ui.label("ShadeShift • spatial annotations")
  @ui.separator
  @input @hint("Annotation colour") @widget(new ColorWidget())
  colour:vec4=new vec4(1,1,1,1)
  @input @hint("Maximum annotation width in centimetres") @widget(new SliderWidget(14,30,1))
  labelWidthCm:number=21
  private labels:Record<string,{object:SceneObject;text:Text}>={}
  onAwake():void {this.sceneObject.createComponent("Component.Canvas")}
  render(items:MapLabel[],facing:quat,scale=1):void {
    for(const item of items) {
      let label=this.labels[item.id]
      if(!label) {
        const object=global.scene.createSceneObject("ShadeMapLabel"+item.id);object.setParent(this.sceneObject)
        const text=object.createComponent("Component.Text") as Text
        text.depthTest=true;applyTextRole(text,"Caption",1.8)
        text.horizontalAlignment=HorizontalAlignment.Center;text.verticalAlignment=VerticalAlignment.Center
        text.horizontalOverflow=HorizontalOverflow.Overflow
        text.layoutRect=Rect.create(-this.labelWidthCm/2,this.labelWidthCm/2,-1.2,1.2)
        text.textFill.color=this.colour;label={object,text};this.labels[item.id]=label
      }
      if(label.text.text!==item.text)label.text.text=item.text
      label.object.getTransform().setWorldPosition(item.position)
      label.object.getTransform().setWorldRotation(facing)
      label.object.getTransform().setWorldScale(new vec3(scale,scale,scale))
    }
  }
}
