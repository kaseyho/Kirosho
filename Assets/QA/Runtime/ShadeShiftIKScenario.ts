import {Scenario} from "Leaf 2.lspkg/Scenarios/scenario/Scenario"
import {createIKInteractor} from "Leaf 2.lspkg/Interactors/interactor/ik/visualizer/BitmojiAvatar"
import {expect} from "Leaf 2.lspkg/Utils/common/Expect"
import {sleep} from "Leaf 2.lspkg/Utils/common/Utils"
import {ShadeShiftLeafInteractor,control} from "./ShadeShiftLeafInteractor"

@component
export class ShadeShiftIKScenario extends Scenario {
  async run():Promise<void> {
    await sleep(1500)
    const input=new ShadeShiftLeafInteractor();await input.reset()
    const main=input.main,target=control("ShadeLater")
    const before=main.actionCounts.later??0,minute=main.session!.minute
    const ik=createIKInteractor();await ik.ready
    const indirect=ik.right.isIndirect(target)
    console.info("[ShadeShiftReachability] "+JSON.stringify({control:"ShadeLater",route:indirect?"indirect/far-field":"direct",
      limitation:indirect?"Control is beyond direct arm reach; this checks indirect operation only":"Simulated IK reach; physical comfort remains unverified"}))
    // Registry uses diagnostic_policy=fail-fast: no fallback may hide a reach,
    // convergence or occlusion failure behind a scripted controller.
    await ik.trigger(target)
    await sleep(150)
    expect((main.actionCounts.later??0)-before).toBe(1)
    expect(main.session!.minute-minute).toBe(15)
    console.info("[ShadeShiftLeafResult] "+JSON.stringify({flow:"ik-route",indirect,audit:main.audit()}))
  }
}
