/** Editor-only fault injection for testing real error display and Reset recovery. */
import {ShadeShiftMain} from "./ShadeShiftMain"
import {courtyardScenario} from "../Data/CourtyardScenario"
import {ShadeShiftSmokeLeafIndex} from "./ShadeShiftSmokeLeafIndex"

@component
export class ShadeShiftQAHarness extends BaseScriptComponent {
  @input @hint("Session owner used only by the Editor integration tests")
  main!:ShadeShiftMain
  onAwake():void {
    if(global.deviceInfoSystem.isEditor())this.sceneObject.createComponent(ShadeShiftSmokeLeafIndex.getTypeName())
  }
  loadInvalidScenario():void {
    if(!global.deviceInfoSystem.isEditor())throw new Error("QA fixture is Editor-only")
    const broken=courtyardScenario();broken.roof.width=0
    this.main.loadQAScenario(broken)
  }
  loadNoFeasibleScenario():void {
    if(!global.deviceInfoSystem.isEditor())throw new Error("QA fixture is Editor-only")
    const fixture=courtyardScenario();fixture.gridStep=100
    this.main.loadQAScenario(fixture)
  }
}
