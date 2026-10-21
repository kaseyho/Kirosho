# Source and asset attribution

This is a working inventory. Update it as assets and dependencies are added.

| Item | Source and use | Current evidence |
|---|---|---|
| Original product scope | User-provided `implememtation_plan.md`, preserved and copied to `docs/implementation_plan.md` | Approved instruction to execute the plan |
| Planning workflow | [Devpost Learn plan-lens](https://github.com/challengepost/learn-specs/tree/main/skills/plan-lens) | Installed skill read and followed; template Build notes/After the build sections preserved verbatim |
| Build workflow | [Snap CLAD](https://github.com/lens-studio-devs/ls-extensions) | Installed revision `8adedd5d5b93f9dbe55f31c6be4264a4f8a608b3`; Apache-2.0 notices retained in the installed toolkit |
| Starter project | Official SPECS Base Template, Lens Studio 5.24.1.26100516 | Generated `Kirosho.esproj`, scene, render assets, and package files |
| Interaction package | Snap Spectacles Interaction Kit 2.0.0 | Installed native package; preserve original package and notices |
| UI package | Snap Spectacles UI Kit 2.0.0 | Installed native package; preserve original package and notices |
| Preview environment | Sunlit Room bundled with Lens Studio | Simulated editor environment, not an authored site or footage through glasses |
| Courtyard and occupancy data | Original illustrative scenario in `Assets/Data/CourtyardScenario.ts` | Fictional Singapore courtyard; no field survey or stakeholder study claimed |
| Calculation and state code | Original Kirosho TypeScript in `Assets/Scripts/Engine/ShadeEngine.ts` | Exact same source runs in Node numerical tests and the Lens; no third-party runtime library |
| Solar fixtures | [pvlib 0.16.1](https://pvlib-python.readthedocs.io/en/stable/reference/generated/pvlib.solarposition.spa_python.html), NREL SPA | Offline generator, pinned development dependencies, reference case, explicit timezone, and SHA-256 retained in `Assets/Data/`; pvlib is BSD-3-Clause |
| Numerical reference | [Official pvlib reference fixture](https://github.com/pvlib/pvlib-python/blob/main/tests/conftest.py) and [solar-position tests](https://github.com/pvlib/pvlib-python/blob/main/tests/test_solarposition.py) | SPA expected apparent zenith 50.111622° and azimuth 194.340241° verified within 0.000005° |
| Native recording utility | Original ScreenCaptureKit Swift helper, built with Apple's supplied SDK | Genuine Lens window recording; no synthetic replacement of product pixels |

The Snap template, packages, and bundled assets retain their original terms.
Any project license must distinguish original Kirosho code from third-party
content. No generated mesh, external music, or stock footage has been added yet.
