# ShadeShift presentation script

Record one seated talking-head take in landscape orientation. Keep the camera near eye level and use a quiet room. Leave two seconds before starting and after finishing. Read only the paragraphs below, naturally, aiming for about 2 minutes 40 seconds. No Lens operation or movement is needed; Codex will place the actual Preview footage over the narration and edit the pauses.

Pronunciation: SPECS = “specs”; CLAD = “clad”; MCP = “M C P”.

---

A shelter can look perfectly positioned at noon and miss the queue later. ShadeShift helps facilities and event planners use the shelters they already own, around the hours people need shade.

This is a fictional Singapore school courtyard, shown in the SPECS simulator. Two shelters serve three activities: lunch, outdoor seating, and afternoon pickup. The timeline shows projected shade moving from noon to five.

Each activity has its own schedule and analysis height. The score combines the fraction of its area shaded with the number of people present and how long they stay.

I can move either shelter by pinching its handle. Valid placements snap to the grid. The model rejects overlaps, courtyard boundary violations, and shelters inside the marked access corridor.

Find better placement evaluates all five thousand, four hundred and thirty-six permitted layouts. It proposes the best evaluated grid arrangement and waits for a decision.

Here, modeled coverage rises from thirty-two point one to sixty-two point three percent: a gain of thirty point two percentage points.

But the lunch queue loses all its modeled whole-period coverage. Seating and pickup gain shade. That loss is visible before Apply. The planner can reject the suggestion, change the activity profile, or undo an applied layout.

After applying, I inspect the same plan at full scale, return to the tabletop, and commit a reproducible summary with its inputs and layout.

The spatial view connects each score to the places people use, making the recommendation and its tradeoffs easier to review.

I planned ShadeShift with Devpost Learn, then used Codex, Snap’s CLAD, and Lens Studio MCP to build the actual Lens. Fourteen numerical checks and seven interaction scenarios verify its calculations and behavior.

This offline prototype uses illustrative occupancy and validated solar fixtures. It has not been field-tested or tested on physical glasses. It does not predict cooling, structural safety, or carbon savings.

ShadeShift helps planners make a practical climate-adaptation choice before moving real shelters: where can our existing shade serve our schedule better?
