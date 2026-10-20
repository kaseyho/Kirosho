import type { SiteScenario } from "../Scripts/Engine/ShadeEngine";

/** Fictional geometry and illustrative activity counts; no field survey is implied. */
export function courtyardScenario(profile: "school-day"|"lunch-event"|"no-activity"="school-day"): SiteScenario {
  const scenario: SiteScenario={
    id:"singapore-courtyard-v1",label:"Singapore school courtyard",profile:profile,
    site:{eMin:0,eMax:12,nMin:0,nMax:8},
    blocked:[{label:"Access corridor",rect:{eMin:5.5,eMax:6.5,nMin:0,nMax:8}}],
    roof:{width:3,depth:3,height:2.8},shelterIds:["A","B"],gridStep:0.5,period:[720,1020],
    baseline:{shelters:[{id:"A",e:3,n:6},{id:"B",e:10,n:6}]},
    zones:[
      {id:"lunch",label:"Lunch queue",rect:{eMin:1,eMax:4,nMin:4.5,nMax:7.5},activityHeight:1.6,
        schedule:[{start:720,end:810,people:12},{start:810,end:840,people:4}]},
      {id:"seating",label:"Outdoor seating",rect:{eMin:1,eMax:4,nMin:0.5,nMax:3.5},activityHeight:1.2,
        schedule:[{start:720,end:840,people:8},{start:840,end:960,people:6}]},
      {id:"pickup",label:"Pickup queue",rect:{eMin:8,eMax:11,nMin:4.5,nMax:7.5},activityHeight:1.6,
        schedule:[{start:900,end:1020,people:18}]}
    ]
  };
  if(profile==="lunch-event") {
    scenario.zones[0].schedule=[{start:720,end:840,people:24}];
    scenario.zones[1].schedule=[{start:720,end:840,people:16}];
    scenario.zones[2].schedule=[];
  } else if(profile==="no-activity")scenario.zones.forEach(z=>z.schedule=[]);
  return scenario;
}
