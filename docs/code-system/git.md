# Git

## Commit subjects

`<type>: <Subject>`: a conventional type, then a capitalized present-tense subject under 72 characters, no trailing period, saying what changed.

| Type       | For                                     |
| ---------- | --------------------------------------- |
| `feat`     | Something a player or caller can now do |
| `fix`      | Something that was wrong now works      |
| `perf`     | Faster or lighter, same behavior        |
| `refactor` | Same behavior, different code           |
| `test`     | Tests only                              |
| `docs`     | `docs/` or comments only                |
| `chore`    | Build, deploy, dependencies, config     |

- Conforming: `feat: Add multiplayer Lotería for in-person play on phones`, `chore: Build on Railway with Railpack`.
- Non-conforming: `fixed bug.`, `Update render.ts`.

Check: review.

## What a commit holds

One change, with its tests and its doc updates. A change to a rule on these pages updates the page in the same commit.

The gate passes before a commit: `npm run typecheck`, `npm run lint`, `npm run test`, `npx prettier --check .`.

Check: review.

## Branches

`main` deploys: Railway builds every push to it. Work that is not ready goes on a branch.

Check: review.
