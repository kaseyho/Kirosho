# ShadeShift

Place the shelters you already own where they provide useful shade during the hours people actually occupy a space.

ShadeShift is a SPECS Lens for facilities and event planners. It uses a spatial courtyard model, activity schedules and a bounded solar model to compare two portable-shelter placements. It is being built for [Learn AR with SPECS](https://learn-specs.devpost.com/).

**Build status:** the signed-out Lens Studio automation workflow and numerical engine are verified. The complete product interaction, final footage and submission package are in progress. See [execution status](docs/execution_status.md) for evidence and remaining work.

## Why this problem

A shelter placed over a queue at noon may miss it later in the afternoon. A static roof footprint also says little about who uses each part of a site and when. ShadeShift combines moving shade with activity schedules and a fixed shelter inventory. It makes placement tradeoffs visible before a planner accepts a suggestion.

The prototype uses a fictional 12 × 8 m Singapore school courtyard with two 3 × 3 m shelters. Site geometry and occupancy counts are illustrative. Solar positions are calculated for 20 October 2026; there is no live site scan, weather feed or physical-glasses footage.

## Open and run

1. Clone this repository with [Git LFS](https://git-lfs.com/) installed, and run `git lfs pull` in the checkout.
2. Open `ShadeShift.esproj` in Lens Studio 5.24.1 (tested build `5.24.1.26100516`). Keep the project at the repository root.
3. Use the SPECS 27 Preview and the bundled Sunlit Room interactive environment. The project includes its required native packages.
4. Run the Preview. Runtime behavior is local and offline after installation.

Lens Studio sign-in was not required for the verified local project build, package installation, compilation, interaction tests or recording. No Lens publication is needed for this competition's documented Preview submission route. Account-gated features outside that route may have separate requirements.

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

## Project map

| Path | Purpose |
|---|---|
| `ShadeShift.esproj`, `Assets/Scene.scene` | Actual SPECS Lens Studio project |
| `Assets/Scripts/Engine/` | Shared calculation, search and session state |
| `Assets/Data/` | Illustrative scenario and generated solar fixtures |
| `Assets/QA/` | Numerical tests, runtime test sources and verification evidence |
| `Assets/Tools/` | Reproducible generators and native window recorder |
| `devpost/` | Required Devpost Learn planning workflow and submission material |
| `docs/implementation_plan.md` | Approved scope and acceptance criteria |

Generated Cache, Support, private connection files and local capture intermediates are excluded from Git.

## Planning, attribution and limits

The project was planned with Devpost Learn's `plan-lens` skill and is built by Codex through Snap CLAD and the Lens Studio MCP. See [planning workflow](devpost/planning-workflow.md), [source attribution](devpost/source-attribution.md) and [model assumptions](devpost/model-assumptions.md).

Original ShadeShift code is licensed under the [MIT License](LICENSE). Snap template assets and native packages retain their original terms and are excluded from that grant. pvlib's BSD license is retained in [Assets/ThirdParty](Assets/ThirdParty/pvlib-LICENSE.txt).

Preview testing establishes desktop behavior only. Physical SPECS, field accuracy, structural suitability and human usability have not been validated.
