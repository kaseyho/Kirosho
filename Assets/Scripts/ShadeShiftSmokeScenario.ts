/** M0 integration checks against observed UIKit text and the SIK prop transform. */
import {Scenario} from "Leaf 2.lspkg/Scenarios/scenario/Scenario"
import {ScenarioConfig} from "Leaf 2.lspkg/Scenarios/scenario/ScenarioConfig"
import {DefaultLeafInteractor} from "Leaf 2.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {LeafHandInteractor} from "Leaf 2.lspkg/Interactors/interactor/LeafTwoHandInteractor"
import {findInteractableByName} from "Leaf 2.lspkg/Interactors/InteractableUtils"
import {expect} from "Leaf 2.lspkg/Utils/common/Expect"
import {findSceneObjectByName, sleep} from "Leaf 2.lspkg/Utils/common/Utils"

@component
export class ShadeShiftSmokeScenario extends Scenario {
  async run(config?: ScenarioConfig): Promise<void> {
    await sleep(1200)
    const button = findInteractableByName("SmokeTestButton")
    const cube = findInteractableByName("ShadeShiftSmokeDraggable")
    const counterObject = findSceneObjectByName("SmokeButtonCount")
    const cubeObject = findSceneObjectByName("ShadeShiftSmokeDraggable")
    if (!button || !cube || !counterObject || !cubeObject) {
      throw new Error("M0 smoke scene is missing a required named control")
    }
    const counter = counterObject.getComponent("Component.Text") as Text
    const readCount = () => Number(counter.text.replace("Button presses: ", ""))
    const beforeCount = readCount()
    const beforePosition = cubeObject.getTransform().getWorldPosition()
    const interactor = new DefaultLeafInteractor("ShadeShiftM0TestInteractor")
    await interactor.trigger(button)
    await sleep(250)
    const expectedIncrement = config?.getNumber("expectedButtonIncrement") ?? 1
    expect(readCount() - beforeCount).toBe(expectedIncrement)

    // LEAF drag vectors are per update. Use a real hand interactor for a 3D prop;
    // the default CustomController interactor is appropriate for the button.
    await LeafHandInteractor.get("right").drag(cube, new vec3(0.25, 0, 0), 1200)
    await sleep(300)
    const afterPosition = cubeObject.getTransform().getWorldPosition()
    expect(afterPosition.x - beforePosition.x).toBeGreaterThan(2)
    expect(afterPosition.x - beforePosition.x < 30).toBe(true)
    expect(afterPosition.y).toBeCloseTo(beforePosition.y, 1)
    expect(afterPosition.z).toBeCloseTo(beforePosition.z, 1)
    console.info(`[ShadeShiftM0Test] countDelta=${readCount() - beforeCount}; dragDeltaX=${afterPosition.x - beforePosition.x}`)
  }
}
