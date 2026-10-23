# Development and completion acceptance

Make a backwards dinner schedule from cooking and resting durations you enter. Check overlapping shared-oven temperatures and exclusive resources, then keep visual countdown timers alongside the plan.

## Bounded version 1 scope

Create and edit a dated meal; verify backwards cooking/rest offsets and previous-day starts; check conflicting/different named resources; start/reload/dismiss visual countdowns; print the selected saved schedule. No food-safety assertions are permitted.

- This is a scheduling tool, not food-safety guidance. All durations and temperatures come from you.
- No recipe lookup, automatic temperature changes, food handling advice or safe-doneness claims.
- Add preparation and preheating as separate tasks if needed. Oven capacity and temperature-transition time are not calculated.
- Resource names are compared after trimming and ignoring case. Use the same name for the same oven, hob or appliance. Cooking intervals reserve the resource; resting does not.
- All oven temperatures use Celsius. No conversion is implied.
- Dates use the device’s current local timezone. Moving to a different timezone reinterprets the saved wall-clock target. Nonexistent local times and dates outside 2000–2100 are refused. At a repeated daylight-saving local target time, the browser chooses the earlier occurrence. Schedule marks include the year and UTC offset to distinguish repeated hours.
- Timers are visual only: no sound or notifications. They do not run a background alarm. Closing, sleeping or suspending the browser can delay display. Use a separate kitchen timer when timing matters.

## Architecture

Dependency-free ES modules separate pure input/domain logic (`core.js`), guarded persistence and versioned backups (`vault.js`), DOM helpers (`ui.js`) and the project-specific interface (`app.js`). User text reaches text nodes. The pet/kit raster validator checks allowed signatures, lengths and dimensions before an imported backup can replace data; the photo picker decodes/resizes/re-encodes locally. Print output is generated from saved records.

## Required completion evidence

Meaningful domain and persistence tests, syntax/network checks, all three browser engines at desktop/narrow widths, keyboard-accessible controls, source and directly opened exact ZIP entry point, actual print output, import cancel/confirm, corrupt storage recovery, stale writes, quota failures, deletion/reset undo and async input races must be reviewed. Independent review must leave no identified meaningful remaining contribution inside the intended scope. Publication still requires repository/CI/CodeQL settings, immutable tag, exact tag-built artifact digests and the coordinated Forge/catalog/owner reconciliation. No Gold status is assigned in this candidate.
