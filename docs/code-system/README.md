# Code system

The rules for everything a developer writes in Achik Pukllay: names, game terms, packages and modules, function shapes, trust boundaries, comments, markup and styles, tests, and commits. Its companion, the [design system](../design-system/README.md), covers what a player sees.

## Pages

| Page                                         | Covers                                                                                                                      | Enforced by                                |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| [naming.md](naming.md)                       | One row per kind of identifier, from files to wire messages and storage keys                                                | review                                     |
| [glossary.md](glossary.md)                   | One row per game concept: its name in code, in English copy, and in Spanish copy, and the in-person rules every layer keeps | review                                     |
| [modules.md](modules.md)                     | The three packages, what each may import, the job of each file, import groups, exports                                      | `tsc --build` (project references); review |
| [functions.md](functions.md)                 | Moves as pure functions returning a result, immutable data, seeded randomness, time as a parameter, options objects         | review                                     |
| [boundaries.md](boundaries.md)               | Where input is validated, and why nothing inside is                                                                         | review                                     |
| [documentation.md](documentation.md)         | File headers, JSDoc, why-comments                                                                                           | review                                     |
| [markup-and-styles.md](markup-and-styles.md) | HTML strings, escaping, complete class literals, where a style goes, click dispatch                                         | review                                     |
| [testing.md](testing.md)                     | Where tests live, `describe` and `it` names, fixtures, what each package's tests prove                                      | review                                     |
| [git.md](git.md)                             | Commit subjects and what one commit holds                                                                                   | review                                     |

## How a page states a rule

1. The rule, in one or two sentences.
2. One example that conforms and one that breaks it, from the code with its path where one exists.
3. The files involved.
4. The check that enforces it, or "review" when no tool does.

## The gate

| Command                  | Runs                                                                                                                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`      | `tsc --build` across the three packages: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch` (`tsconfig.base.json`) |
| `npm run lint`           | ESLint (`eslint.config.js`): `@eslint/js` and `typescript-eslint` recommended, unused names allowed only with a leading `_`                                                            |
| `npm run test`           | `tsc --build`, then Vitest in each package                                                                                                                                             |
| `npx prettier --check .` | Formatting: single quotes, 120 columns (`.prettierrc.json`). `npm run format` rewrites                                                                                                 |
| `npm run build`          | The packages, then the web app through Vite                                                                                                                                            |

No script checks the rules on these pages; a reviewer does.

## Changing a rule

| Change                                                        | Do in the same commit                           |
| ------------------------------------------------------------- | ----------------------------------------------- |
| A rule changes                                                | Update its page                                 |
| A new game concept in code                                    | Add its row to [glossary.md](glossary.md) first |
| A new wire message, error code, `data-action`, or storage key | Name it by [naming.md](naming.md)               |
