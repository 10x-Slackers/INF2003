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
- **Security and robustness may be traded for simplicity.** It is acceptable to trust inputs, skip edge-case handling, and omit safeguards (rate limiting, sanitization layers, error boundaries, etc.) if removing them makes the code clearer and shorter.
- **Don't over-engineer.** No speculative extensibility, no config layers for options nobody uses yet, no premature abstraction.

## UI posture

The focus is functionality, not a polished UI. Keep styling minimal and consistent:

- **Prefer shadcn components over raw Tailwind.** Use the existing shadcn primitives instead of hand-rolling markup with utility classes. Add new ones via `pnpm dlx shadcn@latest add <component>` when needed.
- **Minimise style classes.** Don't pile on arbitrary utility classes for fine-grained visual tweaks. Reach for shadcn variants/props first; only add a utility class when a component genuinely lacks the needed knob.
- **Prefer theme colours.** Use the semantic tokens defined in `app/globals.css` rather than hardcoded colours like `bg-white` or `text-gray-500`.
- When doing HTML/UI design, reference: https://ui.shadcn.com/llms.txt
