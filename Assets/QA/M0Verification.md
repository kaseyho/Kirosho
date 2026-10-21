# Milestone 0: signed-out local workflow proof

Observed 21 October 2026 in Lens Studio 5.24.1.26100516, project
`/Users/kc/Work/Kirosho/ShadeShift.esproj`, Preview 1 / SPECS 27 / Sunlit Room.
This is a diagnostic fixture. It does not implement ShadeShift's shade-analysis model.
No account login, Lens publication, device connection, or remote application service
was needed for these checks.

## Built fixture

- `Assets/Scripts/ShadeShiftSmokePanelUI.ts`: passive UIKit BackPlate,
  FlexLayout/FlexItem rows, real UIKit Button, count setter and button intent event.
- `Assets/Scripts/ShadeShiftSmokeMain.ts`: owns the count and subscribes to the view.
- `Assets/Scripts/ShadeShiftSmokeCube.ts`: an 8 cm MeshBuilder diagnostic cube,
  official vertex-colour material, box collider, SIK Interactable and manipulation.
- `Assets/Scripts/ShadeShiftSmokeLeafIndex.ts` and `ShadeShiftSmokeScenario.ts`:
  opt-in LEAF scenario `shadeshift-m0-smoke`, using the installed Leaf 2.lspkg namespace.
- `Assets/Tools/RecordLensWindow.swift`: native macOS ScreenCaptureKit recorder.
  It selects exactly one `com.snap.LensStudio` window with the supplied exact title.
  It neither activates applications nor sends UI input nor requests permissions.

The authored panel is centred at (0,15,-110) cm, approximately 34 x 24.7 cm.
The cube starts at (0,-10,-110) cm, unit scale, with 8 cm bounds. Their vertical
gap is approximately 8.65 cm. The camera at (0,0,0) was framed with lookAt(0,6,-110).
Inspect and Interact run on the same native tool-owned `AiPreviewAgent Handler`.

## Actual checks

| Check | Observed result |
| --- | --- |
| TypeScript and startup | Compilation succeeded. `[ShadeShiftSmoke] ready` printed. No script exception after the documented UIKit initialization fix. |
| MCP button interaction | A Pinch of discovered `SmokeTestButton` changed actual Text from `Button presses: 0` to `Button presses: 1`. |
| MCP 3D drag | A real Drag towards (10,-10,-110) moved the authored cube from (0,-10,-110) to approximately (9.097102,-9.999997,-110), unit scale. SIK smoothing does not land at exactly x=10. |
| Camera control | lookAt(0,6,-110) produced camera rotation (3.12,0,0) degrees and exposed every row. lookAt(4,6,-110) produced yaw 357.92 degrees; restoring lookAt(0,6,-110) restored yaw 0. |
| Negative LEAF assertion | With `expectedButtonIncrement=2`, the scenario failed with `AssertionError: Expected: "2" - Received: "1"`. |
| Normal LEAF scenario | With `expectedButtonIncrement=1`, the scenario passed in 9.842 s. Logged `countDelta=1; dragDeltaX=4.774961471557617`; y and z assertions also passed. Every interaction was awaited. |
| Final capture state | Runtime query observed `Button presses: 3` and cube (9.347833633422852,-9.99999713897705,-110), scale (1,1,1). |
| Real video | A native window stream recorded the live Lens while MCP drove two Pinches, one Drag and two camera lookAt changes. Extracted frames were inspected. |

The LEAF drag uses the shared physical hand interactor with a per-update vector
(0.25,0,0) for 1200 ms. An initial test-driver attempt used the default controller
with a vector incorrectly treated as a destination; its position assertions
correctly failed. Correcting the test driver yielded the passing result above.

## Evidence

Private generated evidence is under `/Users/kc/Work/Kirosho/.local/evidence/`:

- `m0-smoke-final-baseline.png`: the actual preview before capture, counter 0.
- `m0-smoke-interacted.png`: actual earlier counter 1 and moved cube.
- `m0-smoke-preview.mp4`: verified Preview-only clip, H.264, 720 x 960,
  30 fps, 20.8 s, 624 decoded frames, 236186 bytes, silent.
- `m0-video-before.png`, `m0-video-drag.png`, `m0-video-after.png`: frames
  at 1 s, 8 s and 17 s. They show count 0, then 1, then 3 and the cube moving right.
- `m0-smoke-window-raw.mp4`: genuine window-only source, H.264, 2048 x 1600,
  20.74 s, 343 decoded frames, 3362400 bytes. The stream observer counted 342
  complete live frame callbacks during the requested 20 s capture.

Capture was bound to the exact observed window title
`ShadeShift* - Lens Studio v5.24.1.26100516`, window ID 272473, frame
(158,-940,1024,800) macOS points, pixel scale 2. The fresh Editor API Preview
rectangle was (978,-835,199,690) global points. Its centre 3:4 crop is
398 x 530 native pixels at (1640,635) within the recorded window, then upscaled
to 720 x 960. No private or occluding application is included in the deliverable.
An earlier desktop capture showed an occluder; it was rejected and deleted.

Rebuild the local recorder with:

```sh
swiftc -parse-as-library Assets/Tools/RecordLensWindow.swift -o .local/capture/RecordLensWindow
```

Pass a new output path, a duration from 1 to 28 seconds, and the fresh exact
window title. Obtain a fresh Preview rectangle before cropping after layout changes.
The recorder requires macOS 15+ and an existing Screen Recording grant; it refuses
to overwrite output. Native video cadence is variable, then FFmpeg encodes 30 fps.

## Limits and observations

- The final recording's first simulated MCP Pinch emitted two UIKit trigger-up
  events 330 ms apart; the second emitted one. The recording therefore ends at
  count 3 after two requested Pinches. The exact cause is unconfirmed. The earlier
  manual Pinch and the LEAF default-controller button assertion each produced
  exactly +1. No debounce was added to conceal this input-harness observation.
- Depth-format fallback and material-batching warnings were observed in the
  template/packages; the final post-interaction log tail had no errors.
- UIKit manual layout creation requires `autoDiscoverItemsOnStart=false` before
  `addItems` with this installed version. This was verified and fixed after the
  initial runtime initialization exception.
- The 398 x 530 source crop is adequate for a workflow proof and is upscaled.
  It is not a final competition demonstration or polished ShadeShift interface.
- Physical SPECS hardware, real-world tracking, thermal/performance behaviour,
  Lens publication, and the competition submission were not tested in M0.

The project was saved through the guarded Editor API after scene wiring.
Importing the reusable capture source marked it dirty again; save after adding
this evidence and subsequent work.
