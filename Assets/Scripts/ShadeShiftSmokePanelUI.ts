/** M0 passive UIKit view. Owns presentation and emits button intent; no domain state. */
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {BackPlate} from "SpectaclesUIKit.lspkg/Scripts/BackPlate"
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout"
import {FlexItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem"
import {FlexAlign, FlexAlignSelf, FlexDirection, FlexJustify} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"

type TextRole = "Title2" | "Body" | "Button" | "Caption"
const TYPE_SCALE: Record<TextRole, {size: number; weight: number}> = {
  Title2: {size: 93, weight: 700}, Body: {size: 39, weight: 500},
  Button: {size: 39, weight: 500}, Caption: {size: 38, weight: 500}
}
function applyTextRole(text: Text, role: TextRole): void {
  text.size = TYPE_SCALE[role].size
  ;(text as Text & {weight?: number}).weight = TYPE_SCALE[role].weight
}

@component
export class ShadeShiftSmokePanelUI extends BaseScriptComponent {
  @ui.label("ShadeShift M0 - passive workflow check panel")
  @ui.separator
  @input
  @hint("Width of the diagnostic panel in centimetres")
  @widget(new SliderWidget(28, 44, 1))
  widthCm: number = 34

  @input
  @hint("Padding around the diagnostic rows in centimetres")
  @widget(new SliderWidget(1, 3, 0.25))
  paddingCm: number = 2

  @input
  @hint("Heading shown above the local workflow controls")
  title: string = "ShadeShift"

  @input
  @hint("Label on the button used by the automated smoke test")
  buttonLabel: string = "Test button"

  public readonly onTest = new Event<void>()
  private countText!: Text
  private testButton!: Button

  onAwake(): void {
    this.sceneObject.createComponent("Component.Canvas")
    const plate = this.sceneObject.createComponent(BackPlate.getTypeName()) as BackPlate
    const content = this.obj(this.sceneObject, "SmokeContent", new vec3(0, 0, 0.6))
    const outer = this.flexColumn(content, this.widthCm, -1,
      {gap: 1, padX: this.paddingCm, padY: this.paddingCm})
    const layout = outer.getComponent(FlexLayout.getTypeName()) as FlexLayout
    layout.onLayoutComplete.add(result => {
      plate.size = new vec2(result.containerWidth, result.containerHeight)
    })
    const innerWidth = this.widthCm - 2 * this.paddingCm
    this.addRow(outer, "SmokeHeading", this.title, "Title2", 3.5, innerWidth)
    this.addRow(outer, "SmokeSubtitle", "LOCAL WORKFLOW CHECK", "Caption", 2.4, innerWidth)
    this.countText = this.addRow(outer, "SmokeButtonCount", "Button presses: 0", "Body", 2.4, innerWidth)
    this.flexChild(outer, {w: innerWidth, h: 6}, buttonObject => {
      buttonObject.name = "SmokeTestButton"
      this.testButton = buttonObject.createComponent(Button.getTypeName()) as Button
      this.testButton.onInitialized.add(() => {
        this.testButton.size = new vec3(innerWidth, 6, 1)
      })
      const labelObject = this.obj(buttonObject, "SmokeButtonLabel", new vec3(0, 0, 0.08))
      this.label(labelObject, this.buttonLabel, "Button", innerWidth - 1, 3)
    })
    this.addRow(outer, "SmokeDragInstruction", "Pinch and drag the cyan cube", "Body", 2.4, innerWidth)
    this.createEvent("OnStartEvent").bind(() => {
      this.testButton.onTriggerUp.add(() => this.onTest.invoke())
    })
  }

  public setCount(count: number): void {
    this.countText.text = `Button presses: ${count}`
  }

  private addRow(parent: SceneObject, name: string, value: string,
      role: TextRole, height: number, width: number): Text {
    let text!: Text
    this.flexChild(parent, {w: width, h: height}, child => {
      child.name = name
      const item = child.getComponent(FlexItem.getTypeName()) as FlexItem
      item.alignSelf = FlexAlignSelf.Stretch
      text = this.label(child, value, role, width, height)
    })
    return text
  }

  private label(parent: SceneObject, value: string, role: TextRole, width: number, height: number): Text {
    const text = parent.createComponent("Component.Text") as Text
    text.text = value
    text.depthTest = true
    applyTextRole(text, role)
    text.horizontalAlignment = HorizontalAlignment.Center
    text.verticalAlignment = VerticalAlignment.Center
    text.horizontalOverflow = HorizontalOverflow.Overflow
    text.verticalOverflow = VerticalOverflow.Overflow
    text.layoutRect = Rect.create(-width / 2, width / 2, -height / 2, height / 2)
    return text
  }

  private obj(parent: SceneObject, name: string, position?: vec3): SceneObject {
    const sceneObject = global.scene.createSceneObject(name)
    sceneObject.setParent(parent)
    if (position) sceneObject.getTransform().setLocalPosition(position)
    return sceneObject
  }

  private liftInZ(sceneObject: SceneObject, zOffset: number): void {
    const transform = sceneObject.getTransform()
    const position = transform.getLocalPosition()
    transform.setLocalPosition(new vec3(position.x, position.y, position.z + zOffset))
  }

  private flexColumn(parent: SceneObject, width: number, height: number,
      options?: {gap?: number; padY?: number; padX?: number}): SceneObject {
    const container = this.obj(parent, "SmokeColumn")
    this.liftInZ(container, 0.02)
    const flex = container.createComponent(FlexLayout.getTypeName()) as FlexLayout
    // UIKit 2.0 requires manual discovery mode when addItems runs before OnStart.
    flex.autoDiscoverItemsOnStart = false
    const item = container.createComponent(FlexItem.getTypeName()) as FlexItem
    if (width > 0) item.overrideWidth = width
    if (height > 0) item.overrideHeight = height
    flex.onInitialized.add(() => {
      flex.width = width
      flex.height = height
      flex.direction = FlexDirection.Column
      flex.rowGap = options?.gap ?? 0
      flex.paddingTop = options?.padY ?? 0
      flex.paddingBottom = options?.padY ?? 0
      flex.paddingLeft = options?.padX ?? 0
      flex.paddingRight = options?.padX ?? 0
      flex.justifyContent = FlexJustify.Start
      flex.alignItems = FlexAlign.Stretch
    })
    return container
  }

  private flexChild(parent: SceneObject, size: {w?: number; h?: number},
      builder: (child: SceneObject) => void): SceneObject {
    const child = this.obj(parent, "SmokeItem")
    this.liftInZ(child, 0.02)
    const item = child.createComponent(FlexItem.getTypeName()) as FlexItem
    if (size.w !== undefined) item.overrideWidth = size.w
    if (size.h !== undefined) item.overrideHeight = size.h
    item.flexGrow = 0
    item.flexShrink = 0
    builder(child)
    const layout = parent.getComponent(FlexLayout.getTypeName()) as FlexLayout
    layout.addItems([item])
    return child
  }
}
