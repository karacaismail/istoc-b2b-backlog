# Efor — Sprint Odyssey

This page overrides the generic task dashboard design. It is a modern tactical tabletop learning game, rendered with PixiJS 8 + Pixi UI and accessible HTML controls.

## Visual system

- Warm ivory paper, green felt board, light wooden rim, thick pastel task cards.
- Original procedural compass, meeple, board and card illustrations. A licensed Kenney CC0 nine-slice surface is used for the reveal button. See `public/game/CREDITS.md`.
- Fraunces headings, DM Sans body. At least 16 px text, including canvas labels. Numeric values are never obtained by scaling down a desktop board.
- Every stage uses the same table: team resources, sealed poker votes, chosen sprint work, final plan.
- Cards have physically distinct faces, selected states and a return-to-hand action. Space is reserved for the hand below the table. No dashboard hero or stats sidebar.

## Interaction

- Pointer/touch operates Pixi UI buttons. Desktop user agents with touch or pen receive an explicit pointer event fallback.
- Aligned semantic DOM targets supply keyboard operation and visible focus for the painted objects. All essential actions also exist as visible HTML controls.
- Touch users tap cards; mouse users can additionally drag them to the board. Dragging is never required.
- Reduced motion disables entry/hover movement. Sound is opt-in. Haptics depend on device support.
- Native modal dialogs manage settings/help focus. The fixed action bar respects the bottom safe area.
- Local progress is versioned and validated before restoring. This is a single-device, turn-taking game, not a network multiplayer session.

## Learning model

- Monthly gross capacity is 4 × 198 = 792 hours, per the supplied team assumption.
- Hours measure availability; story points measure relative work size. There is no fixed hour-to-point conversion.
- Demo history (18, 22, 20 Done SP and 257.4 focus hours/sprint) is visibly labeled as example data.
- Forecast = average Done SP × current sprint focus hours / reference sprint focus hours. This is a planning heuristic, not a Scrum requirement or a delivery promise.
- A single 15% buffer is applied to the forecast. Zero-point sprints remain in the average.
- Poker does not decide by numerical average or median. The team explicitly agrees after reveal. XP never rewards individual votes or agreement proximity.
- Dependencies, capacity, scenario goal and Done criteria gate completion. Large uncertain work can be split into discovery slices; remaining implementation is not silently considered estimated or complete.
- A 16-hour surprise support event may be drawn once. Editing capacity after completion invalidates an infeasible result.

## Verification

`pnpm run test:effort` checks capacity, gates, dependencies, persistence and report semantics.

`pnpm run test:game-ui` checks pointer, keyboard, touch, hot-seat voting, scope placement, export, restored state, renderer fallback, 320/390/768/1440 px overflow, text size and axe accessibility (including enhanced contrast). UI tests require Chrome.

Automated checks and measured canvas colors support the accessibility target; they are not a full WCAG conformance certification.
