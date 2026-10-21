# Kirosho execution status

Updated: 21 October 2026 (Singapore time).

The authoritative requirements are in [implementation_plan.md](implementation_plan.md).
The original user-supplied `implememtation_plan.md` is preserved at the repository root.

## Current milestone

**Kirosho was submitted to Learn AR with SPECS on 21 October 2026. The working Lens, verification, narrated video and timed English captions are complete. Devpost confirmed “Project submitted!”**

Latest application checkpoint: **ec87528**. `Kirosho.esproj` and Lens metadata use Kirosho. Exact-root save verified at **21 October, 16:55:02 SGT**. All 21 renamed script/data assets retain their GUIDs. All 14 numerical checks and all seven product scenarios passed again with the new names; three passing runs also generated replacement footage. The final save includes the corrected active Leaf 2.0.2 bridge.

The final [2:26 narrated demonstration](https://www.youtube.com/watch?v=5xc7pn-5Pfs) is public on YouTube, with 43 burned-in English caption cues and a published English caption track. Public playback reported 146.021 seconds and readyState 4; YouTube Studio confirmed HD processing complete. The [68.5-second silent sequence](media/preview-sequence.mp4), [script](presentation_script.md), [shot list](demo_shot_list.md), [verification report](verification.md) and [final-video checks](final_video.md) retain production evidence.

The renamed application checkpoint **ec87528** is published in the [public Kirosho repository](https://github.com/kaseyho/Kirosho). GitHub's default branch and the local branch are `codex/kirosho`. Git LFS integrity checks passed. The completed [Devpost entry](https://devpost.com/software/kirosho) includes the public video, repository, story, technology explanation, thumbnail and three captioned Preview screenshots. Required personal answers were supplied by the entrant. See the [submission record](../devpost/submission-record.json).

**Known performance limit:** selected captures measured 12–16 updates/s; fast earlier runs reached approximately 30. The 30 fps target is not consistently met. Search was below two seconds in selected takes, with earlier slower runs retained. No physical SPECS result is claimed.

The sections below retain earlier implementation checkpoints; current status is recorded above.

Completed:

- Inspected the saved plan and the initially empty Git repository.
- Preserved the existing `https://github.com/kaseyho/Kirosho.git` remote.
- Created the `codex/kirosho` development branch.
- Added the official `lens-studio-devs/ls-extensions` marketplace and installed `ls-clad`.
- Installed `challengepost/learn-specs`'s `plan-lens` skill into the project-local skill directory.
- Added local-only exclusions for credentials, caches, and intermediate capture files.
- Received action-time user approval and accepted the official download-page agreements.
- Downloaded the official macOS ARM installer: `Lens_Studio_5.24.1_mac_arm64.dmg`, 1,109,005,853 bytes.
- Installer SHA-256: `a4c5d33464614381ebd1c04deca526e3991a11ada2d50b3d240354a397dc27ff`.
- Installed CLAD source revision: `8adedd5d5b93f9dbe55f31c6be4264a4f8a608b3` from the official marketplace.
- Installed and launched `/Applications/Lens Studio.app`, version `5.24.1.26100516`.
- Verified the application signature and macOS assessment: accepted, notarized Developer ID, Snap Inc. (`424M5254LK`).
- Verified accessible editor controls and the native Save As dialog work.
- Created the official SPECS Base Template and saved `Kirosho.esproj` at the repository root.
- Opened the root project in Lens Studio and verified the exact loaded path through MCP.
- Loaded the Lens Studio MCP tools after the assistant-session restart; `ListAllPanels` and `VirtualScene read` succeeded.
- Confirmed the template includes Spectacles Interaction Kit 2.0.0 and Spectacles UI Kit 2.0.0.
- Confirmed Preview uses SPECS 27 with the supplied Sunlit Room interactive environment.
- Queried the editor authorization state once: `isAuthorized: false`.
- Followed the installed Devpost Learn planning workflow using the previously approved scope; generated the design brief, acceptance matrix, model assumptions, attribution inventory, and workflow evidence under `devpost/`.
- Rechecked the current competition requirements and deadline against the official pages.
- Installed Git LFS 3.8.0 from Homebrew and initialized it for this repository only, matching Lens Studio's generated asset attributes.
- Saved the root project through the Editor API before recording the initial project snapshot.
- Verified that scene reads, Asset Library searches and package installation work while signed out.
- Installed AI Preview Agent Inspect 2.0.2, AI Preview Agent Interact 2.0.1, and Leaf 2.0.2 through MCP. Dependencies include a separate Leaf 2.0.0 copy; import-path compatibility is being checked before test authoring.
- Recompiled the installed project successfully and refreshed its runtime; logs showed SIK startup and no runtime errors.
- Captured and inspected the genuine Sunlit Room preview while signed out. This is baseline rendering evidence, not yet proof of smoke interactions.
- Built the real UIKit button and SIK draggable smoke fixture. Pinch, drag, runtime queries and camera movement passed while signed out.
- Proved the LEAF harness detects a deliberately wrong assertion, then passed the normal smoke scenario in 9.842 seconds.
- Recorded a genuine Lens window stream with native ScreenCaptureKit and verified the before/after frames. The cropped proof clip is 20.8 seconds, 720 × 960, encoded at 30 fps; this is not a measured Lens frame-rate result.
- Retained the detailed M0 evidence in [M0Verification.md](../Assets/QA/M0Verification.md), including the simulated pinch observation and capture limits.

- Generated reproducible, timezone-aware SPA solar fixtures with payload SHA-256 `405dccbbcd144cf4a4a572c1efd3566e7e907d7338da2ab133d2f5b6b8249e7b`.
- Implemented the pure TypeScript projection, constraints, exact coverage, occupancy integration, placement search, revision guards, rollback, undo and snapshot state.
- Passed all 14 numerical tests, including comparison of accelerated scores with complete two-roof evaluation for every permitted grid layout.
- Verified the actual scenario regenerates 132 centers and 5,436 valid pairs. Changing occupancy changes the recommendation.
- Verified five-minute versus one-minute showcase integration differs by less than 0.004 percentage points.
- Recompiled the same engine in Lens Studio successfully and refreshed and visually checked the running diagnostic fixture.
- Retained the detailed M2 results in [NumericalVerification.md](../Assets/QA/Engine/NumericalVerification.md).

The complete Lens now renders the courtyard, real UIKit controls and SIK shelter handles. Its tested interactions include continuous timeline movement, valid and invalid shelter dragging, exhaustive placement search, explicit per-zone losses, apply, undo, cancellation, stale-result rejection, full-scale inspection, commit and reset. The seven product LEAF scenarios have passed; recent UI refinements are being checked again where they changed behavior.

Performance is still below the approved targets in recent Preview runs. A warm idle trace recorded approximately 11.4 update/render cycles per second; recent placement searches took 2.05–2.67 seconds. These are desktop observations, not physical SPECS measurements. The profiler's automatic device classification and heuristic FPS estimate were unreliable for this mid-session Lens Studio capture; actual frame-start intervals and the Lens's own wall-clock instrumentation are used instead. Profiling and final footage are still in progress, so development and submission readiness are not claimed.

A subsequent genuine Find interaction completed in 1,972.592 ms during a supported 20-second trace. That isolated result does not establish consistent performance. Native computer control later reported a locked Mac; the user unlocked it, native app access succeeded, and capture setup was completed. Lower Preview cadence also occurred after unlocking, so the lock is not an established sole cause. See [performance observations](performance_observations.md).

### Current setup handoff

The user opened **SPECS → Base Template**. Codex saved it, preserved a local staging
copy, and opened `/Users/kc/Work/Kirosho/Kirosho.esproj`. The project path is
verified through `ExecuteEditorCode`, rather than inferred from the window title.

The original chat and a child agent lacked the newly created MCP tools. A standalone
CLI preflight also failed before executing tools because its configured model was
not supported by that CLI account route. No security settings or authentication
configuration were changed. After the assistant-session restart the real Lens
Studio MCP tools loaded successfully, resolving the connection issue.

The first actual authorization query succeeded and returned `isAuthorized: false`.
The CLAD router's default route requires sign-in. After the user asked to proceed
without Lens Studio login, Codex checked the builder's standalone procedure:
`agents/specs-experience-builder.md`, Phase 0.5, explicitly states that sign-in is
"a router nicety, not a standalone hard gate" and directs the builder to proceed
with live MCP until an actual account-bound operation fails.

The standalone local build is now underway. Scene access, package installation,
TypeScript compilation, runtime startup, actual automated interactions and genuine
recording have succeeded while signed out. M0 now has its required proof.
This remains a real CLAD/MCP Lens build. No authentication protection is bypassed,
and no Lens publication or cloud application feature is needed by the plan.

The SPECS Accounts email sign-in form reports "Something went wrong. Please try
again." The failure occurred while the signed sign-in link was still valid and
was reproduced in Safari. After the user retried with Safari's Network panel
open, Codex inspected the failed response through the browser UI:

```json
{
  "code": "EMAIL_NOT_AUTHORIZED",
  "message": "This email is not authorized to log in."
}
```

The response is HTTP **403** from
`https://accounts.specs.com/api/auth/email-otp/send-verification-otp`.
This establishes an account-authorization rejection, rather than a generic
browser failure. It does not establish why the account lacks authorization.
No cached credentials, account settings, or security protections were changed;
authorization was not polled again without a completed sign-in.

The official 5.24 release notes confirm SPECS and Snapchat accounts are separate;
SPECS DevPortal uses the SPECS account for this project target. No account data,
OAuth parameters, verification codes, or credentials are included in this report.
The account-holder still owns sign-in and any account terms acceptance.

### Account diagnosis and local build resumption

The sign-in condition persisted across three consecutive goal turns, so the goal
was previously marked blocked. `ListAllPanels` succeeded during that audit.
The user's later diagnostic retry produced the specific account-authorization
response recorded above. This account problem is no longer treated as a
prerequisite for the local preview workflow.

The browser sign-in link expired at 16:22:30 UTC on 20 October (00:22:30 SGT on
21 October). It must be renewed from **Login** in Lens Studio before another
sign-in attempt. The 403 was observed while the original link was still valid;
expiry does not establish the cause of that earlier rejection.

The user completed the official
[SPECS Developer Program registration](https://developers.specs.com/dev-program).
Codex verified the page's success message: "You're in" and "Welcome to the SPECS
Developer Program. Check your inbox - we've sent you everything you need to get
started." Codex did not enter or submit registration data. Lens Studio still
shows **Login**; registration alone does not establish a completed editor sign-in
or confirm resolution of `EMAIL_NOT_AUTHORIZED`.

After registration, the user initiated a fresh Lens Studio sign-in and reported
another failure. Codex verified a different sign-in link, still within its
validity window, and Chrome's console again showed HTTP **403** from the email-code
endpoint. Chrome explicitly reported that the failed request was unavailable in
its Network panel. The latest response body was not captured; the exact error
code therefore remains confirmed only for the earlier attempt.

Codex prepared a credential-free local support draft for the official challenge
Discord's **#specs-general** channel. No outreach is authorized or sent. It is
optional for the current local workflow. Do not repeatedly request email codes,
poll authorization, clear credentials, or stop local development merely because
the editor remains signed out. If a later required MCP operation fails on actual
authentication, report that specific operation and preserve the local build.
Do not include verification codes, OAuth parameters, or credentials in project
documentation.

Project and planning checkpoint: `7ced0fc` on `codex/kirosho`. The checkpoint
contains the starter Lens and planning documents, not an implemented Kirosho
runtime. Git LFS integrity verification passed; no remote publication occurred.

## Completion gates

| Milestone | Status | Required evidence |
|---|---|---|
| 0: automated workflow | Complete | Real button/drag/runtime/camera assertions, intentional LEAF failure followed by pass, and visually verified native preview clip; see `Assets/QA/M0Verification.md` |
| 1: planning artifacts | Complete | `devpost/design-brief.md`, acceptance criteria, assumptions, attribution, and source-hash workflow record; template preservation check passed |
| 2: calculation engine | Complete | Reproducible solar fixtures, 14 passing numerical tests, all 5,436 pair scores checked, occupancy-sensitive search; see `Assets/QA/Engine/NumericalVerification.md` |
| 3: working Lens | Complete | Saved real SIK/UI Kit flow at renamed application checkpoint ec87528 |
| 4: verification and polish | Verified with performance limit | 14 numerical checks, seven product cases, final changed-case reruns, visual QA and measurements; 30 fps target remains inconsistent |
| 5: presentation | Complete | Public 2:26 narrated demo, 43 timed English cues, published caption track, original voice and real Preview footage; decode and caption checks passed |
| 6: submission package | Submitted | Public repository, video, story, thumbnail and three screenshots; entrant answers saved; Devpost displayed “Project submitted!” |

## Ownership boundary

Codex handled development, scene operation, testing, capture, editing, publication and submission. The user supplied the talking-head recording, resolved browser access and supplied the required personal declarations and survey answers. Local media and private account details remain outside Git.

The implementation will retain the full plan. A browser-only mockup, a Blender render,
an unrun test, or a draft submission does not satisfy the corresponding completion gate.
