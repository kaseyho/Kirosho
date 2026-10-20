import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import * as E from '../../Scripts/Engine/ShadeEngine.ts';
import {SOLAR_FIXTURES as solar} from '../../Data/SolarFixtures.ts';
import {courtyardScenario} from '../../Data/CourtyardScenario.ts';

const near=(actual,expected,tolerance=1e-8)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} != ${expected} (tolerance ${tolerance})`);
const roof={width:2,depth:2,height:3};
const square={eMin:0,eMax:2,nMin:0,nMax:2};
function constantSolar(start=0,end=10,sun=[0,0,1]) {
  const rows=(step,offset)=>Array.from({length:(end-start)/step+(offset===0?1:0)},(_,i)=>[start+offset+i*step,...sun]);
  return {sha256:'analytical-fixture',metadata:{date:'analytical',timezone:'UTC'},inspection:rows(1,0),evaluation5:rows(5,2.5),evaluation1:rows(1,.5)};
}
function smallScenario() {
  return {id:'three-cells',label:'Three analytical cells',profile:'test',site:{eMin:0,eMax:3,nMin:0,nMax:1},blocked:[],roof:{width:1,depth:1,height:2},
    shelterIds:['A','B'],gridStep:1,period:[0,10],baseline:{shelters:[{id:'A',e:.5,n:.5},{id:'B',e:1.5,n:.5}]},
    zones:[{id:'west',label:'West',rect:{eMin:0,eMax:1,nMin:0,nMax:1},activityHeight:1,schedule:[{start:0,end:10,people:1}]},
      {id:'east',label:'East',rect:{eMin:2,eMax:3,nMin:0,nMax:1},activityHeight:1,schedule:[{start:0,end:10,people:1}]}]};
}
function complete(job) {let steps=0;while(job.status==='running'){job.step(256);assert.ok(++steps<10000);}return job.result();}
function searchSession(session) {assert.equal(session.requestSearch(),true);while(session.status==='searching')session.stepSearch(256);return session.suggestion;}

test('solar bytes, provenance, reference angles, timezone, and direction are verified',()=>{
  const bytes=readFileSync(new URL('../../Data/SolarFixtures.json',import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),solar.sha256);
  const exported=E.clone(solar);delete exported.sha256;assert.deepEqual(JSON.parse(bytes),exported);
  assert.equal(solar.metadata.timezone,'Asia/Singapore');
  assert.equal(Date.parse(solar.metadata.startLocal),Date.parse('2026-10-20T04:00:00Z'));
  assert.equal(Date.parse(solar.metadata.endLocal),Date.parse('2026-10-20T09:00:00Z'));
  assert.equal(solar.inspection.length,301);assert.equal(solar.evaluation5.length,60);assert.equal(solar.evaluation1.length,300);
  for(const row of [...solar.inspection,...solar.evaluation1,...solar.referenceSamples])near(Math.hypot(...row.slice(1)),1,1e-10);
  for(const key of ['apparent_zenith','azimuth'])near(solar.nrelReference.actualDegrees[key],solar.nrelReference.expectedDegrees[key],5e-6);
  assert.ok(solar.referenceSamples[0][1]>0,'Morning sun must be east');
  assert.ok(solar.referenceSamples.at(-1)[1]<0,'Afternoon sun must be west');
  near(Math.hypot(...Object.values(E.sunAt(solar,817.25))),1);
});

test('projection has the correct units, direction, height and horizon behavior',()=>{
  assert.deepEqual(E.projectRoof({e:1,n:1},roof,{east:0,north:0,up:1},1),square);
  const h=Math.SQRT1_2;
  assert.deepEqual(E.projectRoof({e:1,n:1},roof,{east:h,north:0,up:h},1),{eMin:-2,eMax:0,nMin:0,nMax:2});
  assert.deepEqual(E.projectRoof({e:1,n:1},roof,{east:-h,north:0,up:h},1),{eMin:2,eMax:4,nMin:0,nMax:2});
  assert.deepEqual(E.projectRoof({e:1,n:1},roof,{east:0,north:h,up:h},2),{eMin:0,eMax:2,nMin:-1,nMax:1});
  assert.equal(E.projectRoof({e:1,n:1},roof,{east:1,north:0,up:0},1),null);
  assert.equal(E.projectRoof({e:1,n:1},roof,{east:1,north:0,up:1e-7},1),null);
  assert.equal(E.projectRoof({e:1,n:1},roof,{east:0,north:0,up:1},4),null);
  assert.equal(E.projectRoof({e:NaN,n:1},roof,{east:0,north:0,up:1},1),null);
});

test('exact coverage clips boundaries and counts overlapping shade once',()=>{
  near(E.unionCoverage(square,[]),0);near(E.unionCoverage(square,[square]),1);
  near(E.unionCoverage(square,[{eMin:1,eMax:3,nMin:0,nMax:2}]),.5);
  near(E.unionCoverage(square,[square,square]),1);
  near(E.unionCoverage(square,[{eMin:0,eMax:1.5,nMin:0,nMax:2},{eMin:.5,eMax:2,nMin:0,nMax:2}]),1);
  near(E.unionCoverage(square,[{eMin:2,eMax:4,nMin:0,nMax:2}]),0);
  near(E.unionCoverage(square,[null,square]),1);
  assert.throws(()=>E.unionCoverage(square,[square,square,square]),/two/);
});

test('person-minutes respect unequal occupancy, partial bins and inactive intervals',()=>{
  const s=smallScenario(),sun=constantSolar();
  s.zones[0].schedule=[{start:0,end:3,people:2},{start:3,end:9,people:5}];
  s.zones[1].schedule=[{start:2,end:7,people:4}];
  // West is fully shaded, east is uncovered: 6+30 shaded out of 36+20 scheduled.
  for(const step of [1,5]) {
    const result=E.evaluateLayout(s,sun,s.baseline,9,step);
    near(result.scheduledPersonMinutes,56);near(result.shadedPersonMinutes,36);near(result.coveragePercent,100*36/56);
    assert.equal(result.zones[0].currentCoveragePercent,null);assert.equal(result.zones[0].currentPeople,0);
    assert.equal(E.peopleAt(s.zones[0],3),5);assert.equal(E.peopleAt(s.zones[0],9),0);
  }
  s.zones.forEach(z=>z.schedule=[]);
  const empty=E.evaluateLayout(s,sun,s.baseline,5);assert.equal(empty.coveragePercent,null);near(empty.scheduledPersonMinutes,0);
});

test('courtyard constraints reject intrusion and accept touching boundaries',()=>{
  const s=courtyardScenario(),layout=E.clone(s.baseline);
  assert.equal(E.validateScenario(s,solar),null);assert.equal(E.validateLayout(s,layout).valid,true);
  layout.shelters[0].e=1.5;layout.shelters[0].n=1.5;assert.equal(E.validateLayout(s,layout).valid,true);
  layout.shelters[0].e=1.49;assert.match(E.validateLayout(s,layout).reason,/inside/);
  layout.shelters[0].e=4;assert.equal(E.validateLayout(s,layout).valid,true,'Corridor edge touch is permitted');
  layout.shelters[0].e=4.01;assert.match(E.validateLayout(s,layout).reason,/corridor/);
  layout.shelters[0]={id:'A',e:10,n:3};assert.equal(E.validateLayout(s,layout).valid,true,'Shelter edge touch is permitted');
  layout.shelters[0].n=3.01;assert.match(E.validateLayout(s,layout).reason,/overlap/);
  assert.equal(new E.LayoutSearch(s,solar,s.baseline,0,720).points.length,132);
  assert.equal(new E.LayoutSearch(s,solar,s.baseline,0,720).pairs.length,5436);
});

test('small grid yields a hand-checkable optimum and stable least-movement ties',()=>{
  const s=smallScenario(),sun=constantSolar();
  const result=complete(new E.LayoutSearch(s,sun,s.baseline,7,5));
  assert.deepEqual(result.layout,{shelters:[{id:'A',e:.5,n:.5},{id:'B',e:2.5,n:.5}]});
  near(result.comparison.coveragePercent,50);near(result.evaluation.coveragePercent,100);near(result.movementMeters,1);
  assert.equal(result.sourceRevision,7);assert.equal(result.evaluatedCount,3);
  assert.equal(result.comparison.inputHash,result.evaluation.inputHash);
  s.zones=[{...s.zones[0],rect:s.site}];s.baseline={shelters:[{id:'A',e:1,n:.5},{id:'B',e:2,n:.5}]};
  const tied=complete(new E.LayoutSearch(s,sun,s.baseline,0,0));
  assert.deepEqual(tied.layout,{shelters:[{id:'A',e:.5,n:.5},{id:'B',e:1.5,n:.5}]});
  assert.deepEqual(complete(new E.LayoutSearch(s,sun,s.baseline,0,0)).layout,tied.layout);
});

test('search cancellation and a valid off-grid scenario with no feasible grid pair',()=>{
  const s=courtyardScenario(),job=new E.LayoutSearch(s,solar,s.baseline,0,720);
  job.step(32);job.cancel();const count=job.preparedCount;job.step(10000);
  assert.equal(job.status,'cancelled');assert.equal(job.preparedCount,count);assert.equal(job.result(),null);
  const narrow=smallScenario();narrow.gridStep=4;narrow.baseline.shelters[1].e=2.5;
  assert.equal(E.validateScenario(narrow,constantSolar()),null);
  const none=complete(new E.LayoutSearch(narrow,constantSolar(),narrow.baseline,0,0));assert.equal(none,null);
  const session=new E.ShadeSession(narrow,constantSolar());session.requestSearch();assert.equal(session.status,'no-feasible');
});

test('accelerated search score equals complete projection-and-union evaluation for every permitted layout',()=>{
  const s=courtyardScenario(),job=new E.LayoutSearch(s,solar,s.baseline,0,900);complete(job);
  // Full oracle uses both roofs and inclusion-exclusion; no precomputed position scores.
  let max=-Infinity;
  for(const [a,b] of job.pairs) {
    const layout={shelters:[{id:'A',...job.points[a]},{id:'B',...job.points[b]}]};
    const exact=E.evaluateLayout(s,solar,layout,900).shadedPersonMinutes;
    near(job.scores[a]+job.scores[b],exact,1e-7);
    max=Math.max(max,exact);
  }
  near(job.bestShadedPersonMinutes,max,1e-7);
  near(job.result().evaluation.shadedPersonMinutes,max,1e-7);
});

test('five-minute integration stays within two percentage points of one-minute showcase results',()=>{
  for(const profile of ['school-day','lunch-event']) {
    const s=courtyardScenario(profile),best=complete(new E.LayoutSearch(s,solar,s.baseline,0,900)).layout;
    for(const layout of [s.baseline,best,{shelters:[{id:'A',e:2,n:2},{id:'B',e:9,n:5}]}]) {
      const coarse=E.evaluateLayout(s,solar,layout,900,5),fine=E.evaluateLayout(s,solar,layout,900,1);
      near(coarse.scheduledPersonMinutes,fine.scheduledPersonMinutes);assert.ok(Math.abs(coarse.coveragePercent-fine.coveragePercent)<2);
    }
  }
});

test('occupancy changes the optimum, including an inactive profile',()=>{
  const main=courtyardScenario(),alternate=courtyardScenario('lunch-event');
  const a=complete(new E.LayoutSearch(main,solar,main.baseline,0,900)),b=complete(new E.LayoutSearch(alternate,solar,alternate.baseline,0,900));
  near(a.evaluation.scheduledPersonMinutes,5040);near(b.evaluation.scheduledPersonMinutes,4800);
  assert.equal(a.layout.shelters.filter(p=>p.e>6).length,1);assert.equal(b.layout.shelters.filter(p=>p.e>6).length,0);
  assert.notEqual(E.layoutFingerprint(a.layout),E.layoutFingerprint(b.layout));
  const inactive=new E.ShadeSession(courtyardScenario('no-activity'),solar);assert.equal(inactive.requestSearch(),false);assert.equal(inactive.status,'no-activity');
});

test('dragging uses an invalid ghost, rollback, grid snap, and one undo transaction',()=>{
  const session=new E.ShadeSession(courtyardScenario(),solar),original=E.clone(session.layout);
  assert.equal(session.beginDrag('A'),true);assert.equal(session.previewDrag({e:6,n:4}).valid,false);
  assert.deepEqual(session.layout,original);assert.equal(session.flushEvaluation(),false);assert.equal(session.endDrag(),false);
  assert.deepEqual(session.layout,original);assert.match(session.message,/Returned/);assert.equal(session.canUndo,false);
  session.beginDrag('A');assert.equal(session.previewDrag({e:2.13,n:3.22}).valid,true);assert.equal(session.endDrag(),true);
  assert.equal(session.status,'updating');assert.deepEqual(session.layout.shelters[0],{id:'A',e:2,n:3});
  session.flushEvaluation();assert.equal(session.evaluation.layoutHash,E.layoutFingerprint(session.layout));
  assert.equal(session.undo(),true);session.flushEvaluation();assert.deepEqual(session.layout,original);assert.equal(session.undo(),false);
});

test('edits invalidate an in-flight search and stale recommendations cannot apply',()=>{
  const session=new E.ShadeSession(courtyardScenario(),solar);
  session.requestSearch();const old=session.search;session.stepSearch(32);const revision=session.revision;
  session.setMinute(900);assert.equal(old.status,'cancelled');assert.equal(session.revision,revision+1);assert.equal(session.search,null);
  assert.equal(session.status,'updating');assert.equal(session.applySuggestion(),false);session.flushEvaluation();
  assert.equal(session.evaluation.inputHash,session.baselineEvaluation.inputHash);
  const suggestion=searchSession(session);assert.ok(suggestion);const before=E.clone(session.layout);
  session.beginDrag('A');session.previewDrag({e:2,n:3});session.endDrag();session.flushEvaluation();
  assert.equal(session.suggestion,null);assert.equal(session.applySuggestion(),false);assert.notDeepEqual(session.layout,suggestion.layout);
  // Simulate a late asynchronous delivery from the previous revision.
  session.suggestion=suggestion;assert.equal(session.applySuggestion(),false);assert.notDeepEqual(session.layout,suggestion.layout);
  session.reset();assert.deepEqual(session.layout,before);
});

test('suggestion preview, apply, undo, cancellation, inspection and commit preserve their contracts',()=>{
  const session=new E.ShadeSession(courtyardScenario(),solar),start=E.clone(session.layout);
  const result=searchSession(session);assert.ok(result);assert.deepEqual(session.layout,start);
  assert.equal(session.applySuggestion(),true);session.flushEvaluation();assert.deepEqual(session.layout,result.layout);
  assert.ok(session.evaluation.coveragePercent>session.baselineEvaluation.coveragePercent);
  const revision=session.revision;session.selectZone('seating');session.setViewMode('fullscale');session.nextObservation();session.setViewMode('overview');assert.equal(session.revision,revision);
  const snapshot=session.commit();assert.equal(snapshot.layoutFingerprint,E.layoutFingerprint(session.layout));assert.equal(snapshot.solarSha256,solar.sha256);
  assert.equal(E.stableStringify(session.commit()),E.stableStringify(snapshot));snapshot.layout.shelters[0].e=-100;assert.notEqual(session.layout.shelters[0].e,-100);
  searchSession(session);assert.equal(session.status,'no-better');assert.equal(session.suggestion,null);
  assert.equal(session.undo(),true);session.flushEvaluation();assert.deepEqual(session.layout,start);
  session.requestSearch();session.cancelSearch();assert.equal(session.status,'cancelled');assert.deepEqual(session.layout,start);
});

test('profile comparisons share inputs, while malformed data can recover with reset',()=>{
  const session=new E.ShadeSession(courtyardScenario(),solar),source=E.clone(session.scenario);
  session.setMinute(905);session.setScenario(courtyardScenario('lunch-event'));session.flushEvaluation();
  assert.equal(session.evaluation.inputHash,session.baselineEvaluation.inputHash);near(session.baselineEvaluation.scheduledPersonMinutes,4800);
  assert.equal(session.minute,905);assert.deepEqual(source,courtyardScenario());
  const malformed=E.clone(source);malformed.zones=[null];assert.ok(E.validateScenario(malformed,solar));
  assert.equal(session.setScenario(malformed),false);assert.equal(session.status,'error');assert.equal(session.commit(),null);
  session.reset();assert.equal(session.status,'ready');assert.equal(session.scenario.profile,'school-day');assert.equal(session.minute,720);
  const sparse=E.clone(solar);sparse.evaluation5.splice(3,1);assert.match(E.validateScenario(source,sparse),/incomplete/);
  const below=constantSolar(0,10,[1,0,0]);assert.match(E.validateScenario(smallScenario(),below),/horizon/);
  assert.equal(E.formatMinute(905),'15:05');assert.equal(E.formatMinute(1020),'17:00');
});
