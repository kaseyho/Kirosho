# Kirosho final presentation video

Completed locally on 21 October 2026 from the supplied root-level `video.mov` and the verified Kirosho Preview recordings in `docs/media/`.

## Delivery files

These files are in the local, Git-ignored `deliverables/` folder:

- `Kirosho-final.mp4` — 2:26.000, 1920×1080, 30 fps H.264 with AAC narration and burned-in timed English subtitles.
- `Kirosho.en.srt` and `Kirosho.en.vtt` — the same 43 synchronized caption cues as separate caption tracks.
- `Kirosho-edit-timeline.json` — source cuts, frame counts, original recording hash and edit notes.
- `Kirosho-video-verification.json` — final file hash, duration, decode, caption and audio checks.

The original recording is preserved. The raw recording and transcription stayed local; the completed edit was uploaded to YouTube with the entrant's authorization. Raw presenter media and rendered deliverables are excluded from Git. Copies of the [SRT](media/Kirosho.en.srt) and [WebVTT](media/Kirosho.en.vtt) captions accompany the public source.

## Content and accessibility

The edit combines the presenter with actual simulated SPECS 27 Preview footage. It keeps the search at its recorded speed, shows the lunch queue's modeled coverage loss before Apply, and uses the same applied 62.3% plan for full-scale inspection and Commit. Static frame crops enlarge the recorded review values for reading; they are labelled as recorded recommendations.

Captions follow the real speech timing, including the two phrase edits. Project and tool names are spelled correctly. Each cue uses at most two lines, with 40-pixel text in a dedicated 144-pixel lower strip; no captions cover Preview controls. The separate SRT and WebVTT files support caption editing and optional platform captions.

Narration retains the original voice and speed. It has modest noise reduction and loudness normalization, with no synthetic voice or background music. The closing card is silent.

The final spoken verification claim is 14 numerical checks. The build card additionally shows the seven verified product interaction scenarios. The physical-glasses and field-testing limits remain in the narration and captions.

## Verification

- Exact duration: **146.000 seconds**, below three minutes.
- Full audio/video decode completes without errors.
- All **43** caption cues are ordered, non-overlapping and within the video; the maximum reading rate is **20 characters per second**.
- **163 decoded caption samples** check the beginning, middle and end of every cue and the caption gaps against their intended raster; minimum PSNR is **40.89 dB**.
- Final audio measures **−16.48 LUFS** integrated loudness and **−1.36 dBTP** true peak.
- Frame review covers the presenter, timeline, all placement constraints, real search, enlarged tradeoff values, Apply, full-scale views, Commit, build counts, limitations and closing card.
- A second local transcription of the edited build/verification passage confirms the retained numerical claim. This is a transcription check, not a claim of human audio audition.

The current file hash is recorded in `deliverables/Kirosho-video-verification.json`. Local production and verification scripts are retained in `.local/presentation/`.

## Publication state

The final [YouTube video](https://www.youtube.com/watch?v=5xc7pn-5Pfs) was published as **Public** on 21 October 2026. Playback reported 146.021 seconds and readyState 4. YouTube Studio confirmed HD processing complete and the uploaded English subtitle track **Published**. Its automatic thumbnail shows the recorded review card; a custom thumbnail was optional and required channel phone verification.

The [Devpost entry](https://devpost.com/software/kirosho) was submitted the same day. Devpost displayed **“Project submitted!”** and **Submitted to Learn AR with SPECS**. See the [submission record](../devpost/submission-record.json). Confirmation screenshots are retained in the local `deliverables/` folder.
