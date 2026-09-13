# AI Usage Transparency

## Evidence available

No repository metadata, commit message, source-code attribution, prompt history, or configuration identifies a specific AI coding assistant used to create the application. Therefore the AI tools used for original implementation are **Not Implemented / not detectable from source**.

## Documentation-generation assistance

This `documentation/` set was generated through an AI-assisted source-code analysis in the current workspace. The analysis inspected source/configuration/tests/documentation and recorded implemented behavior, including identified mismatches. This assistance produced documentation; it did not redesign or modify application behavior.

## Developer engineering decisions evident in code

The repository contains deliberate engineering choices: separated public/admin applications; Express middleware layering; Mongo/Mongoose schemas and indexes; JWT cookie auth, bcrypt and lockout; CORS/rate-limit/security-header setup; Docker/Nginx packaging; test suites; JSON catalogue fallback; Cloudinary/Resend/Twilio integrations. Source alone cannot prove the identity of the decision-maker, but these are implemented decisions rather than documentation assumptions.

## Manual implementation/debugging/testing evidence

Manual implementation is evident from application-specific UI, schemas/controllers, Docker/configuration, scripts, tests, and incremental Git history. Debugging/commentary evidence appears in source comments (for example reference ID regex and DNS handling) and commits. Tests include Jest/Supertest, Vitest, and Playwright files. Actual human review process, code-review approvals, test execution records, and release sign-off are **Not Implemented / not available**.

## Classification

There is no clear evidence that the project was merely copied from generated output without understanding or review. It should **not** be classified as “vibe coded” on the available evidence.
