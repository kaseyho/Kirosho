/** Offline, import-free calculation/state core shared by Lens Studio and Node. */
export const MODEL_VERSION = "shade-rect-1.0.0";
const EPS = 1e-8;

export type Point = { e: number; n: number };
export type Rect = { eMin: number; eMax: number; nMin: number; nMax: number };
export type SunVector = { east: number; north: number; up: number };
export type SolarRow = readonly [number, number, number, number];
export interface SolarData {
  readonly sha256: string;
  readonly inspection: ReadonlyArray<SolarRow>;
  readonly evaluation5: ReadonlyArray<SolarRow>;
  readonly evaluation1: ReadonlyArray<SolarRow>;
  readonly metadata: { readonly timezone: string; readonly date: string };
}
export type OccupancyInterval = { start: number; end: number; people: number };
export type Zone = { id: string; label: string; rect: Rect; activityHeight: number; schedule: OccupancyInterval[] };
export type Placement = Point & { id: string };
export type Layout = { shelters: Placement[] };
export type Roof = { width: number; depth: number; height: number };
export interface SiteScenario {
  id: string; label: string; profile: string;
  site: Rect; blocked: Array<{ label: string; rect: Rect }>;
  roof: Roof; shelterIds: string[]; gridStep: number;
  period: [number, number]; zones: Zone[]; baseline: Layout;
}
export type PlacementCheck = { valid: boolean; reason: string };
export type ZoneEvaluation = {
  id: string; label: string; activityHeight: number;
  currentPeople: number; currentAreaPercent: number; currentCoveragePercent: number | null;
  scheduledPersonMinutes: number; shadedPersonMinutes: number; coveragePercent: number | null;
};
export type ShadeEvaluation = {
  revision: number; minute: number; inputHash: string; layoutHash: string;
  zones: ZoneEvaluation[]; scheduledPersonMinutes: number; shadedPersonMinutes: number;
  coveragePercent: number | null; stepMinutes: number;
};
export type PlacementSuggestion = {
  sourceRevision: number; inputHash: string; sourceLayoutHash: string;
  layout: Layout; evaluation: ShadeEvaluation; comparison: ShadeEvaluation;
  evaluatedCount: number; candidateCenterCount: number; movementMeters: number;
};
export type PlanSnapshot = {
  schema: string; modelVersion: string; scenarioId: string; profile: string;
  scenarioFingerprint: string; solarSha256: string; layoutFingerprint: string;
  fingerprintScheme: string; layout: Layout; minute: number;
  evaluation: ShadeEvaluation; baselineEvaluation: ShadeEvaluation;
};

export function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  if (value !== null && typeof value === "object") {
    const obj = value as { [key: string]: unknown };
    return "{" + Object.keys(obj).sort().map(k => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(",") + "}";
  }
  const encoded = JSON.stringify(value);
  if (encoded === undefined) throw new Error("Only defined JSON data can be fingerprinted");
  return encoded;
}
/** Reproducibility fingerprint, not an authentication or cryptographic hash. */
export function fingerprint(value: unknown): string {
  const text = stableStringify(value);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return "fnv1a32:" + (hash >>> 0).toString(16).padStart(8, "0");
}
export function area(r: Rect | null): number {
  return r ? Math.max(0, r.eMax - r.eMin) * Math.max(0, r.nMax - r.nMin) : 0;
}
export function intersection(a: Rect, b: Rect): Rect {
  return { eMin: Math.max(a.eMin,b.eMin), eMax: Math.min(a.eMax,b.eMax), nMin: Math.max(a.nMin,b.nMin), nMax: Math.min(a.nMax,b.nMax) };
}
export function roofFootprint(p: Point, roof: Roof): Rect {
  return { eMin:p.e-roof.width/2, eMax:p.e+roof.width/2, nMin:p.n-roof.depth/2, nMax:p.n+roof.depth/2 };
}
export function projectRoof(p: Point, roof: Roof, sun: SunVector, planeHeight: number): Rect | null {
  if (![p.e,p.n,roof.width,roof.depth,roof.height,sun.east,sun.north,sun.up,planeHeight].every(Number.isFinite)) return null;
  if (sun.up <= 0.00001 || planeHeight > roof.height || roof.width <= 0 || roof.depth <= 0) return null;
  const height = roof.height - planeHeight;
  return roofFootprint({e:p.e-height*sun.east/sun.up,n:p.n-height*sun.north/sun.up},roof);
}
/** Exact inclusion-exclusion for two clipped rectangles; shared shade counts once. */
export function unionCoverage(zone: Rect, shadows: Array<Rect | null>): number {
  if (shadows.length > 2) throw new Error("The v1 model supports at most two shelters");
  const clips = shadows.filter((r): r is Rect => r !== null).map(r => intersection(zone,r));
  let covered = clips.reduce((sum,r) => sum + area(r),0);
  if (clips.length === 2) covered -= area(intersection(clips[0],clips[1]));
  return area(zone) > EPS ? Math.max(0,Math.min(1,covered/area(zone))) : 0;
}
export function shadeFraction(zone: Zone, layout: Layout, roof: Roof, sun: SunVector): number {
  return unionCoverage(zone.rect,layout.shelters.map(p => projectRoof(p,roof,sun,zone.activityHeight)));
}
export function peopleAt(zone: Zone, minute: number): number {
  return zone.schedule.reduce((sum,s) => sum + (minute >= s.start && minute < s.end ? s.people : 0),0);
}
export function sunAt(solar: SolarData, minute: number): SunVector {
  const rows = solar.inspection;
  if (!rows.length || !Number.isFinite(minute)) throw new Error("Solar samples or selected time are invalid");
  let low=0, high=rows.length-1;
  const t=Math.max(rows[0][0],Math.min(rows[high][0],minute));
  while(high-low>1) { const mid=(low+high)>>1; if(rows[mid][0]<=t) low=mid; else high=mid; }
  const a=rows[low],b=rows[high];
  const f=b[0]===a[0]?0:(t-a[0])/(b[0]-a[0]);
  const east=a[1]+f*(b[1]-a[1]),north=a[2]+f*(b[2]-a[2]),up=a[3]+f*(b[3]-a[3]);
  const length=Math.sqrt(east*east+north*north+up*up);
  if(length<EPS) throw new Error("Solar direction has no length");
  return {east:east/length,north:north/length,up:up/length};
}
function finiteRect(r: Rect): boolean {
  return !!r && [r.eMin,r.eMax,r.nMin,r.nMax].every(Number.isFinite) && area(r)>EPS;
}
function contained(inner: Rect,outer: Rect): boolean {
  return inner.eMin>=outer.eMin-EPS && inner.eMax<=outer.eMax+EPS && inner.nMin>=outer.nMin-EPS && inner.nMax<=outer.nMax+EPS;
}
export function validateLayout(scenario: SiteScenario,layout: Layout): PlacementCheck {
  if(!layout || !Array.isArray(layout.shelters) || layout.shelters.length!==2) return {valid:false,reason:"Place exactly two shelters"};
  if(layout.shelters.some(p=>!p)) return {valid:false,reason:"Shelter data is missing"};
  const ids=layout.shelters.map(s=>s.id);
  if(new Set(ids).size!==2 || scenario.shelterIds.some(id=>!ids.includes(id))) return {valid:false,reason:"Shelter identifiers do not match the inventory"};
  for(const p of layout.shelters) {
    if(![p.e,p.n].every(Number.isFinite)) return {valid:false,reason:"Shelter coordinates are invalid"};
    const footprint=roofFootprint(p,scenario.roof);
    if(!contained(footprint,scenario.site)) return {valid:false,reason:"Keep the entire shelter inside the courtyard"};
    for(const blocked of scenario.blocked) if(area(intersection(footprint,blocked.rect))>EPS) return {valid:false,reason:"Keep " + blocked.label.toLowerCase() + " clear"};
  }
  if(area(intersection(roofFootprint(layout.shelters[0],scenario.roof),roofFootprint(layout.shelters[1],scenario.roof)))>EPS) return {valid:false,reason:"Shelters cannot overlap"};
  return {valid:true,reason:""};
}
export function validateScenario(s: SiteScenario,solar?: SolarData): string | null {
  if(!s || !finiteRect(s.site) || !s.roof || ![s.roof.width,s.roof.depth,s.roof.height,s.gridStep].every(v=>Number.isFinite(v)&&v>0)) return "Courtyard or shelter dimensions are invalid";
  if(!Array.isArray(s.shelterIds) || s.shelterIds.length!==2 || new Set(s.shelterIds).size!==2) return "The model requires two distinct shelter identifiers";
  if(!Array.isArray(s.period) || s.period.length!==2 || !s.period.every(Number.isFinite) || s.period[1]<=s.period[0]) return "The activity period is invalid";
  if(!Array.isArray(s.zones) || !s.zones.length || s.zones.some(z=>!z || !z.id) || new Set(s.zones.map(z=>z.id)).size!==s.zones.length) return "Activity zones are missing or duplicated";
  if(!Array.isArray(s.blocked) || s.blocked.some(b=>!b || !finiteRect(b.rect))) return "Blocked-area data is invalid";
  for(const z of s.zones) {
    if(!finiteRect(z.rect) || !contained(z.rect,s.site) || !Number.isFinite(z.activityHeight) || z.activityHeight<0 || z.activityHeight>s.roof.height || !Array.isArray(z.schedule)) return "Zone geometry or activity height is invalid";
    if(z.schedule.some(item=>!item)) return "Occupancy schedules are invalid";
    const schedule=[...z.schedule].sort((a,b)=>a.start-b.start);
    for(let i=0;i<schedule.length;i++) {
      const item=schedule[i];
      if(![item.start,item.end,item.people].every(Number.isFinite) || item.start<s.period[0] || item.end>s.period[1] || item.end<=item.start || item.people<0 || (i>0 && item.start<schedule[i-1].end)) return "Occupancy schedules are invalid or overlap";
    }
  }
  if(!s.baseline) return "Starting layout is missing";
  // A valid scenario can still have no permitted GRID placement. Baseline may be off-grid.
  const baseline=validateLayout(s,s.baseline); if(!baseline.valid) return "Starting layout: " + baseline.reason;
  if(solar) {
    if(!solar.sha256 || !solar.metadata || !solar.metadata.timezone || !solar.metadata.date) return "Solar provenance is missing";
    for(const rows of [solar.inspection,solar.evaluation5,solar.evaluation1]) {
      if(!Array.isArray(rows) || !rows.length) return "Solar data is missing";
      for(let i=0;i<rows.length;i++) {
        const r=rows[i]; if(!r || r.length!==4) return "Solar data is invalid";
        const length=Math.sqrt(r[1]*r[1]+r[2]*r[2]+r[3]*r[3]);
        if(r.length!==4 || !r.every(Number.isFinite) || Math.abs(length-1)>0.000001 || (i>0 && r[0]<=rows[i-1][0])) return "Solar data is invalid or unsorted";
      }
    }
    if(solar.inspection[0][0]>s.period[0] || solar.inspection[solar.inspection.length-1][0]<s.period[1]) return "Solar data does not cover the activity period";
    for(const step of [1,5]) {
      const rows=step===1?solar.evaluation1:solar.evaluation5;
      if(rows[0][0]-step/2>s.period[0]+EPS || rows[rows.length-1][0]+step/2<s.period[1]-EPS || rows.some((r,i)=>i>0 && Math.abs(r[0]-rows[i-1][0]-step)>EPS)) return "Solar scoring intervals are incomplete";
    }
    if([...solar.evaluation5,...solar.evaluation1].some(r=>r[3]<=0.00001)) return "Scoring samples extend below the modeled solar horizon";
  }
  return null;
}
function vector(row: SolarRow): SunVector { return {east:row[1],north:row[2],up:row[3]}; }
function percent(shade: number,total: number): number | null { return total>EPS?100*shade/total:null; }
/** Occupancy is integrated exactly inside each solar bin, including partial intervals. */
function weightedMinutes(zone: Zone,minute: number,step: number,period: [number,number]): number {
  const start=Math.max(period[0],minute-step/2),end=Math.min(period[1],minute+step/2);
  if(end<=start)return 0;
  return zone.schedule.reduce((sum,s)=>sum+Math.max(0,Math.min(end,s.end)-Math.max(start,s.start))*s.people,0);
}
export function layoutFingerprint(layout: Layout): string {
  return fingerprint({shelters:[...layout.shelters].sort((a,b)=>a.id.localeCompare(b.id))});
}
export function evaluationInputHash(s: SiteScenario,solar: SolarData,minute: number,step: number): string {
  return fingerprint({scenario:s,solarSha256:solar.sha256,minute:minute,step:step});
}
export function evaluateLayout(s: SiteScenario,solar: SolarData,layout: Layout,minute: number,step: number=5,revision: number=0): ShadeEvaluation {
  const check=validateLayout(s,layout); if(!check.valid) throw new Error(check.reason);
  if(step!==1 && step!==5) throw new Error("Scoring interval must be one or five minutes");
  const rows=step===1?solar.evaluation1:solar.evaluation5,now=sunAt(solar,minute);
  const zones=s.zones.map(zone=> {
    let scheduled=0,shaded=0;
    for(const row of rows) {
      const personMinutes=weightedMinutes(zone,row[0],step,s.period);
      scheduled+=personMinutes;
      shaded+=personMinutes*shadeFraction(zone,layout,s.roof,vector(row));
    }
    const currentPeople=peopleAt(zone,minute),currentAreaPercent=100*shadeFraction(zone,layout,s.roof,now);
    return {id:zone.id,label:zone.label,activityHeight:zone.activityHeight,currentPeople:currentPeople,currentAreaPercent:currentAreaPercent,currentCoveragePercent:currentPeople>0?currentAreaPercent:null,scheduledPersonMinutes:scheduled,shadedPersonMinutes:shaded,coveragePercent:percent(shaded,scheduled)};
  });
  const scheduled=zones.reduce((sum,z)=>sum+z.scheduledPersonMinutes,0),shaded=zones.reduce((sum,z)=>sum+z.shadedPersonMinutes,0);
  return {revision:revision,minute:minute,inputHash:evaluationInputHash(s,solar,minute,step),layoutHash:layoutFingerprint(layout),zones:zones,scheduledPersonMinutes:scheduled,shadedPersonMinutes:shaded,coveragePercent:percent(shaded,scheduled),stepMinutes:step};
}
export function feasibleCenters(s: SiteScenario): Point[] {
  const points: Point[]=[],r=s.roof;
  const eCount=Math.floor((s.site.eMax-s.site.eMin-r.width)/s.gridStep+EPS);
  const nCount=Math.floor((s.site.nMax-s.site.nMin-r.depth)/s.gridStep+EPS);
  for(let e=0;e<=eCount;e++) for(let n=0;n<=nCount;n++) {
    const p={e:Number((s.site.eMin+r.width/2+e*s.gridStep).toFixed(8)),n:Number((s.site.nMin+r.depth/2+n*s.gridStep).toFixed(8))};
    const rect=roofFootprint(p,r);
    if(contained(rect,s.site) && !s.blocked.some(b=>area(intersection(rect,b.rect))>EPS)) points.push(p);
  }
  return points;
}
export function snapPoint(s: SiteScenario,p: Point): Point {
  const e0=s.site.eMin+s.roof.width/2,n0=s.site.nMin+s.roof.depth/2;
  return {e:Number((e0+Math.round((p.e-e0)/s.gridStep)*s.gridStep).toFixed(8)),n:Number((n0+Math.round((p.n-n0)/s.gridStep)*s.gridStep).toFixed(8))};
}
export function movementMeters(a: Layout,b: Layout): number {
  return a.shelters.reduce((sum,p)=> {const q=b.shelters.find(item=>item.id===p.id);if(!q)return Infinity;return sum+Math.sqrt((p.e-q.e)*(p.e-q.e)+(p.n-q.n)*(p.n-q.n));},0);
}
function orderLayouts(a: Layout,b: Layout): number {
  const aa=[...a.shelters].sort((p,q)=>p.id.localeCompare(q.id)),bb=[...b.shelters].sort((p,q)=>p.id.localeCompare(q.id));
  for(let i=0;i<aa.length;i++) {if(Math.abs(aa[i].e-bb[i].e)>EPS)return aa[i].e-bb[i].e;if(Math.abs(aa[i].n-bb[i].n)>EPS)return aa[i].n-bb[i].n;}
  return 0;
}

export class LayoutSearch {
  readonly sourceRevision: number; readonly sourceLayoutHash: string;
  readonly points: Point[]; readonly pairs: Array<[number,number]>;
  readonly scenario: SiteScenario; readonly solar: SolarData;
  readonly baseline: Layout; readonly current: Layout; readonly minute: number; readonly stepMinutes: number;
  readonly inputHash: string;
  status: "running"|"done"|"cancelled" = "running";
  phase: "positions"|"layouts" = "positions";
  evaluatedCount=0; preparedCount=0;
  bestLayout: Layout|null=null; bestShadedPersonMinutes=-Infinity; bestMovement=Infinity;
  private scores: number[]=[];
  constructor(s: SiteScenario,solar: SolarData,current: Layout,revision: number,minute: number,step: number=5) {
    const invalid=validateScenario(s,solar);if(invalid)throw new Error(invalid);
    const placement=validateLayout(s,current);if(!placement.valid)throw new Error(placement.reason);
    if(step!==1 && step!==5)throw new Error("Scoring interval must be one or five minutes");
    this.scenario=clone(s); this.solar=solar;this.current=clone(current);this.baseline=clone(s.baseline);
    this.sourceRevision=revision;this.sourceLayoutHash=layoutFingerprint(current);this.minute=minute;this.stepMinutes=step;
    this.inputHash=evaluationInputHash(s,solar,minute,step);this.points=feasibleCenters(s);this.pairs=[];
    for(let a=0;a<this.points.length;a++)for(let b=a+1;b<this.points.length;b++)if(area(intersection(roofFootprint(this.points[a],s.roof),roofFootprint(this.points[b],s.roof)))<=EPS)this.pairs.push([a,b]);
    if(!this.pairs.length)this.status="done";
  }
  get progress(): number {return this.status==="done"?1:this.phase==="positions"?0.2*this.preparedCount/Math.max(1,this.points.length):0.2+0.8*this.evaluatedCount/Math.max(1,this.pairs.length);}
  cancel(): void {if(this.status==="running")this.status="cancelled";}
  private scorePoint(point: Point): number {
    const s=this.scenario,rows=this.stepMinutes===1?this.solar.evaluation1:this.solar.evaluation5;
    const layout={shelters:[{id:s.shelterIds[0],e:point.e,n:point.n}]};let score=0;
    for(const zone of s.zones)for(const row of rows)score+=weightedMinutes(zone,row[0],this.stepMinutes,s.period)*shadeFraction(zone,layout,s.roof,vector(row));
    return score;
  }
  private assign(a: Point,b: Point): Layout {
    const ids=this.scenario.shelterIds;
    const one={shelters:[{id:ids[0],e:a.e,n:a.n},{id:ids[1],e:b.e,n:b.n}]};
    const two={shelters:[{id:ids[0],e:b.e,n:b.n},{id:ids[1],e:a.e,n:a.n}]};
    const difference=movementMeters(one,this.baseline)-movementMeters(two,this.baseline);
    return difference<-EPS?one:difference>EPS?two:orderLayouts(one,two)<=0?one:two;
  }
  step(workUnits: number=256): void {
    if(this.status!=="running")return;
    const budget=Math.max(1,Math.floor(workUnits));
    if(this.phase==="positions") {
      const end=Math.min(this.points.length,this.preparedCount+Math.max(1,Math.floor(budget/32)));
      while(this.preparedCount<end){this.scores.push(this.scorePoint(this.points[this.preparedCount]));this.preparedCount++;}
      if(this.preparedCount===this.points.length)this.phase="layouts";
      return;
    }
    const end=Math.min(this.pairs.length,this.evaluatedCount+budget);
    while(this.evaluatedCount<end) {
      const pair=this.pairs[this.evaluatedCount++];
      // Identical roofs on each common analysis plane undergo the same translation.
      // A permitted pair has disjoint footprints, hence disjoint projected shadows.
      // Exact per-position integrals therefore add; no overlap is double-counted.
      const score=this.scores[pair[0]]+this.scores[pair[1]];
      if(score<this.bestShadedPersonMinutes-EPS)continue;
      const layout=this.assign(this.points[pair[0]],this.points[pair[1]]),movement=movementMeters(layout,this.baseline);
      if(score>this.bestShadedPersonMinutes+EPS || movement<this.bestMovement-EPS || (Math.abs(movement-this.bestMovement)<=EPS && (!this.bestLayout || orderLayouts(layout,this.bestLayout)<0))) {
        this.bestShadedPersonMinutes=score;this.bestMovement=movement;this.bestLayout=layout;
      }
    }
    if(this.evaluatedCount===this.pairs.length)this.status="done";
  }
  result(): PlacementSuggestion|null {
    if(this.status!=="done" || !this.bestLayout)return null;
    return {sourceRevision:this.sourceRevision,inputHash:this.inputHash,sourceLayoutHash:this.sourceLayoutHash,layout:clone(this.bestLayout),evaluation:evaluateLayout(this.scenario,this.solar,this.bestLayout,this.minute,this.stepMinutes,this.sourceRevision),comparison:evaluateLayout(this.scenario,this.solar,this.current,this.minute,this.stepMinutes,this.sourceRevision),evaluatedCount:this.evaluatedCount,candidateCenterCount:this.points.length,movementMeters:this.bestMovement};
  }
}

export type SessionStatus = "ready"|"updating"|"searching"|"suggestion"|"no-better"|"no-feasible"|"no-activity"|"cancelled"|"error"|"committed";
export type DragState = {id:string; source:Layout; ghost:Layout; check:PlacementCheck};

/** Single owner of planning inputs. UI modules send actions and display this state. */
export class ShadeSession {
  readonly solar: SolarData;
  readonly stepMinutes: number;
  private initialScenario: SiteScenario;
  scenario: SiteScenario;
  layout: Layout;
  minute: number;
  revision=0;
  status: SessionStatus="updating";
  message="Calculating starting layout";
  selectedZoneId: string;
  viewMode: "overview"|"fullscale"="overview";
  observationIndex=0;
  evaluation: ShadeEvaluation|null=null;
  baselineEvaluation: ShadeEvaluation|null=null;
  suggestion: PlacementSuggestion|null=null;
  search: LayoutSearch|null=null;
  drag: DragState|null=null;
  committedPlan: PlanSnapshot|null=null;
  private history: Layout[]=[];

  constructor(scenario: SiteScenario,solar: SolarData,stepMinutes: number=5) {
    this.initialScenario=clone(scenario);this.scenario=clone(scenario);this.solar=solar;this.stepMinutes=stepMinutes;
    this.layout=clone(scenario.baseline || {shelters:[]});this.minute=scenario.period?scenario.period[0]:720;
    this.selectedZoneId=scenario.zones && scenario.zones[0]?scenario.zones[0].id:"";
    const error=validateScenario(scenario,solar);
    if(error || (stepMinutes!==1 && stepMinutes!==5)) {this.status="error";this.message=error || "Scoring interval is invalid";}
    else this.flushEvaluation();
  }
  get canUndo(): boolean {return this.history.length>0 && !this.drag;}
  get searchProgress(): number {return this.search?this.search.progress:0;}
  private invalidate(): void {
    if(this.search)this.search.cancel();
    this.search=null;this.suggestion=null;this.committedPlan=null;this.revision++;
    this.status="updating";this.message="Updating coverage";
  }
  private remember(layout: Layout): void {
    this.history.push(clone(layout));if(this.history.length>20)this.history.shift();
  }
  /** Called on the next update; prior results remain visible while status is updating. */
  flushEvaluation(): boolean {
    if(this.status!=="updating" || this.drag)return false;
    const error=validateScenario(this.scenario,this.solar);
    if(error) {this.status="error";this.message=error;return false;}
    try {
      const evaluation=evaluateLayout(this.scenario,this.solar,this.layout,this.minute,this.stepMinutes,this.revision);
      const baseline=evaluateLayout(this.scenario,this.solar,this.scenario.baseline,this.minute,this.stepMinutes,this.revision);
      this.evaluation=evaluation;this.baselineEvaluation=baseline;this.status="ready";this.message="";return true;
    } catch(error) {this.status="error";this.message=String(error);return false;}
  }
  setMinute(minute: number): boolean {
    if(this.status==="error" || !Number.isFinite(minute) || this.drag)return false;
    const bounded=Math.max(this.scenario.period[0],Math.min(this.scenario.period[1],minute));
    if(Math.abs(bounded-this.minute)<EPS)return false;
    this.invalidate();this.minute=bounded;return true;
  }
  selectZone(id: string): boolean {
    if(!this.scenario.zones.some(z=>z.id===id))return false;
    this.selectedZoneId=id;return true;
  }
  setViewMode(mode: "overview"|"fullscale"): void {this.viewMode=mode;this.observationIndex=0;}
  nextObservation(): void {if(this.viewMode==="fullscale")this.observationIndex=(this.observationIndex+1)%3;}
  /** Profile changes keep the physical layout, and recalculate BOTH comparisons. */
  setScenario(scenario: SiteScenario): boolean {
    const error=validateScenario(scenario,this.solar);
    if(error) {this.invalidate();this.drag=null;this.status="error";this.message=error+". Reset to recover.";return false;}
    const preserve=validateLayout(scenario,this.layout).valid;
    this.invalidate();this.drag=null;this.scenario=clone(scenario);
    if(!preserve)this.layout=clone(scenario.baseline);
    this.minute=Math.max(scenario.period[0],Math.min(scenario.period[1],this.minute));
    if(!scenario.zones.some(z=>z.id===this.selectedZoneId))this.selectedZoneId=scenario.zones[0].id;
    this.history=[];return true;
  }
  beginDrag(id: string): boolean {
    if(this.status==="error" || this.drag || !this.layout.shelters.some(p=>p.id===id))return false;
    this.invalidate();this.drag={id:id,source:clone(this.layout),ghost:clone(this.layout),check:{valid:true,reason:""}};
    this.message="Move shelter; release to snap to the 0.5 m grid";return true;
  }
  previewDrag(point: Point): PlacementCheck {
    if(!this.drag)return {valid:false,reason:"No shelter is being moved"};
    const shelter=this.drag.ghost.shelters.find(p=>p.id===this.drag!.id)!;
    shelter.e=point.e;shelter.n=point.n;
    this.drag.check=validateLayout(this.scenario,this.drag.ghost);
    this.message=this.drag.check.valid?"Release to place on the grid":this.drag.check.reason;
    return this.drag.check;
  }
  endDrag(): boolean {
    if(!this.drag)return false;
    const drag=this.drag;let check=drag.check;
    const placed=clone(drag.ghost),shelter=placed.shelters.find(p=>p.id===drag.id)!;
    const snapped=snapPoint(this.scenario,shelter);shelter.e=snapped.e;shelter.n=snapped.n;
    if(check.valid)check=validateLayout(this.scenario,placed);
    this.drag=null;
    if(check.valid) {
      if(layoutFingerprint(placed)!==layoutFingerprint(drag.source)) {this.remember(drag.source);this.layout=placed;}
      this.status="updating";this.message="Updating coverage";return true;
    }
    this.layout=drag.source;this.status="updating";this.flushEvaluation();
    this.message=check.reason+". Returned to the last valid placement.";return false;
  }
  cancelDrag(): void {
    if(!this.drag)return;
    this.layout=this.drag.source;this.drag=null;this.status="updating";this.flushEvaluation();this.message="Move cancelled";
  }
  requestSearch(): boolean {
    if(this.status==="error" || this.drag)return false;
    if(this.status==="updating" && !this.flushEvaluation())return false;
    if(!this.evaluation)return false;
    if(this.search)this.search.cancel();this.suggestion=null;this.committedPlan=null;
    if(this.evaluation.scheduledPersonMinutes<=EPS) {this.search=null;this.status="no-activity";this.message="No scheduled activity. Choose an active profile before searching.";return false;}
    try {
      this.search=new LayoutSearch(this.scenario,this.solar,this.layout,this.revision,this.minute,this.stepMinutes);
      this.status="searching";this.message="Evaluating permitted grid placements";
      this.stepSearch(1);return true;
    } catch(error) {this.status="error";this.message=String(error);return false;}
  }
  stepSearch(workUnits: number=256): void {
    const job=this.search;if(!job || this.status!=="searching")return;
    if(job.sourceRevision!==this.revision || job.sourceLayoutHash!==layoutFingerprint(this.layout) || job.inputHash!==evaluationInputHash(this.scenario,this.solar,this.minute,this.stepMinutes)) {
      job.cancel();this.search=null;this.suggestion=null;this.status="updating";this.message="Inputs changed. Recalculate placement.";return;
    }
    job.step(workUnits);if(job.status!=="done")return;
    const result=job.result();
    if(!result) {this.status="no-feasible";this.message="No permitted grid layout fits the courtyard and access constraints.";return;}
    if(result.evaluation.shadedPersonMinutes<=result.comparison.shadedPersonMinutes+EPS) {
      this.status="no-better";this.message="No better layout on the evaluated 0.5 m grid. Your current placement is retained.";return;
    }
    this.suggestion=result;this.status="suggestion";this.message="Review each zone before applying this layout";
  }
  cancelSearch(): void {
    if(this.search)this.search.cancel();this.search=null;this.suggestion=null;
    if(this.status==="searching" || this.status==="suggestion") {this.status="cancelled";this.message="Search cancelled. Your placement is unchanged.";}
  }
  applySuggestion(): boolean {
    const result=this.suggestion;
    if(!result || result.sourceRevision!==this.revision || result.sourceLayoutHash!==layoutFingerprint(this.layout) || result.inputHash!==evaluationInputHash(this.scenario,this.solar,this.minute,this.stepMinutes)) {
      this.suggestion=null;this.message="Suggestion expired. Find a placement using the current inputs.";return false;
    }
    const check=validateLayout(this.scenario,result.layout);if(!check.valid) {this.suggestion=null;this.message=check.reason;return false;}
    this.remember(this.layout);this.invalidate();this.layout=clone(result.layout);return true;
  }
  undo(): boolean {
    if(!this.canUndo)return false;
    const preceding=this.history.pop()!;this.invalidate();this.layout=preceding;return true;
  }
  reset(): void {
    this.invalidate();this.scenario=clone(this.initialScenario);this.layout=clone(this.scenario.baseline);
    this.minute=this.scenario.period[0];this.drag=null;this.history=[];this.selectedZoneId=this.scenario.zones[0].id;
    this.viewMode="overview";this.observationIndex=0;this.flushEvaluation();this.message="Starting layout restored";
  }
  commit(): PlanSnapshot|null {
    if(this.drag || this.status==="error")return null;
    if(this.status==="updating" && !this.flushEvaluation())return null;
    if(!this.evaluation || !this.baselineEvaluation)return null;
    if(this.search)this.search.cancel();this.search=null;this.suggestion=null;
    this.committedPlan=clone({schema:"shadeshift-plan-v1",modelVersion:MODEL_VERSION,scenarioId:this.scenario.id,profile:this.scenario.profile,
      scenarioFingerprint:fingerprint(this.scenario),solarSha256:this.solar.sha256,layoutFingerprint:layoutFingerprint(this.layout),
      fingerprintScheme:"Canonical JSON + FNV-1a 32-bit (non-cryptographic); solar fixture SHA-256",
      layout:this.layout,minute:this.minute,evaluation:this.evaluation,baselineEvaluation:this.baselineEvaluation});
    this.status="committed";this.message="Plan saved for this session. Layout, inputs and modeled results are recorded.";return clone(this.committedPlan);
  }
}

export function formatMinute(minute: number): string {
  const rounded=Math.round(minute);return Math.floor(rounded/60).toString().padStart(2,"0")+":"+(rounded%60).toString().padStart(2,"0");
}
