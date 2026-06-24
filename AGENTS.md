# AGENTS.md

## Project context

This is a **university coursework project**. It is not a production system and will never be deployed to real users.

## Engineering posture

Optimize for **low line count, readability, and simplicity** — not for production hardening. When a tradeoff exists:

- **Prefer fewer lines of code.** Skip defensive checks, input validation, retry logic, and abstractions that a production codebase would require.
- **Prefer readability.** A short, obvious solution beats a clever, dense one.
- **Security and robustness may be traded for simplicity.** It is acceptable to trust inputs, skip edge-case handling, and omit safeguards (rate limiting, sanitization layers, error boundaries, etc.) if removing them makes the code clearer and shorter.
- **Don't over-engineer.** No speculative extensibility, no config layers for options nobody uses yet, no premature abstraction.
