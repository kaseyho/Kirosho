# Kirosho

Place the shelters you already own where they provide useful shade during the hours people actually occupy a space.

Kirosho is a SPECS Lens for facilities and event planners. It uses a spatial courtyard model, activity schedules and a bounded solar model to compare two portable-shelter placements. It was built for [Learn AR with SPECS](https://learn-specs.devpost.com/).

**Submitted on 21 October 2026.** The working Lens, 14 numerical checks, seven product interaction scenarios and narrated demonstration are verified. Devpost confirmed “Project submitted!” Preview performance varies and the 30 fps target is not consistently met. See [verification](docs/verification.md) and [execution status](docs/execution_status.md).

[Watch the 2:26 captioned demo](https://www.youtube.com/watch?v=5xc7pn-5Pfs) · [Devpost submission](https://devpost.com/software/kirosho) · [English subtitles](docs/media/Kirosho.en.srt) · [Model assumptions](devpost/model-assumptions.md)

## Why this problem

A shelter placed over a queue at noon may miss it later in the afternoon. A static roof footprint also says little about who uses each part of a site and when. Kirosho combines moving shade with activity schedules and a fixed shelter inventory. It makes placement tradeoffs visible before a planner accepts a suggestion.

The prototype uses a fictional 12 × 8 m Singapore school courtyard with two 3 × 3 m shelters. Site geometry and occupancy counts are illustrative. Solar positions are calculated for 20 October 2026; there is no live site scan, weather feed or physical-glasses footage.

## Open and run

1. Clone this repository with [Git LFS](https://git-lfs.com/) installed, and run `git lfs pull` in the checkout.
2. Open `Kirosho.esproj` in Lens Studio 5.24.1 (tested build `5.24.1.26100516`). Keep the project at the repository root.
3. Use the SPECS 27 Preview and the bundled **Plane** interactive environment, as used for the finished demonstration. The project includes its required native packages.
4. Run the Preview. Runtime behavior is local and offline after installation.

Lens Studio sign-in was not required for the verified local project build, package installation, compilation, interaction tests or recording. No Lens publication is needed for this competition's documented Preview submission route. Account-gated features outside that route may have separate requirements.

## Try the planning flow

1. Move the timeline knob or use the hour buttons to inspect moving shade. Select Lunch queue, Outdoor seating or Pickup queue to see that zone's schedule and activity height.
2. Pinch and drag a cyan shelter handle. Release snaps it to the 0.5 m grid. Boundary, corridor and overlap violations show a reason and roll back on release.
3. Choose **Find better placement**. Read the **Review** panel before applying: it shows the overall gain and each zone's gain or loss. The suggested layout is not applied until **Apply layout** is selected.
4. Use **Undo** to restore the preceding placement. **Cancel** stops a search; changing an input invalidates its pending result.
5. Choose **Inspect full scale**, cycle the three observation points, and **Return to overview**. The same layout and activity-height model are preserved.
6. **Commit** displays a session plan summary with layout and input fingerprints. It is a reproducible session snapshot, not a cloud save. **Reset** restores the initial school-day scenario.

The **Zones** page includes School, Event and Empty occupancy profiles. The same sun and courtyard produce different placement needs when the schedule changes. **Model** explains the assumptions; **Recall** brings the world-anchored overview back in front of the viewer.

## Calculation model

The same pure TypeScript engine is used by the Lens and numerical tests. It projects north-aligned flat rectangular roofs onto each zone's activity plane, computes exact clipped rectangle coverage, and weights that coverage by scheduled person-minutes. Seating is analyzed at 1.2 m and standing queues at 1.6 m. People are assumed to be uniformly distributed within each zone.

The search checks 5,436 valid two-roof layouts on a 0.5 m grid. It maximizes total modeled shaded person-minutes, then breaks ties by least movement from the starting layout and stable coordinate order. It is the best evaluated grid placement, not a continuous global optimum or a guarantee that every group gains coverage.

For the illustrative school-day schedule, aggregate modeled coverage rises from **32.1% to 62.3%**, a gain of **30.2 percentage points**. The lunch queue loses coverage while seating and pickup gain it. That tradeoff is part of the result and must be reviewed before accepting it. Changing to the lunch-event schedule moves both suggested shelters to the west side; the result is calculated from the schedule.

See [numerical verification](Assets/QA/Engine/NumericalVerification.md) and the [machine-readable results](Assets/QA/Engine/NumericalResults.json). No cooling, temperature, health, energy or carbon savings have been measured or modeled.

## Reproduce numerical checks

Node 22.23.2 was used. No npm installation is required.

```sh
node --experimental-default-type=module --experimental-strip-types --test Assets/QA/Engine/ShadeEngine.test.mjs
node --experimental-default-type=module --experimental-strip-types Assets/Tools/GenerateNumericalReport.mjs
```

To regenerate the solar fixtures, create a Python environment, install the pinned development requirements, and run:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r Assets/Tools/SolarRequirements.txt
.venv/bin/python Assets/Tools/GenerateSolarFixtures.py
```

The fixture records generator inputs, timezone, versions and its SHA-256. The solar generator uses pvlib during development; the Lens does not require Python or pvlib.

## Preview integration checks

The included LEAF registry exposes `kirosho-timeline`, `kirosho-placement`, `kirosho-search`, `kirosho-cancel-stale`, `kirosho-inspect-commit`, `kirosho-recovery` and `kirosho-ik-route`. Run them from Lens Studio's LEAF panel with the Preview running. They use actual SIK/UIKit interaction paths and assert observable state; they do not inject a recommendation to imitate the user flow. The separate `kirosho-m0-smoke` entry is historical coverage for a disabled diagnostic scene.

The saved `LEAF Plugin Bridge` uses `Packages/Leaf 2.lspkg/Scenarios/scenario/MessagingBridge.ts` (Leaf 2.0.2). If a newly opened LEAF panel shows no scenarios after reloading the project, verify this reference: the editor can recreate the bridge from the older installed Leaf package. Refresh the Preview after selecting the active bridge.

The timeline test checks updates while the knob is still held. The placement test covers all three constraint failures. Recovery-only fixtures supply invalid input through an Editor-only harness and recover with the actual Reset control. An intentional incorrect assertion was also verified to fail before relying on the harness. See [scene contract](Assets/QA/Runtime/SceneContract.md) and [current performance observations](docs/performance_observations.md). Desktop tests establish no physical-device or human-usability result.

## Project map

| Path | Purpose |
|---|---|
| `Kirosho.esproj`, `Assets/Scene.scene` | Actual SPECS Lens Studio project |
| `Assets/Scripts/Engine/` | Shared calculation, search and session state |
| `Assets/Data/` | Illustrative scenario and generated solar fixtures |
| `Assets/QA/` | Numerical tests, runtime test sources and verification evidence |
| `Assets/Tools/` | Reproducible generators and native window recorder |
| `devpost/` | Required Devpost Learn planning workflow and submission material |
| `docs/implementation_plan.md` | Approved scope and acceptance criteria |

Generated Cache, Support, private connection files and local capture intermediates are excluded from Git.

## Planning, attribution and limits

The project was planned with Devpost Learn's `plan-lens` skill and is built by Codex through Snap CLAD and the Lens Studio MCP. See [planning workflow](devpost/planning-workflow.md), [source attribution](devpost/source-attribution.md) and [model assumptions](devpost/model-assumptions.md).

Original Kirosho code is licensed under the [MIT License](LICENSE). Snap template assets and native packages retain their original terms and are excluded from that grant. pvlib's BSD license is retained in [Assets/ThirdParty](Assets/ThirdParty/pvlib-LICENSE.txt).

Preview testing establishes desktop behavior only. Physical SPECS, field accuracy, structural suitability and human usability have not been validated.
