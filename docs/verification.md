# ShadeShift verification

Verified on 21 October 2026, Singapore time. Tested application checkpoint: **`abaef65`**. The earlier full-product checkpoint is `d7ba153`; the later checkpoint strengthens capture tests and the native recorder without changing product calculations or UI behavior.

The exact root project was saved through the supported Lens Studio Editor API at **09:51:29.874 SGT**. Its scene SHA-256 is `dee50f9f97758888ee4e170785b2e12062edc71fc8e6cd48a6fdd7f188089875`. Application sources were compiled and the refreshed Preview was visually checked after each TypeScript change.

## Environment

Lens Studio **5.24.1.26100516**, macOS **26.6.1**, SPECS **27**, **Interactive / Plane** Preview. Local build, package installation, compilation, interaction tests and native recording succeeded while signed out. No physical SPECS or field testing is claimed.

Package metadata: SpectaclesInteractionKit 2.0.0, SpectaclesUIKit 2.0.0, active Leaf 2.0.2, AI Preview Agent Inspect 2.0.2 and Interact 2.0.1. SIK's internal startup log identifies 0.18.0; that differs from its installed package version. Both preview helper scripts are enabled on the same saved SceneObject. [Machine-readable results](verification-results.json) retain the package inventory and run history.

## Numerical verification

All **14** tests passed on the actual shared TypeScript engine. Its bytes remain unchanged since that run. Tests include a published SPA reference, timezone conversion, projection, activity heights, exact rectangle union, occupancy integration, constraints, deterministic ranking, cancellation, rollback, undo, input fingerprints and stale-result guards.

Every one of the **5,436** permitted pair scores is checked against full two-roof evaluation. The showcase's five-minute and one-minute integration results differ by less than **0.004 percentage points**. See [numerical verification](../Assets/QA/Engine/NumericalVerification.md).

The illustrative school-day result is **32.0703% → 62.2948%**, a **30.2246 percentage-point** aggregate gain. Lunch coverage falls from **76.1414% to 0%**; seating and pickup gain coverage. No minimum-per-zone fairness constraint is implemented. The loss is explicit in Review before Apply and remains visible afterward.

## Actual integration checks

| LEAF scenario | Verified behavior |
|---|---|
| `shadeshift-timeline` | Held Slider updates before release; every hour preset from 12:00 through 17:00 sets the real clock; all three zone controls select the correct activity height; placement is preserved |
| `shadeshift-placement` | A real SIK drag changes placement and coverage; corridor, boundary and overlap attempts show invalid ghosts and roll back |
| `shadeshift-search` | Actual exhaustive search, same-input comparison, explicit lunch loss, no mutation before Apply, one Apply event, no-better state and Undo |
| `shadeshift-cancel-stale` | Cancel preserves placement; an edit cancels an older job; stale Apply cannot replace the current layout |
| `shadeshift-inspect-commit` | Find and Apply the 62.3% plan, inspect all three full-scale observations at exactly 20× overview span, return with the same layout/results, Commit its fingerprint, Reset |
| `shadeshift-recovery` | Empty occupancy, different lunch-event recommendation, no feasible grid and corrupt input, followed by recovery through the actual Reset control |
| `shadeshift-ik-route` | Fail-fast IK interaction succeeds once through the explicitly logged indirect/far-field route |

All seven have passing runs. The expanded timeline and combined plan/inspection checks were rerun successfully for capture. Normal interaction tests use real controls and observe the session; they do not write layout, score or suggestion state. Only exceptional-input fixtures use the Editor-only QA harness.

Before relying on the harness, the M0 smoke case was deliberately run with an incorrect expected increment: it failed, then passed with the correct expectation. [M0 evidence](../Assets/QA/M0Verification.md) records this negative control.

### A capture failure was retained and fixed

The first slow-frame-rate placement take failed at 09:45:30.804:

```text
FAILED: shadeshift-placement - AssertionError: Expected: "true" - Received: "false"
```

The screenshot showed the last drag's corridor reason, rather than the intended overlap reason. A fixed per-update distance cap in the simulated hand made the long drag too slow at low Preview cadence. That take did not establish the overlap check and is excluded from the demonstration.

The **test hand** now normalizes its bounded input movement by elapsed wall time. Product placement logic and the original assertions are unchanged. A new passing take logs every target and observed reason, including both corridor transit and the final overlap. Its closest overlap endpoint was 0.0976 Preview cm from the programmed target. This is automation diagnostics, not physical-device accuracy.

The native MCP Pinch route also timed out on a freshly queried hour button. That action remains unverified. The demonstration uses the passing LEAF path; tool acknowledgements alone are never counted as product actions.

## Performance and remaining limits

Performance varies on this Mac. Fast recorded checks reached approximately 30 updates/s and 0.60–0.64 s search. Other runs, including unlocked-desktop captures, were around 13 updates/s with 1.6–1.9 s search; earlier slower searches exceeded two seconds. **The 30 fps target is not consistently met.** See [full performance observations](performance_observations.md).

CPU timing ends after scene/UI setters and excludes GPU/display latency. The final timing check rejects intermediate evaluations whose revision has already changed. Prior fast drag-to-scene timing was below 4 ms; full visible input latency and physical SPECS performance are not established.

Depth-format fallback and material-batching warnings remain. No final product script exception was observed. Desktop traces do not establish the cause of all frame gaps, and the profiler's low-confidence mobile classification and heuristic FPS are not used.

## Recorded result

The [74.1-second silent Preview sequence](media/preview-sequence.mp4) and four component clips show actual Lens Studio window frames captured with native ScreenCaptureKit. Sampled exported frames were visually checked. All exports are **1920 × 1080**, H.264, encoded at **30 fps**. Encoding does not establish Lens frame rate. Loading time, editor chrome and test overlays are excluded; no interaction is sped up and no results are inserted into the runtime.

The recommendation, full-scale views and committed summary in the final plan take all use the same **62.3%** layout. The separate placement demonstration intentionally uses a manually changed layout. [Capture manifest](media/capture-manifest.json) identifies exports; raw takes and traces remain in ignored local evidence directories.

The final narrated competition presentation, synchronized captions, YouTube URL and submission remain pending the presenter's talking-head recording. The silent sequence is review material, not the final submission video.

The site, occupancy and shelter inventory are illustrative. The bounded model excludes buildings, trees, clouds, thermal comfort, structural suitability, energy and carbon. No human usability study or field validation is claimed.
