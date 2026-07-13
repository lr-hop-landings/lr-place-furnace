# Observer Report

- Run: `D:\works\projects\lr-place-furnace`
- Generated: 2026-07-13 15:19:18
- Status: **NEEDS WORK**
- Errors: 0
- Warnings: 1

## Checks

| Check | Status | Details |
| --- | --- | --- |
| contract schemas | `pass` | schemas pass |
| contract: analysis.json | `pass` | valid JSON |
| contract: wireframe.json | `pass` | valid JSON |
| contract: wireframe.resolved.json | `pass` | valid JSON |
| contract: style.tokens.json | `pass` | valid JSON |
| package.json | `pass` | present and valid |
| resolved blocks | `pass` | 17 blocks |
| resolved block props | `pass` | all blocks have props |
| block selection report | `pass` | present |
| composer selection risk | `pass` | no medium/high risks |
| missing block report | `pass` | present |
| conversion basics | `pass` | cta and contacts present |
| trust basics | `pass` | proof section present |
| hero copy quality | `pass` | specific hero headline |
| manual fill items | `pass` | none |
| manual-fill.md | `warn` | 11 open items |
| content placeholder scan | `pass` | no placeholder patterns found |
| screenshots | `pass` | desktop=2, mobile=3 |
| dev server responds | `pass` | http://127.0.0.1:4321/ustanovka-metallicheskih-pechey/ returned 200 |
| npm run build | `pass` | exit code 0 |

## Issues

| Severity | Area | Issue | File | Recommendation |
| --- | --- | --- | --- | --- |
| `warning` | user-data | manual-fill.md has 11 open user-data items. | manual-fill.md | Collect real user data or explicitly accept the fallback before publishing. |

## Observer Notes

- The run builds, but needs editorial cleanup before publication.
- Prioritize warnings in `content`, `cta`, and `assets`; these usually affect user trust more than layout polish.
- Re-run `D:\works\lr-wp-ai-agent\scripts\validate-run.ps1 -RunPath "D:\works\projects\lr-place-furnace"` after changes.
