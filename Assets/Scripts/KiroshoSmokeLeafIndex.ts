/** Preview-only M0 scenario registry. Does not auto-run tests during normal preview. */
import {scenariosIndex} from "Leaf 2.lspkg/Scenarios/decorator/ScenarioIndexDecorator"
import {ScenarioMetadata} from "Leaf 2.lspkg/Scenarios/scenario/ScenarioMetadata"
import {KiroshoSmokeScenario} from "./KiroshoSmokeScenario"
import {KiroshoFlowScenario} from "../QA/Runtime/KiroshoFlowScenario"
import {KiroshoIKScenario} from "../QA/Runtime/KiroshoIKScenario"

@component
export class KiroshoSmokeLeafIndex extends BaseScriptComponent {
  @scenariosIndex
  static scenariosIndex: ScenarioMetadata[] = [{
    id: "kirosho-m0-smoke",
    typename: KiroshoSmokeScenario.getTypeName(),
    parameters: {expectedButtonIncrement: "1"}
  }, ...["timeline","placement","search","cancel-stale","inspect-commit","recovery"].map(flow=>({
    id:"kirosho-"+flow,
    typename:KiroshoFlowScenario.getTypeName(),
    parameters:{flow:flow,demoPauseMs:"120","__leaf__diagnostic_report_duration_ms":"0"}
  })), {
    id:"kirosho-ik-route",
    typename:KiroshoIKScenario.getTypeName(),
    parameters:{"__leaf__diagnostic_policy":"fail-fast","__leaf__diagnostic_report_duration_ms":"0","__leaf__timeout_secs":"45"}
  }]
}
