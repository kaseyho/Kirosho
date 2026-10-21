# Kirosho

Prepared project description. The working Lens, numerical checks, seven product scenarios and actual Preview footage are verified. The final narrated presentation, public YouTube URL and account-holder declarations remain pending. No Devpost submission or YouTube upload has been made.

## Tagline

Put the shelters you already own where people need the shade, when they need it.

## Inspiration

A shelter can look perfectly positioned at noon and miss the queue later. Facilities teams and event organizers have limited shade equipment, while different groups use different areas throughout the day. A roof footprint cannot explain that changing demand.

Kirosho explores a practical climate-adaptation decision: where should two existing portable shelters go for this site's actual activity schedule?

## What it does

Kirosho presents a courtyard as an AR planning model. A planner inspects moving afternoon shade, selects activity zones and moves shelters within boundary, access and overlap constraints. The model combines shade coverage with scheduled occupancy, reporting modeled shaded person-minutes and whole-period coverage.

A placement search evaluates every permitted pair on a 0.5 m grid. It previews its suggestion and each zone's gains or losses before the planner applies it. Undo, reset and a full-scale inspection view support review. A committed session summary records the layout, input fingerprints and calculated results.

The fictional Singapore school-day scenario improves from 32.1% to 62.3% modeled coverage, a gain of 30.2 percentage points. This is a weighted aggregate: the lunch queue loses shade while seating and pickup gain it. The planner must see that tradeoff. Changing to a lunch-event schedule produces a different placement using the same courtyard and sun.

## How it is built

We used the Devpost Learn `plan-lens` workflow to define the audience, interaction sequence, assumptions and acceptance criteria. Codex builds the actual SPECS Lens in Lens Studio through Snap's CLAD plugin and Lens Studio MCP.

The runtime is TypeScript with Spectacles Interaction Kit and Spectacles UI Kit. A single pure calculation engine runs both in the Lens and in Node tests. Offline pvlib/NREL SPA fixtures supply explicit Singapore-time sun vectors; no generative model or network service determines geometry or placement.

Coverage uses exact roof projection and clipped rectangle union at seated and standing activity heights. Search is batched across frames, supports cancellation and rejects results from earlier input revisions. The objective is the best evaluated grid layout, with deterministic tie-breaking, rather than an unsupported claim of a global optimum.

## Verification and what we learned

Fourteen numerical tests verify solar reference values, geometry, occupancy units, constraints, search and state consistency. Every one of the 5,436 valid grid-pair scores is checked against full two-roof evaluation. The showcased five-minute results differ from one-minute checks by less than 0.004 percentage points.

Seven product LEAF scenarios verify the held timeline, every hour preset, valid and invalid placement, search/apply/undo, cancellation, stale results, full-scale inspection, commit/reset, exceptional-input recovery and an explicit indirect IK route. The final plan take preserves the same 62.3% layout through Apply, all full-scale observations and Commit. The local build and native Preview recording work while Lens Studio is signed out. [Verification and run history](../docs/verification.md) retain the failures as well as passing reruns.

Desktop Preview cadence varies: fast checks reached approximately 30 updates/s, while selected capture runs measured 12–16 updates/s. Search took about 1.6–1.9 seconds in those takes. The 30 fps target is not consistently met, and the video's 30 fps encoding is not a physical-device performance result.

The design lesson is that a higher total is not a complete planning answer. A spatial recommendation should expose the affected activities and the assumptions behind its score so that a human can accept or reject it.

## Limits and next steps

This is a simulated fictional site with illustrative occupancy, not a scanned or deployed courtyard. The model assumes uniformly distributed occupants and two flat, north-aligned rectangular roofs. It does not simulate clouds, buildings, trees, thermal comfort, structural safety, energy demand or carbon. No physical SPECS or field validation is claimed.

Future work would add planner-specified minimum coverage by zone, surveyed geometry and comparison with measured shade. Those are future directions, not implemented features.

## Built with

SPECS 27, Lens Studio 5.24.1, Snap CLAD, Lens Studio MCP, Codex, TypeScript, Spectacles Interaction Kit, Spectacles UI Kit, LEAF, Node.js, pvlib, Python, ScreenCaptureKit, FFmpeg.

## Submission fields still to complete

Public repository: [Kirosho](https://github.com/kaseyho/Kirosho), using the tested `codex/kirosho` branch.

Public YouTube demonstration URL: pending final footage and talking-head recording.

Final account-holder declarations: complete in Devpost at submission time; none are invented here.
