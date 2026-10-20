# ShadeShift acceptance criteria

These expand the five preview criteria in [design-brief.md](design-brief.md).
They are requirements, not claims that the current template implements them.

| ID | Required behavior | Evidence to retain |
|---|---|---|
| D1 | Noon-to-afternoon timeline visibly changes sun direction, projected shade, and time labels | LEAF interaction assertions and actual preview frames |
| D1a | Selecting each zone shows its occupancy, current coverage, period coverage, and activity-plane height | Preview assertions for all three zones |
| D2 | Valid shelter dragging changes the layout and recalculates coverage | SIK drag, runtime position and result assertions |
| D2a | Boundary, corridor, and shelter-overlap violations show a reason, invalid ghost, and rollback on release | Separate invalid-drag cases; compare with last valid layout |
| D3 | Search evaluates permitted grid layouts with real progress and cancellation | Candidate counts, valid result, cancellation assertions |
| D3a | Suggestions expose total and per-zone gains/losses before application | Baseline/current/suggestion inputs and visible tradeoff text |
| D3b | Apply is one undoable transaction; Undo restores the preceding layout and results | Apply/Undo assertions through actual controls |
| D3c | Editing during calculation/search prevents stale output being applied | Revision-race unit tests and preview scenario |
| D3d | No-better and no-feasible cases are understandable and preserve the current layout | Deterministic fixtures and visible state assertions |
| D4 | Full-scale viewpoints and Return/Recall preserve layout and calculations | Runtime state comparisons and preview captures |
| D5 | Commit creates a reproducible plan summary with scenario, layout, results, model version, and hashes | Snapshot test and visible summary |
| D5a | Reset restores the scenario; zero occupancy shows no activity; invalid data is recoverable | Engine and preview recovery tests |
| N1 | Solar fixtures have explicit timezone handling and match the published SPA reference | Generator command, inputs, version, hashes, reference test |
| N2 | Geometry, inclusion-exclusion, occupancy weighting, constraints, and search ties are correct | Hand-checkable engine fixtures |
| N3 | Five-minute scoring differs from one-minute scoring by at most 2 percentage points, or switches to one-minute scoring | Reproducible comparison report |
| N4 | Changing the occupancy profile can change the selected layout | Same geometry/solar input, different profile, recorded optima |
| T1 | Test machinery catches a deliberately incorrect assertion | Retained failed LEAF result, followed by restored passing tests |
| V1 | Controls and labels fit the simulated SPECS view and remain readable | Perspective preview frames at actual working distance |
| V2 | Color is supported by labels/patterns; shade uses additive-compatible overlays | Visual inspection of baseline, suggestion, invalid, and full-scale states |
| P1 | Preview targets 30 fps; drag feedback 100 ms; settled score 200 ms; search 2 s | Measurements with environment and method; report any miss |
| S1 | Demo shows the full product sequence using genuine preview footage | Captured clips, shot list, final edited video |
| S2 | English public video is under three minutes; repository contains the project and planning artifacts | Final media probe and public-link verification |

No numerical result, test pass, performance target, or user-research outcome is
established by this checklist. The final verification report must link actual evidence.
