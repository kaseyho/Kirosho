/** M0 state owner. Requires the passive smoke UI; never constructs UI or geometry. */
import {ShadeShiftSmokePanelUI} from "./ShadeShiftSmokePanelUI"

@component
export class ShadeShiftSmokeMain extends BaseScriptComponent {
  @ui.label("ShadeShift M0 - button state owner")
  @ui.separator
  @input
  @hint("Authored smoke panel component")
  panel!: ShadeShiftSmokePanelUI

  private buttonPresses = 0

  onAwake(): void {
    this.createEvent("OnStartEvent").bind(() => {
      if (!this.panel) {
        console.error("[ShadeShiftSmoke] Missing panel input")
        return
      }
      this.panel.setCount(this.buttonPresses)
      this.panel.onTest.add(() => {
        this.buttonPresses += 1
        this.panel.setCount(this.buttonPresses)
        console.info(`[ShadeShiftSmoke] buttonPresses=${this.buttonPresses}`)
      })
      console.info("[ShadeShiftSmoke] ready")
    })
  }
}
