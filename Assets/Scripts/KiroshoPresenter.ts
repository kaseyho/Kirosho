import {ShadeSession, ShadeEvaluation, formatMinute, MODEL_VERSION} from "./Engine/ShadeEngine"

export interface ShadePresentation {
  phase:string; clock:string; metric:string; comparison:string; status:string; findLabel:string;
  zones:Array<{id:string;label:string;now:string;period:string;trade:string;loss:boolean}>;
  selectedTitle:string; selectedDetail:string; selectedPeriod:string; plane:string; profile:string;
  reviewMetrics:string; gain:string; tradeoff:string; searched:string; comparisonNote:string; suggestionReady:boolean;
  committed:string; model:string; inspection:string; inspectionDetail:string; noActivity:boolean;
}
export const percent=(value:number|null|undefined):string=>value==null?"No activity":value.toFixed(1)+"%"
const delta=(a:number|null|undefined,b:number|null|undefined):string=>a==null||b==null?"No activity":
  ((a-b)>=0?"+":"")+(a-b).toFixed(1)+" pp"
function total(e:ShadeEvaluation|null):string {return percent(e?.coveragePercent)}
export function presentShade(s:ShadeSession):ShadePresentation {
  const current=s.evaluation,baseline=s.baselineEvaluation,suggest=s.suggestion
  const selected=s.scenario.zones.find(z=>z.id===s.selectedZoneId)??s.scenario.zones[0]
  const selectedValue=current?.zones.find(z=>z.id===selected?.id)
  const profile=s.scenario.profile==="school-day"?"School day":s.scenario.profile==="lunch-event"?"Lunch event":"No activity"
  const zones=s.scenario.zones.map(zone=>{
    const now=current?.zones.find(z=>z.id===zone.id),proposed=suggest?.evaluation.zones.find(z=>z.id===zone.id)
    const before=suggest?now:baseline?.zones.find(z=>z.id===zone.id),after=proposed??now
    return {id:zone.id,label:zone.label,
      now:now?.currentPeople?`${now.currentPeople} people • ${percent(now.currentAreaPercent)} now`:"Inactive now",
      period:percent(now?.coveragePercent),
      trade:`${percent(before?.coveragePercent)} → ${percent(after?.coveragePercent)}\n${delta(after?.coveragePercent,before?.coveragePercent)}`,
      loss:!!(after && before && after.shadedPersonMinutes<before.shadedPersonMinutes-1e-8)}
  })
  const losses=zones.filter(z=>z.loss)
  const gain=suggest?delta(suggest.evaluation.coveragePercent,suggest.comparison.coveragePercent):delta(current?.coveragePercent,baseline?.coveragePercent)
  const selectedDetail=selected?`${selected.activityHeight.toFixed(1)} m activity plane\n`+
    (selected.schedule.length?selected.schedule.map(i=>`${formatMinute(i.start)}–${formatMinute(i.end)}: ${i.people} people`).join("\n"):"No scheduled activity"):"Scenario unavailable"
  let status=s.message||"Pinch and move either shelter handle"
  if(s.status==="searching")status=`Searching ${Math.round(s.searchProgress*100)}%\n${s.search?.evaluatedCount??0} grid layouts evaluated`
  if(s.status==="updating")status="Updating coverage…\nPrevious totals remain visible"
  const committed=s.committedPlan
  return {phase:s.status,clock:formatMinute(s.minute)+" SGT",metric:total(current),
    comparison:`Starting ${total(baseline)}\nCurrent ${total(current)} • ${delta(current?.coveragePercent,baseline?.coveragePercent)}`,
    status,findLabel:s.status==="searching"?"Finding placement…":"Find better placement",
    zones,selectedTitle:selected?.label??"Scenario unavailable",selectedDetail,
    selectedPeriod:"Whole period: "+percent(selectedValue?.coveragePercent),
    plane:`${selected?.activityHeight.toFixed(1)??"—"} m analysis plane • Cyan = shade`,profile,
    reviewMetrics:`Starting ${total(baseline)}\nCurrent ${total(current)}\nSuggested ${suggest?percent(suggest.evaluation.coveragePercent):"—"}`,
    gain,tradeoff:losses.length?"LOSES COVERAGE: "+losses.map(z=>z.label).join(", "):"No zone loses whole-period coverage",
    searched:suggest?`${suggest.evaluatedCount.toLocaleString()} layouts • 0.5 m grid`:
      s.status==="no-better"?"Current layout retained":"Best evaluated grid layout",
    comparisonNote:suggest?"Current → suggested. Same inputs; review every zone.":"Starting → current. Same inputs; whole-period coverage.",
    suggestionReady:!!suggest,
    committed:committed?`SESSION PLAN SAVED\n${committed.scenarioId}\n${profile} • ${formatMinute(committed.minute)} SGT\nPlanning window 12:00–17:00\n${committed.layout.shelters.map(p=>`Shelter ${p.id}: E${p.e.toFixed(1)}, N${p.n.toFixed(1)} m`).join("\n")}\nCoverage ${percent(committed.evaluation.coveragePercent)}\n${Math.round(committed.evaluation.shadedPersonMinutes).toLocaleString()} shaded person-min\nLayout ${committed.layoutFingerprint}\nInputs ${committed.scenarioFingerprint}\nSolar SHA-256 ${committed.solarSha256.slice(0,12)}…\n${committed.modelVersion}\nFull snapshot retained in this session.`:"Commit records the current layout, inputs and modeled results for this session.",
    model:`ILLUSTRATIVE SCENARIO\nFlat 12 × 8 m site.\nTwo 3 × 3 m roofs, 2.8 m high.\nFlat, north-aligned roofs.\nPeople distributed uniformly\ninside each activity zone.\n\nCyan: modeled shade at\nthe selected activity height.\nSolar: Singapore,\n20 Oct 2026. Offline SPA.\nFive-minute scoring.\nBest evaluated 0.5 m grid;\nnot a continuous optimum.\n\nNo weather or thermal model.\nTemperature, health or carbon\nbenefits are not measured.\n${MODEL_VERSION}`,
    inspection:`FULL-SCALE INSPECTION\n${selected?.label??"Activity zone"}\nObservation ${s.observationIndex+1} of 3\n${formatMinute(s.minute)} SGT`,
    inspectionDetail:`${selected?.activityHeight.toFixed(1)??"—"} m • ${selectedValue?.currentPeople??0} people now\n${percent(selectedValue?.currentAreaPercent)} area shaded\nPeriod: ${total(current)} overall`,
    noActivity:current?.scheduledPersonMinutes===0}
}
