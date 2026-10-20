// Run with Node >=22: node --experimental-default-type=module --experimental-strip-types Assets/Tools/GenerateNumericalReport.mjs
import {mkdirSync,writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {SOLAR_FIXTURES as solar} from '../Data/SolarFixtures.ts';
import {courtyardScenario} from '../Data/CourtyardScenario.ts';
import {MODEL_VERSION,LayoutSearch,evaluateLayout,fingerprint} from '../Scripts/Engine/ShadeEngine.ts';

const profiles=[];
const performanceSamples=[];
for(const profile of ['school-day','lunch-event']) {
  const scenario=courtyardScenario(profile),started=performance.now();
  const job=new LayoutSearch(scenario,solar,scenario.baseline,0,900);
  let batches=0;
  while(job.status==='running'){job.step(256);batches++;}
  const result=job.result(),elapsedMs=performance.now()-started;
  const fineBaseline=evaluateLayout(scenario,solar,scenario.baseline,900,1);
  const fineSuggested=evaluateLayout(scenario,solar,result.layout,900,1);
  const sample={profile,scenarioFingerprint:fingerprint(scenario),baseline:result.comparison,
    suggestedLayout:result.layout,suggested:result.evaluation,
    gainPercentagePoints:result.evaluation.coveragePercent-result.comparison.coveragePercent,
    movementMeters:result.movementMeters,candidateCenters:job.points.length,validGridLayouts:job.pairs.length,
    convergence:{baselineOneMinutePercent:fineBaseline.coveragePercent,suggestedOneMinutePercent:fineSuggested.coveragePercent,
      baselineDifferencePercentagePoints:Math.abs(fineBaseline.coveragePercent-result.comparison.coveragePercent),
      suggestedDifferencePercentagePoints:Math.abs(fineSuggested.coveragePercent-result.evaluation.coveragePercent)}};
  profiles.push(sample);performanceSamples.push({profile,batches,elapsedMs});
}
const report={schema:'shadeshift-numerical-report-v1',modelVersion:MODEL_VERSION,solarSha256:solar.sha256,
  units:{positions:'meters east/north from southwest site corner',time:'minutes since SGT midnight',scores:'modeled shaded person-minutes',changes:'percentage points'},
  assumptions:'Fictional site and occupancy; uniformly distributed people; clear-sky direct sun geometry; flat identical rectangular roofs; no thermal, weather, energy or carbon model.',
  profiles};
writeFileSync(new URL('../QA/Engine/NumericalResults.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
mkdirSync(new URL('../../.local/evidence/',import.meta.url),{recursive:true});
// Pure Node timings are explicitly separate from Lens Preview measurements.
writeFileSync(new URL('../../.local/evidence/engine-node-timings.json',import.meta.url),JSON.stringify({environment:process.version,runtime:'Node, not Lens Preview or physical SPECS',samples:performanceSamples},null,2)+'\n');
console.log(JSON.stringify(profiles.map(p=>({profile:p.profile,baseline:p.baseline.coveragePercent,suggested:p.suggested.coveragePercent,
  gain:p.gainPercentagePoints,layout:p.suggestedLayout,convergence:p.convergence})),null,2));
