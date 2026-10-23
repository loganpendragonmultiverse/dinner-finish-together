# Dinner finish-together

Make a backwards dinner schedule from cooking and resting durations you enter. Check overlapping shared-oven temperatures and exclusive resources, then keep visual countdown timers alongside the plan.

Version 1.0.0 candidate. This directory contains implementation and verification work; publication and Gold assessment require the independent review and exact-release gates.

## Start here

Use the extracted release’s `index.html` in a current desktop or mobile browser. For source development, serve the repository root, or the release ZIP’s `source/` directory, locally so its JavaScript modules can load.

1. Choose **New meal**, enter a name and a local date/time for serving.
2. Add each dish, its cooking/resting minutes, and any named resource. Oven temperatures use °C.
3. Save the meal. Read the ordered start times and resolve resource warnings.
4. Start a cooking or rest countdown when you actually begin that step. Print the saved schedule if helpful.

## What it does

- Multiple saved meals, each with up to 60 dishes.
- Exact elapsed-minute offsets for cooking and resting, including starts on a previous day.
- Conflicts when one named oven needs different temperatures at overlapping times, or an exclusive resource is double-booked. Same-temperature oven use is allowed; capacity is yours to check.
- Persisted visual countdown end times that catch up after a reload.
- Printable selected-meal schedule and portable JSON backup.

## Limits and assumptions

- This is a scheduling tool, not food-safety guidance. All durations and temperatures come from you.
- No recipe lookup, automatic temperature changes, food handling advice or safe-doneness claims.
- Add preparation and preheating as separate tasks if needed. Oven capacity and temperature-transition time are not calculated.
- Resource names are compared after trimming and ignoring case. Use the same name for the same oven, hob or appliance. Cooking intervals reserve the resource; resting does not.
- All oven temperatures use Celsius. No conversion is implied.
- Dates use the device’s current local timezone. Moving to a different timezone reinterprets the saved wall-clock target. Nonexistent local times and dates outside 2000–2100 are refused. At a repeated daylight-saving local target time, the browser chooses the earlier occurrence. Schedule marks include the year and UTC offset to distinguish repeated hours.
- Timers are visual only: no sound or notifications. They do not run a background alarm. Closing, sleeping or suspending the browser can delay display. Use a separate kitchen timer when timing matters.

## Local storage and backups

Changes stay in an editor until you choose Save. Browser local storage is best-effort, not a backup: quotas differ, private browsing can discard data, and clearing site data or changing the app’s origin/browser can make records unavailable. File URLs have browser-specific storage behavior. Extract the release and open `index.html`; if file-origin storage is blocked, serve the folder locally with `python -m http.server 8000` and open `http://localhost:8000/`. This works without Internet access.

Use **Download backup** regularly. It exports saved records only, with any photos and private notes. Keep a copy outside this browser. **Import backup** validates the app identity, format version, field types, identifiers, quantities/dates and size, then opens a replacement preview. Nothing changes until you check the replacement confirmation and apply it. Import replaces the whole saved library; it does not merge. Cancel preserves the existing copy. Backups are limited to 12 MB, but browser storage may fill earlier.

Unreadable stored bytes are never silently reset. Normal saves and normal backup exports are blocked; **Download original recovery bytes** preserves the original string in a text file. A valid backup can replace it only through the explicit import confirmation. If storage is unavailable altogether, saves are blocked. A rejected save leaves the prior saved data and the editor intact.

A save checks the stored baseline before writing. A detected change in another tab blocks stale writes. Copy unsaved form text and keep original selected photos before reloading; a normal backup contains saved records only. This is not a multi-tab transactional database: use one editing tab at a time.

Deletion/reset undo is bound to the exact saved state immediately after the operation. A newer save or restore invalidates that undo, so it cannot overwrite newer work. It does not survive a reload. Cancel/discard confirmations protect unsaved editor work when switching records.

## Privacy and maintenance

The application makes no runtime network requests, has no analytics and has no account. Opening the optional source link leaves the app for GitHub. Browser storage and backup files are not encrypted; use a device/profile you trust. Do not attach real personal backups to public bug reports.

Fixes and useful ideas are welcome. There is no promised update schedule or support response time. See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [SUPPORT.md](SUPPORT.md). MIT licensed; copyright Logan Pendragon Multiverse.

## Development

Requires Node.js 22 or newer and Python 3 for ZIP packaging. No runtime dependency is installed. Run:

```sh
npm ci
npm test
npm run check
npm run build
```

The build creates `dist/site/index.html`, an offline ZIP and `dist/SHA256SUMS`. Source modules are readable in `src/`. The ZIP includes a complete rebuildable `source/` subtree with the original module-based `index.html`, scripts, tests and package files. Its separate root entry point inlines the app so it opens directly from the extracted ZIP. See [TESTING.md](TESTING.md) for browser acceptance. Do not claim a release or Gold assessment from a passing build alone.

## Development checks

Use Node.js 22 or newer and Python 3. Install development-only dependencies with `npm ci`, then run `npm test`, `npm run check` and `npm run build`. For browser acceptance, install the pinned test browsers with `npx playwright install chromium firefox webkit`, then run `npm run test:browser`. CI repeats source checks on Linux, Windows and macOS, and browser acceptance uses Chromium, Firefox and WebKit. These checks do not establish testing on physical phones or every supported OS/browser combination.

`npm run format` applies the repository formatter. The formatter and browser harness are development tools; the distributed application runs without them, accounts or an Internet connection.
