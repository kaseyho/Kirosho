import {Scenario} from "Leaf 2.lspkg/Scenarios/scenario/Scenario"
import {ScenarioConfig} from "Leaf 2.lspkg/Scenarios/scenario/ScenarioConfig"
import {expect} from "Leaf 2.lspkg/Utils/common/Expect"
import {findSceneObjectByName,sleep} from "Leaf 2.lspkg/Utils/common/Utils"
import {KiroshoLeafInteractor,text,until} from "./KiroshoLeafInteractor"
import {layoutFingerprint,formatMinute,validateLayout} from "../../Scripts/Engine/ShadeEngine"

@component
export class KiroshoFlowScenario extends Scenario {
  async run(config?:ScenarioConfig):Promise<void> {
    await sleep(1500)
    const input=new KiroshoLeafInteractor(config?.getNumber("demoPauseMs")??120)
    await input.reset()
    const main=input.main,s=main.session!,flow=config?.get("flow")??"timeline"
    const startLayout=input.fingerprint(),startCoverage=s.evaluation!.coveragePercent!
    if(flow==="timeline") {
      const before=main.actionCounts["timeline-drag"]??0
      const minute=await input.dragTimeline()
      expect((main.actionCounts["timeline-drag"]??0)-before).toBeGreaterThan(0)
      expect(text("ShadeClock")).toBe(formatMinute(minute)+" SGT")
      // Exercise the full planning period through the real preset controls.
      // The configurable holds also make this same verified path readable in
      // the recorded demonstration without inserting time or shade results.
      for(const hour of [12,13,14,15,16,17]) {
        await input.tap("ShadeTime"+hour)
        expect(s.minute).toBe(hour*60)
        expect(text("ShadeClock")).toBe(formatMinute(hour*60)+" SGT")
      }
      for(const [id,height] of [["lunch",1.6],["seating",1.2],["pickup",1.6]] as Array<[string,number]>) {
        const count=main.actionCounts["zone:"+id]??0
        await input.tap("ShadeZone"+id)
        expect((main.actionCounts["zone:"+id]??0)-count).toBe(1)
        expect(s.selectedZoneId).toBe(id)
        expect(text("ShadeSelectedSchedule").includes(height.toFixed(1)+" m")).toBe(true)
        expect(text("ShadePlaneLegend").includes(height.toFixed(1)+" m")).toBe(true)
      }
      expect(input.fingerprint()).toBe(startLayout)
    } else if(flow==="placement") {
      const moved=await input.dragShelter("A",{e:2,n:3})
      expect(moved.sawGhost).toBe(true)
      expect(input.fingerprint()!==startLayout).toBe(true)
      expect(validateLayout(s.scenario,s.layout).valid).toBe(true)
      const shelter=s.layout.shelters.find(p=>p.id==="A")!
      expect(Math.abs(shelter.e-2)<.51 && Math.abs(shelter.n-3)<.51).toBe(true)
      expect(Math.abs(s.evaluation!.coveragePercent!-startCoverage)>0.01).toBe(true)
      const lastValid=input.fingerprint()
      for(const [destination,reason] of [[{e:6,n:3},"corridor"],[{e:0,n:3},"inside"],[{e:10,n:6},"overlap"]] as Array<[{e:number;n:number},string]>) {
        const result=await input.dragShelter("A",destination,1800)
        expect(result.sawGhost).toBe(true)
        expect(result.reasons.some(value=>value.toLowerCase().includes(reason))).toBe(true)
        expect(input.fingerprint()).toBe(lastValid)
        expect(s.message.includes("Returned to the last valid placement")).toBe(true)
      }
    } else if(flow==="search") {
      await input.find()
      expect(s.status).toBe("suggestion")
      const proposed=s.suggestion!
      expect(input.fingerprint()).toBe(startLayout)
      expect(proposed.evaluation.inputHash).toBe(proposed.comparison.inputHash)
      expect(proposed.evaluation.coveragePercent!).toBeGreaterThan(startCoverage)
      expect(proposed.evaluatedCount).toBe(5436)
      expect(text("ShadeTradeoff").includes("Lunch queue")).toBe(true)
      expect(text("ShadeTradelunch").includes("0.0%")).toBe(true)
      const applyBefore=main.actionCounts.apply??0
      await input.tap("ShadeApply")
      await until(()=>s.status!=="updating","applied calculation")
      expect((main.actionCounts.apply??0)-applyBefore).toBe(1)
      expect(input.fingerprint()).toBe(layoutFingerprint(proposed.layout))
      expect(s.evaluation!.coveragePercent!).toBeGreaterThan(startCoverage)
      await input.find()
      expect(s.status).toBe("no-better")
      expect(s.suggestion===null).toBe(true)
      await input.tap("ShadeUndo")
      expect(input.fingerprint()).toBe(startLayout)
      expect(s.evaluation!.coveragePercent).toBeCloseTo(startCoverage,5)
    } else if(flow==="cancel-stale") {
      await input.tap("ShadeFind",0)
      expect(s.status).toBe("searching")
      const cancelled=s.search!
      await input.tap("ShadeCancel",0)
      expect(cancelled.status).toBe("cancelled")
      expect(s.status).toBe("cancelled")
      expect(input.fingerprint()).toBe(startLayout)
      await input.tap("ShadeFind",0)
      expect(s.status).toBe("searching")
      const staleJob=s.search!,revision=s.revision,time=s.minute
      await input.tap("ShadeLater")
      expect(s.minute-time).toBe(15)
      expect(s.revision-revision).toBe(1)
      expect(staleJob.status).toBe("cancelled")
      await until(()=>s.status!=="updating","edited calculation")
      await sleep(500)
      expect(s.suggestion===null).toBe(true)
      expect(s.evaluation!.inputHash).toBe(s.baselineEvaluation!.inputHash)
      await input.tap("ShadeTabreview")
      const count=main.actionCounts.apply??0
      await input.tap("ShadeApply")
      expect((main.actionCounts.apply??0)-count).toBe(1)
      expect(input.fingerprint()).toBe(startLayout)
      expect(s.suggestion===null).toBe(true)
    } else if(flow==="inspect-commit") {
      await input.find()
      expect(s.status).toBe("suggestion")
      await input.tap("ShadeApply")
      await until(()=>s.status!=="updating","inspection plan calculation")
      const planLayout=input.fingerprint(),planCoverage=s.evaluation!.coveragePercent!
      expect(planCoverage).toBeGreaterThan(startCoverage)
      const revision=s.revision
      const span=()=>main.view.pointToWorld(12,4,0).sub(main.view.pointToWorld(0,4,0)).length
      const overviewSpan=span()
      await input.tap("ShadeFullscale")
      expect(s.viewMode).toBe("fullscale")
      expect(span()/overviewSpan).toBeCloseTo(20,3)
      for(let i=0;i<3;i++) {
        const observation=s.observationIndex
        await input.tap("ShadeNextObservation")
        expect(s.observationIndex).toBe((observation+1)%3)
      }
      expect(s.revision).toBe(revision)
      expect(input.fingerprint()).toBe(planLayout)
      await input.tap("ShadeOverview")
      expect(s.viewMode).toBe("overview")
      expect(span()).toBeCloseTo(overviewSpan,3)
      expect(s.evaluation!.coveragePercent).toBeCloseTo(planCoverage,5)
      await input.tap("ShadeCommit")
      expect(!!s.committedPlan).toBe(true)
      expect(s.committedPlan!.layoutFingerprint).toBe(planLayout)
      expect(text("ShadeCommittedPlan").includes(planLayout)).toBe(true)
      await input.tap("ShadeReset")
      expect(s.committedPlan===null).toBe(true)
      expect(input.fingerprint()).toBe(startLayout)
      expect(s.evaluation!.inputHash).toBe(s.baselineEvaluation!.inputHash)
    } else if(flow==="recovery") {
      await input.tap("ShadeProfileno-activity")
      expect(s.evaluation!.coveragePercent===null).toBe(true)
      await input.tap("ShadeFind")
      expect(s.status).toBe("no-activity")
      expect(text("ShadeStatus").includes("No scheduled activity")).toBe(true)
      await input.tap("ShadeProfilelunch-event")
      await input.find()
      expect(s.status).toBe("suggestion")
      expect(s.suggestion!.layout.shelters.every(p=>p.e<6)).toBe(true)
      expect(text("ShadeTradepickup").includes("No activity")).toBe(true)
      const qaObject=findSceneObjectByName("KiroshoQA")
      type QAInputFault=ScriptComponent & {loadInvalidScenario?:()=>void;loadNoFeasibleScenario?:()=>void}
      const harness=qaObject?.getComponents("Component.ScriptComponent").find(component=>
        typeof (component as QAInputFault).loadInvalidScenario==="function") as QAInputFault
      if(!harness?.loadInvalidScenario || !harness.loadNoFeasibleScenario)throw new Error("Editor-only QA input-fault harness is missing")
      // Only exceptional INPUT fixtures use this harness. All normal planning
      // actions, including Reset, still go through real product controls.
      harness.loadNoFeasibleScenario()
      await until(()=>s.status==="ready","QA no-grid input calculation")
      await input.find()
      expect(s.status).toBe("no-feasible")
      expect(text("ShadeStatus").includes("No permitted grid layout")).toBe(true)
      harness.loadInvalidScenario()
      await sleep(120)
      expect(s.status).toBe("error")
      expect(text("ShadeStatus").length).toBeGreaterThan(0)
      await input.tap("ShadeReset")
      expect(s.status).toBe("ready")
      expect(s.scenario.profile).toBe("school-day")
      expect(input.fingerprint()).toBe(startLayout)
      expect(s.evaluation!.coveragePercent).toBeCloseTo(startCoverage,5)
    } else throw new Error("Unknown Kirosho flow: "+flow)
    console.info("[KiroshoLeafResult] "+JSON.stringify({flow,audit:main.audit()}))
  }
}
