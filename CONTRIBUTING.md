# Contributing

Contributions should make embedded systems easier to learn while keeping the underlying facts accurate.

## Local setup

Install Node.js 22 or newer, then:

```bash
npm ci
npm start
```

Alternatively, use `./start.sh` on Linux/macOS or `start.bat` on Windows. Launchers accept Vite options, such as `--port 5174`.

Create a branch for your change. Keep each pull request focused on one problem or improvement.

## Where changes belong

| Change | Location |
| --- | --- |
| Learning interface and diagrams | `src/components/` |
| Lessons, notes, terminology, and questions | `src/course/` |
| Experiment controls and displays | `src/labs/` |
| Calculation and simulation rules | `src/models/` |
| TypeScript unit checks | `tests/unit/` |
| Browser interactions and layouts | `tests/browser/` |
| Shared source fixtures | `tests/fixtures/` |

Reuse existing components and installed dependencies. Follow the surrounding TypeScript style. Keep changes to the original course snapshots separate from application edits: `public/source/` is checked against a pinned byte inventory.

## Teaching and interaction standards

- Define unfamiliar terms before using them. Prefer one clear idea per paragraph.
- Explain where a value comes from, what rule changes it, and what the result means.
- Keep questions consistent with the lesson. Use plausible distractors and explain every answer.
- Diagrams must agree with calculated values. Distinguish simulated behavior from hardware measurements.
- Animate meaningful operations or motion; keep fixed wiring and topology stable.
- Check keyboard operation, visible focus, readable labels, and narrow screens.
- Preserve original attribution and license notices. Mark changed versions clearly.

## Before opening a pull request

Run the relevant checks from the repository root:

```bash
npm run build
npm test
```

For changes to the interface, experiments, or diagrams, also run browser checks:

```bash
npx playwright install chromium
npm run test:browser
```

Browser checks start their own production preview on port 4173 and reject an occupied port. Set `PLAYWRIGHT_PORT` to choose another port. Rebuild after source changes before running them. Reports and screenshots stay in ignored local directories.

In the pull request, describe the problem, the change, and the commands you ran. Include desktop and phone screenshots for visual changes, plus any model limits or remaining issues.

## Reporting issues

Include the lesson or topic, steps to reproduce, expected behavior, actual behavior, browser, and screen size. For an unclear explanation, quote the phrase or identify the animation step that lost you.

## Licensing contributions

Submit only work you are entitled to share. Contributions to the original application are offered under the repository's [Zlib license](LICENSE). Third-party course material, renderer code, fonts, and other dependency notices keep their original terms; the root license does not replace them.
