import {BackPlate} from "SpectaclesUIKit.lspkg/Scripts/BackPlate"
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout"
import {FlexItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem"
import {FlexAlign, FlexAlignSelf, FlexDirection, FlexJustify} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"

export type TextRole = "Title"|"Metric"|"Body"|"Caption"|"Button"
const TYPE_SCALE: Record<TextRole, number> = {
  Title:76, Metric:86, Body:39, Caption:32, Button:39
}
export function applyTextRole(text:Text,role:TextRole,scale=1):void {
  text.size=TYPE_SCALE[role]*scale
}
export class ShadeLayoutUI {
  texts:Record<string,Text>={}
  buttons:Record<string,Button>={}
  private colours:Record<string,string>={}
  constructor(private owner:BaseScriptComponent,public width:number,
    private textScale:number=1,private accent:vec4=new vec4(.25,.95,1,1)) {}
  object(parent:SceneObject,name:string,position?:vec3):SceneObject {
    const result=global.scene.createSceneObject(name);result.setParent(parent)
    if(position)result.getTransform().setLocalPosition(position)
    return result
  }
  mount(root:SceneObject,name:string):SceneObject {
    root.createComponent("Component.Canvas")
    const plate=root.createComponent(BackPlate.getTypeName()) as BackPlate
    const content=this.object(root,name+"Content",new vec3(0,0,.6))
    const stack=this.flex(content,name+"Stack",FlexDirection.Column,this.width,-1,.55,1.5)
    const flex=stack.getComponent(FlexLayout.getTypeName()) as FlexLayout
    flex.onLayoutComplete.add(size=>plate.size=new vec2(size.containerWidth,size.containerHeight))
    return stack
  }
  flex(parent:SceneObject,name:string,direction:FlexDirection,width:number,height:number,
    gap=.55,padding=0):SceneObject {
    const result=this.object(parent,name,new vec3(0,0,.02))
    const flex=result.createComponent(FlexLayout.getTypeName()) as FlexLayout
    flex.autoDiscoverItemsOnStart=false
    const item=result.createComponent(FlexItem.getTypeName()) as FlexItem
    if(width>0)item.overrideWidth=width
    if(height>0)item.overrideHeight=height
    flex.onInitialized.add(()=>{
      flex.width=width;flex.height=height;flex.direction=direction
      flex.rowGap=direction===FlexDirection.Column?gap:0
      flex.columnGap=direction===FlexDirection.Row?gap:0
      flex.paddingTop=padding;flex.paddingBottom=padding
      flex.paddingLeft=padding;flex.paddingRight=padding
      flex.justifyContent=FlexJustify.Start;flex.alignItems=FlexAlign.Stretch
    })
    return result
  }
  child(parent:SceneObject,name:string,width:number,height:number,
    build?:(child:SceneObject)=>void):SceneObject {
    const result=this.object(parent,name,new vec3(0,0,.02))
    const item=result.createComponent(FlexItem.getTypeName()) as FlexItem
    if(width>0)item.overrideWidth=width
    if(height>0)item.overrideHeight=height
    item.flexGrow=0;item.flexShrink=0;item.alignSelf=FlexAlignSelf.Stretch
    if(build)build(result)
    const flex=parent.getComponent(FlexLayout.getTypeName()) as FlexLayout
    flex.addItems([item]);return result
  }
  row(parent:SceneObject,name:string,width:number,height:number):SceneObject {
    const holder=this.child(parent,name,width,height)
    return this.flex(holder,name+"Layout",FlexDirection.Row,width,height,.6)
  }
  label(parent:SceneObject,name:string,value:string,role:TextRole,height:number,
    width=this.width-3,color?:vec4):Text {
    let text!:Text
    this.child(parent,name,width,height,child=>{
      text=child.createComponent("Component.Text") as Text
      this.configureText(text,value,role,width,height,color)
    })
    this.texts[name]=text;return text
  }
  configureText(text:Text,value:string,role:TextRole,width:number,height:number,color?:vec4):void {
    text.text=value;text.depthTest=true;applyTextRole(text,role,this.textScale)
    text.horizontalAlignment=HorizontalAlignment.Center
    text.verticalAlignment=VerticalAlignment.Center
    text.horizontalOverflow=HorizontalOverflow.Wrap
    text.verticalOverflow=VerticalOverflow.Overflow
    text.layoutRect=Rect.create(-width/2,width/2,-height/2,height/2)
    text.textFill.color=color??new vec4(1,1,1,1)
  }
  button(parent:SceneObject,name:string,label:string,width:number,height:number,
    action:()=>void,primary=false):Button {
    let button!:Button
    this.child(parent,name,width,height,child=>{
      button=child.createComponent(Button.getTypeName()) as Button
      button.setTheme("SnapOS2",primary?"Primary":"Secondary")
      button.onInitialized.add(()=>{
        button.size=new vec3(width,height,1)
        // This Lens uses pinch selection; exclude proximity-poke activation.
        button.interactable.targetingMode=3
      })
      const labelObject=this.object(child,name+"Label",new vec3(0,0,.08))
      const text=labelObject.createComponent("Component.Text") as Text
      this.configureText(text,label,"Button",width-.8,height-.3)
      this.texts[name+"Label"]=text
    })
    this.owner.createEvent("OnStartEvent").bind(()=>button.onTriggerUp.add(action))
    this.buttons[name]=button;return button
  }
  set(name:string,value:string,color?:vec4):void {
    const text=this.texts[name]
    if(text && text.text!==value)text.text=value
    if(text && color) {
      const key=[color.x,color.y,color.z,color.w].join(",")
      if(this.colours[name]!==key){text.textFill.color=color;this.colours[name]=key}
    }
  }
  setAccent(name:string,value:string):void {this.set(name,value,this.accent)}
}
