/** Lens-clock samples describe this development Preview, not physical SPECS. */
export class ShadePerformance {
  private lastFrame=0
  private activeAfter=Infinity
  private lastActiveFrame=0
  private frameIntervals:number[]=[]
  private allFrameIntervals:number[]=[]
  readonly evaluationMs:number[]=[]
  readonly settledInputToPresentationMs:number[]=[]
  readonly searchWallMs:number[]=[]
  readonly searchBatchMs:number[]=[]
  readonly dragSceneUpdateMs:number[]=[]
  beginActiveWindow():void {
    this.activeAfter=getRealTimeNanos()+3e9
    this.lastActiveFrame=0;this.frameIntervals=[]
  }
  frame():void {
    const now=getRealTimeNanos()
    if(this.lastFrame) {
      this.allFrameIntervals.push((now-this.lastFrame)/1e6)
      if(this.allFrameIntervals.length>1200)this.allFrameIntervals.shift()
    }
    if(now>=this.activeAfter) {
      if(this.lastActiveFrame) {
        this.frameIntervals.push((now-this.lastActiveFrame)/1e6)
        if(this.frameIntervals.length>1200)this.frameIntervals.shift()
      }
      this.lastActiveFrame=now
    }
    this.lastFrame=now
  }
  summary():Record<string,unknown> {
    const stats=(values:number[])=>{
      if(!values.length)return {samples:0}
      const sorted=[...values].sort((a,b)=>a-b),mean=values.reduce((a,b)=>a+b,0)/values.length
      return {samples:values.length,meanMs:mean,p50Ms:sorted[Math.floor((sorted.length-1)*.5)],
        p95Ms:sorted[Math.floor((sorted.length-1)*.95)],maxMs:sorted[sorted.length-1]}
    }
    const frames=stats(this.frameIntervals) as {meanMs?:number}
    return {environment:"Lens Studio macOS Preview",frameIntervals:frames,
      allUpdateIntervalsIncludingStartup:stats(this.allFrameIntervals),
      sampling:"Active window starts 3 s after the first world anchor; no later gaps are excluded. Both windows retain the most recent 1200 intervals.",
      meanUpdateFps:frames.meanMs?1000/frames.meanMs:null,evaluationCpu:stats(this.evaluationMs),
      settledInputToPresentation:stats(this.settledInputToPresentationMs),
      searchWall:stats(this.searchWallMs),searchBatchCpu:stats(this.searchBatchMs),
      dragCallbackToSceneUpdate:stats(this.dragSceneUpdateMs),
      limitation:"Input-to-presentation ends after CPU geometry/UI setters, excluding GPU/display latency; no physical SPECS performance claim."}
  }
}
