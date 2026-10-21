# Preview performance observations

Measured on 21 October 2026 (Singapore time), including later unlocked-desktop capture runs. The functional prototype and selected footage are verified; consistent 30 fps Preview performance remains an open limitation.

## Environment and measurement boundaries

- Lens Studio 5.24.1.26100516, SPECS 27 Preview, supplied **Plane** interactive environment for the full product and recorded demonstration. The earlier M0 template baseline used Sunlit Room.
- macOS 26.6.1, 48 GB memory, expanded Preview panel. No physical SPECS measurement.
- Actual wall-clock update intervals come from `getRealTimeNanos()` in the Lens and from successive `ProcessFrame` starts in the Preview trace. Encoded video frame rate is not used as a performance measurement.
- The native computer-control tool reported that the Mac was locked immediately after the two traces below. Its lock state during each earlier measurement was not independently recorded. The user later unlocked it; native app access and the expanded Preview window were visually verified. Lower cadence also occurred afterward, so the lock alone does not explain the measurements.
- No unrelated applications were terminated and no authentication, privacy or security settings were changed.

## Current acceptance status

| Target | Observation | Status |
|---|---|---|
| At least 30 Preview frames/s | Approximately 11.4 idle and 12.2 during the search capture, from actual frame-start intervals | Not met in these captures |
| Search within 2 seconds on this Mac | Traced Find: 1,972.592 ms; faster later runs: 0.60–0.64 s; actual recorded plan: 1,708.318 ms; earlier warm runs: 2.05–2.67 s | Met in selected captures, inconsistent across runs |
| Visible drag feedback within 100 ms | Passing corrected capture: CPU callback-to-scene-update maximum 39.290 ms over 86 samples; this excludes input sampling, GPU and display delay | CPU observation passes; full visible latency not established |
| Settled aggregate results within 200 ms | Passing captures: CPU input-to-settled-UI maxima 31.328 ms for timeline and 39.542 ms for placement | CPU observation passes; GPU/display delay excluded |

The frame-rate target is not represented as achieved. The exact, offline numerical result is independent of rendering speed; responsiveness still matters to the interaction and recording.

## Supported trace capture

Both traces used CLAD's `specs-capture-perf-trace` scheduled Editor API procedure, one open Preview, 20,000 ms requested duration. There was no scene edit, compilation, reset or save during either capture.

| Capture | Recorded duration | Bytes | Actual interaction |
|---|---:|---:|---|
| `shadeshift_representative_2026-10-20T18-16-55-388Z_preview0.pftrace` | 20,197 ms | 5,589,090 | Idle baseline only; the name does not establish a representative workflow |
| `shadeshift_active_search_2026-10-20T18-21-45-665Z_preview0.pftrace` | 19,919 ms | 5,455,934 | Coordinate-targeted SIK Pinch on Find; real 5,436-layout search and tradeoff review |

The second capture started at 18:21:45.665 UTC. Find was observed at 18:21:47.728 and the suggestion at 18:21:49.655. The Lens's search instrumentation reported 1,972.592 ms. Its screenshot showed baseline/current 32.1%, suggested 62.3%, and the lunch loss from 76.1% to 0.0%. Results were observed through runtime inspection and logs, without injecting a layout or recommendation.

Trace SHA-256 values:

```text
idle:   0c23314e0af3104082434d9867ba371e460d8970daa730435ed736e216f940e4
search: f00dc99e1bdaad5f1d873ceb741e27ed8ba2c39a7a81fd92459a3b322ae4f9af
```

Raw traces and local screenshots are retained under ignored `.local/` directories. The canonical CLAD Phase 1 analyzer was followed by bounded hierarchical SQL through its trace server. Analysis dependencies were perfetto 0.58.2 and protobuf 7.36.2; the downloaded trace processor identified its artifact as v57.2/mac-arm64.

## What the trace establishes

All measured slices are on track 0. Durations below are inclusive; parent and child durations must not be added together.

| Metric | Idle baseline | Active search capture |
|---|---:|---:|
| ProcessFrame start-to-start mean | 87.374 ms | 81.870 ms |
| ProcessFrame start-to-start maximum | 232.705 ms | 331.621 ms |
| ProcessFrame mean duration | 16.345 ms | 15.468 ms |
| CoreManagerRender mean duration | 17.16 ms | 19.47 ms |
| RenderFrame mean duration, inside render | 9.775 ms | 9.807 ms |
| Scene::Update mean duration, inside render | 1.753 ms | 4.420 ms |
| Scene::LateUpdate mean duration, inside render | 1.446 ms | 1.190 ms |

Confirmed: substantial elapsed time occurs outside the instrumented ProcessFrame and CoreManagerRender spans. Their mean durations therefore do not explain the complete frame interval. The trace contains no scheduler events, so it cannot distinguish sleep, OS scheduling, editor work or other uninstrumented work in those gaps.

Confirmed: Scene::Update grows during the capture containing the search. Its maximum was 96.950 ms. A RenderFrame outlier lasted 171.621 ms while its instrumented Camera child was only 3.381 ms. These inclusive outliers do not establish that the mathematical engine or draw calls are the sole cause.

Possible contributor: desktop visibility/lock state or the expanded Preview configuration. This needs a controlled comparison after the Mac is unlocked. Memory pressure was also observed, but a five-second VM sample showed no swap-ins, swap-outs or page-outs; memory pressure alone is not an established explanation.

The analyzer automatically classified this as a low-confidence mobile trace and flagged its heuristic FPS as unreliable. The known capture is a mid-session Lens Studio Preview; automatic device, activation-time and heuristic FPS conclusions are not used. No generic `component_N` labels appeared among the reported top slices, so no scene-name substitution was needed.

## Later capture results and final boundary

The passing recorded afternoon sweep measured 13.145 mean updates/s; the complete recommendation→Apply→full-scale→Commit flow measured 15.986; the passing placement take measured 12.072. All use the documented active-window method, retaining later gaps. Native recording ran concurrently. These are application update cadence, not measured display throughput.

The placement automation originally failed because its fixed per-frame input cap did not reach the far overlap target at low cadence. Normalizing the **test hand's movement** by wall time resolved that input failure with all original assertions retained. It is not a product performance fix and is not counted as an increase in Lens frame rate. [Verification](verification.md) preserves the failure and passing rerun.

The saved, demonstrated application checkpoint is **abaef65**. All selected exports are 1920×1080 and encoded at 30 fps for editing; no motion interpolation or interaction speed-up is used. The target of consistently reaching 30 Preview fps remains unmet under these capture conditions. No physical-device performance claim follows from these results.
