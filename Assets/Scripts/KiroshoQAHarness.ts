/** Editor-only fault injection for testing real error display and Reset recovery. */
import {KiroshoMain} from "./KiroshoMain"
import {courtyardScenario} from "../Data/CourtyardScenario"
import {KiroshoSmokeLeafIndex} from "./KiroshoSmokeLeafIndex"

@component
export class KiroshoQAHarness extends BaseScriptComponent {
  @input @hint("Session owner used only by the Editor integration tests")
  main!:KiroshoMain
  onAwake():void {
    if(global.deviceInfoSystem.isEditor())this.sceneObject.createComponent(KiroshoSmokeLeafIndex.getTypeName())
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
