# AGENTS.md

## Project context

This is a **university coursework project** done by undergraduates. It is not a production system and will never be deployed to real users.

## Research First

- Always research before implementing a task — both the codebase and online. Understand existing patterns, dependencies, and conventions before writing code.
- Refer to the latest documentation and existing implementations of any libraries or frameworks in use.
- Check `docs/` for architectural and planning details relevant to the task.

## Ask When Unsure

- Clarify ambiguities before proceeding — ask rather than guess.
- When in doubt about scope, priorities, or critical decisions, surface the uncertainty and let the user decide.

## Task completion

- After every task, run `pnpm format` and `pnpm lint`.
- If either command cannot be run or fails, mention that clearly in the final response.

## Engineering posture

Optimize for **low line count, readability, and simplicity** — not for production hardening. When a tradeoff exists:

- **Prefer fewer lines of code.** Skip defensive checks, input validation, retry logic, and abstractions that a production codebase would require.
- **Prefer readability.** A short, obvious solution beats a clever, dense one.
- **Security and robustness may be traded for simplicity.** It is acceptable to a certain degree to trust inputs, skip edge-case handling, and omit safeguards (rate limiting, sanitization layers, error boundaries, etc.) if removing them makes the code clearer and shorter.
- **Don't over-engineer.** No speculative extensibility, no config layers for options nobody uses yet, no premature abstraction.
- **Don't disable ESLint rules.** Fix the underlying issue instead of adding `eslint-disable` comments. Only disable a rule when fixing it properly would require significantly more code or a worse design.

## Data layer posture

- **Prefer SQL joins over JavaScript enrichment.** When a library function needs to return rows with related fields (e.g. a transaction with its town/flat-type names), write a single SQL query with `JOIN`s that selects the enriched columns directly. Do not fetch raw rows and then resolve names in JavaScript via lookup-table `list*` calls and `Map` lookups — that produces N+1-style code and more lines.
- Add the joined columns to the function's return type (extend the existing row type in `types.ts`) rather than returning an untyped/loose shape.
- Reach for JavaScript-side resolution only when the related data lives in a different database (e.g. MongoDB documents referencing MariaDB IDs) and a cross-DB join is not possible.
- **Keep `docs/sql-statements/` in sync.** When modifying any SQL query in `lib/tables/*/functions.ts` or `lib/auth/`, update the corresponding doc file to reflect the change.

## UI posture

The focus is functionality, not a polished UI. **Prefer simplicity over UX.** Keep styling minimal and consistent:

- **Prefer shadcn components over raw Tailwind.** Use the existing shadcn primitives instead of hand-rolling markup with utility classes. Add new ones via `pnpm dlx shadcn@latest add <component>` when needed.
- **Do not add files to or modify `components/ui/`.** That folder is reserved for shadcn primitives only. Place custom/shared components at the root of `components/`
- **Minimise style classes.** Don't pile on arbitrary utility classes for fine-grained visual tweaks. Reach for shadcn variants/props first.
- **Prefer theme colours.** Use the semantic tokens defined in `app/globals.css` rather than hardcoded colours like `bg-white` or `text-gray-500`.
- When doing HTML/UI design, reference: https://ui.shadcn.com/llms.txt

## Test users

| Email             | Role  | Password |
| ----------------- | ----- | -------- |
| admin@example.com | ADMIN | P@ssw0rd |
| agent@example.com | AGENT | P@ssw0rd |
| user@example.com  | USER  | P@ssw0rd |

Run the user seeding script if the credentials do not work: `USER_PASSWORD=P@ssw0rd pnpm seed:users`.
