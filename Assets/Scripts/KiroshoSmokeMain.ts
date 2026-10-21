/** M0 state owner. Requires the passive smoke UI; never constructs UI or geometry. */
import {KiroshoSmokePanelUI} from "./KiroshoSmokePanelUI"

@component
export class KiroshoSmokeMain extends BaseScriptComponent {
  @ui.label("Kirosho M0 - button state owner")
  @ui.separator
  @input
  @hint("Authored smoke panel component")
  panel!: KiroshoSmokePanelUI

  private buttonPresses = 0

  onAwake(): void {
    this.createEvent("OnStartEvent").bind(() => {
      if (!this.panel) {
        console.error("[KiroshoSmoke] Missing panel input")
        return
      }
      this.panel.setCount(this.buttonPresses)
      this.panel.onTest.add(() => {
        this.buttonPresses += 1
        this.panel.setCount(this.buttonPresses)
        console.info(`[KiroshoSmoke] buttonPresses=${this.buttonPresses}`)
      })
      console.info("[KiroshoSmoke] ready")
    })
  }
}
