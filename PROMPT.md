# PROMPT.md

## Goal
[Describe the change you want in plain English.]

## Must NOT break
- [Existing feature A]
- [Existing flow B]

## Acceptance checks (must pass)
- Run: ./verify.sh (must exit 0)
- If UI exists: smoke-check the critical flow (e.g., login → dashboard → submit)

## Constraints
- Keep changes minimal.
- No unrelated refactors/renames.
- If you change an API shape, update all callers in the repo.
- Prefer adding/adjusting scripts in package.json over one-off commands.
