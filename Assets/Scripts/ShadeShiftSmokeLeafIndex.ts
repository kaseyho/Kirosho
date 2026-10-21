/** Preview-only M0 scenario registry. Does not auto-run tests during normal preview. */
import {scenariosIndex} from "Leaf 2.lspkg/Scenarios/decorator/ScenarioIndexDecorator"
import {ScenarioMetadata} from "Leaf 2.lspkg/Scenarios/scenario/ScenarioMetadata"
import {ShadeShiftSmokeScenario} from "./ShadeShiftSmokeScenario"
import {ShadeShiftFlowScenario} from "../QA/Runtime/ShadeShiftFlowScenario"
import {ShadeShiftIKScenario} from "../QA/Runtime/ShadeShiftIKScenario"

@component
export class ShadeShiftSmokeLeafIndex extends BaseScriptComponent {
  @scenariosIndex
  static scenariosIndex: ScenarioMetadata[] = [{
    id: "shadeshift-m0-smoke",
    typename: ShadeShiftSmokeScenario.getTypeName(),
    parameters: {expectedButtonIncrement: "1"}
  }, ...["timeline","placement","search","cancel-stale","inspect-commit","recovery"].map(flow=>({
    id:"shadeshift-"+flow,
    typename:ShadeShiftFlowScenario.getTypeName(),
    parameters:{flow:flow,demoPauseMs:"120","__leaf__diagnostic_report_duration_ms":"0"}
  })), {
    id:"shadeshift-ik-route",
    typename:ShadeShiftIKScenario.getTypeName(),
    parameters:{"__leaf__diagnostic_policy":"fail-fast","__leaf__diagnostic_report_duration_ms":"0","__leaf__timeout_secs":"45"}
  }]
}
