# ShadeShift model assumptions

The approved implementation plan defines a fictional Singapore school courtyard,
12 × 8 m, with two identical, north-aligned 3 × 3 m roofs at 2.8 m height. Exact
zone coordinates, corridor coordinates, occupancy counts, and baseline centers
will be explicit illustrative fixture defaults, rather than observations of a school.

Solar samples use latitude 1.3521°, longitude 103.8198°, 20 October 2026,
12:00–17:00 Asia/Singapore. The generator must record all additional SPA inputs,
its dependency version, timestamp convention, and content hashes. The runtime
must consume the frozen local samples without a network dependency.

Geometry is analytical: a flat site, flat rectangular roofs, parallel sunlight,
and rectangular activity zones. A roof projects onto the selected activity plane
using `-(roofHeight - activityHeight) * (sunEast/sunUp, sunNorth/sunUp)`.
Seated activity is evaluated at 1.2 m and standing activity at 1.6 m.
Near-horizon and below-plane cases need explicit handling and tests.

Coverage uses exact rectangle intersections and a union of two projected roofs.
Overlapping shade is counted once. Within a zone, people are assumed uniformly
distributed. Person-minutes weight shaded area fractions by occupancy and time;
they do not describe tracked individuals. Zero scheduled occupancy has no
meaningful coverage percentage and must display a no-activity state.

The recommended result is the best evaluated feasible placement on the 0.5 m
grid. Tie-breaking uses least movement from the starting layout, then stable
coordinates. A suggestion must reveal per-zone losses as well as total gains.
Both compared layouts must use the same scenario, solar, and schedule inputs.

The model excludes weather, thermal comfort, roof transmissivity, tree/building
shade, structural feasibility, wind, and construction design. It supports a
placement conversation; it does not establish measured cooling, health, energy,
carbon, or field-deployment outcomes. Preview performance is laptop evidence.
Real-glasses comfort and hand tracking remain unverified.
