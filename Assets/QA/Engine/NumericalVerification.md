# Numerical verification

Verified locally on 21 October 2026. These are calculation results for an illustrative scenario, not field measurements. Lens interaction and Preview performance evidence are separate.

## Reproduce

Node 22.23.2 ran the exact TypeScript used by the Lens; no port or duplicate scoring implementation is involved.

```sh
node --experimental-default-type=module --experimental-strip-types --test Assets/QA/Engine/ShadeEngine.test.mjs
node --experimental-default-type=module --experimental-strip-types Assets/Tools/GenerateNumericalReport.mjs
```

All 14 tests pass. The suite covers solar provenance and reference angles, projection direction and height, exact rectangle union, occupancy units and partial intervals, placement constraints, a hand-checkable optimum, deterministic ties, cancellation, no feasible grid pair, stale results, rollback, undo, profile changes, snapshots, and invalid-data recovery. It compares the accelerated score with full two-roof projection and inclusion–exclusion for **all 5,436 permitted layouts**.

Results are retained in [NumericalResults.json](NumericalResults.json). `GenerateNumericalReport.mjs` regenerates this deterministic report; separate ignored Node timings are not represented as Lens Preview or SPECS measurements.

## Solar fixtures

The generator uses pvlib 0.16.1's NREL SPA implementation, aware timestamps in Asia/Singapore, latitude 1.3521° N and longitude 103.8198° E on 20 October 2026. It stores normalized east/north/up vectors from geometric elevation. The planning window 12:00–17:00 SGT is 04:00–09:00 UTC.

There are 301 one-minute inspection samples, 60 five-minute midpoint scoring samples, and 300 one-minute midpoint check samples. Generation inputs and versions are embedded in the fixtures. Running the generator twice produced the same JSON SHA-256:

```text
405dccbbcd144cf4a4a572c1efd3566e7e907d7338da2ab133d2f5b6b8249e7b
```

This hashes the raw canonical `SolarFixtures.json` bytes. The TypeScript export embeds that hash and the same payload; the test recomputes it independently.

The SPA reference case uses 17 October 2003, 12:30:30 MST, latitude 39.742476°, longitude −105.1786°, altitude 1,830.14 m, pressure 82,000 Pa, temperature 11°C and ΔT 67 s. Expected apparent zenith is 50.111622°; expected azimuth is 194.340241°. Generated values are 50.111622024037° and 194.340240510240°, within 0.000005°. The reference inputs and expected values were verified against [pvlib's official reference fixtures](https://github.com/pvlib/pvlib-python/blob/main/tests/conftest.py) and [solar-position tests](https://github.com/pvlib/pvlib-python/blob/main/tests/test_solarposition.py). See also [pvlib SPA documentation](https://pvlib-python.readthedocs.io/en/stable/reference/generated/pvlib.solarposition.spa_python.html).

## School-day result and visible tradeoff

There are 132 feasible centers and 5,436 valid unordered pairs on the 0.5 m grid. The tie-break uses least total shelter movement from the starting layout, then stable east/north order. It is the best evaluated grid layout, not a continuous global optimum.

Coordinates are meters east/north from the southwest courtyard corner. The starting shelters are A (3, 6), B (10, 6). The recommended shelters are A (2, 1.5), B (8, 5.5).

| Zone | Scheduled person-minutes | Starting coverage | Suggested coverage | Change |
|---|---:|---:|---:|---:|
| Lunch queue | 1,200 | 76.1% | 0.0% | −76.1 percentage points |
| Outdoor seating | 1,680 | 0.0% | 79.9% | +79.9 percentage points |
| Pickup queue | 2,160 | 32.5% | 83.2% | +50.7 percentage points |
| All activities | 5,040 | 32.1% | 62.3% | +30.2 percentage points |

Modeled shaded person-minutes rise from 1,616.34 to 3,139.66. The lunch loss must be shown before applying the suggestion. The objective maximizes total shaded person-minutes; it does not guarantee a minimum coverage for every group. A planner can decline the suggestion, change the activity profile, or undo the placement.

## Occupancy sensitivity

The lunch-event profile uses the same site, roofs and sun. It schedules 24 people at the lunch zone and 16 at seating from 12:00–14:00, with no pickup activity. Its recommended placement puts both roofs on the west side: A (2.5, 5.5), B (2.5, 1.5). Whole-period coverage rises from 44.8% to 87.0%. The change in recommendation is calculated from the changed schedule; it is not a hard-coded profile-specific layout.

The inactive profile has zero scheduled person-minutes. Percentages are null and the session reports “No scheduled activity.” It does not report a misleading zero or 100% score.

## Temporal check and modeling limits

Five-minute versus one-minute midpoint integration differs by 0.00169 percentage points for the school-day starting layout and 0.00395 for its suggested layout. The lunch-event differences are below 0.00012 percentage points. Additional representative layouts pass the plan's two-percentage-point threshold.

Occupancy is integrated exactly across each time bin, including schedule boundaries partway through a bin. Sun direction is approximated at each bin midpoint. Uniform distribution within each rectangular activity zone is an explicit assumption.

The model covers direct sunlight blocked by two flat, north-aligned, equal-height rectangular roofs on a flat site. It excludes clouds, diffuse radiation, buildings, trees, roof tilt, wind loading, structural suitability, temperature, comfort, health risk, energy demand, and carbon. The model is suitable for explaining placement and tradeoffs within this bounded scenario; those exclusions require validation before real-world planning decisions.

Snapshot fingerprints use canonical JSON with FNV-1a 32-bit for reproducibility identifiers, explicitly labeled non-cryptographic. Only the solar payload uses SHA-256. They are not security or authenticity guarantees.
