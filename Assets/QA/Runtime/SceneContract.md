# Kirosho LEAF scene contract

Names below were confirmed from authored component sources before test creation. Runtime observations and pass/fail evidence must be retained after bootstrap; this table does not claim a test pass. The session is read through the actual `KiroshoMain` component, found by component type rather than an invented root name.

| Object name | Component/source | Observable property or action |
|---|---|---|
| `ShadeTimelineSlider` | UIKit Slider, `KiroshoTimelineUI.ts` | Actual drag-start event; changes selected minute and clock |
| `ShadeClock` | Text, TimelineUI | Selected `HH:MM SGT` |
| `ShadePlaneLegend` | Text, TimelineUI | Selected activity height |
| `ShadeZone{lunch,seating,pickup}` | UIKit Button, DetailsUI | Zone selection event, exactly one count increment per trigger |
| `ShadeSelectedSchedule` | Text, DetailsUI | Selected height and occupancy intervals |
| `KiroshoShelter{A,B}` | Authored SIK handles, SceneView inputs | Hand drag, invalid ghost, source layout rollback |
| `ShadeFind` | UIKit Button, PlannerUI | Starts real batched grid search |
| `ShadeCancel` | UIKit Button, PlannerUI | Cancels search and preserves layout |
| `ShadeLater` | UIKit Button, TimelineUI | Advances selected time by 15 minutes; invalidates an in-flight search |
| `ShadeTabreview` | UIKit Button, DetailsUI | Opens comparison page |
| `ShadeTradeoff`, `ShadeTradelunch`, `ShadeTradepickup` | Text, DetailsUI | Loss label and per-zone comparison, including inactive profile |
| `ShadeApply`, `ShadeUndo` | UIKit Buttons | Apply and restore the preceding layout |
| `ShadeFullscale`, `ShadeNextObservation`, `ShadeOverview` | UIKit Buttons, PlannerUI | Same layout at 20 times the overview geometry size; predefined viewpoints and return |
| `ShadeCommit`, `ShadeCommittedPlan` | UIKit Button and Text | Session snapshot and visible layout fingerprint |
| `ShadeReset` | UIKit Button, PlannerUI | Restores the initial valid scenario and layout |
| `ShadeProfileno-activity`, `ShadeProfilelunch-event` | UIKit Buttons, DetailsUI | Recalculate from changed occupancy |
| `ShadeStatus` | Text, PlannerUI | No activity, no feasible grid, and data error states |
| `KiroshoQA` | Authored Editor-only QA harness | Supplies invalid input/no-grid fixtures; never changes evaluations or injects results |

Normal interaction tests do not call `main.act()`, replace the layout, set UI values, or mutate the session. The QA harness is restricted to exceptional input fixtures. Recovery is verified using the real Reset button.

The existing scenario registry `Assets/Scripts/KiroshoSmokeLeafIndex.ts` is extended rather than overwritten. The M0 diagnostic entry remains available as historical smoke coverage; its diagnostic scene is disabled in the finished product. Seven product cases have separate registry IDs. IK uses fail-fast diagnostics, logs direct versus indirect routing, and never treats an indirect hit as proof of direct reach or physical comfort.
