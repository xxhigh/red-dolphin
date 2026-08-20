# Repository Guidelines

## Project Structure & Module Organization

This is a Chrome Manifest V3 extension built with Vue 3, TypeScript, and Vite. Vue entry points live in `src/popup/` and `src/options/`; the service worker lives in `src/background/`. Shared code should be grouped under `src/components/`, `src/composables/`, or `src/shared/` as the project grows. `public/manifest.json` is copied into `dist/`, and root HTML files are Vite entry points. Treat `sample.js` as legacy reference code; implement new behavior in typed modules under `src/`.

## Build, Test, and Development Commands

- `npm install` — installs project dependencies.
- `npm run dev` — builds into `dist/` and watches source files.
- `npm run build` — type-checks, then creates a production extension.
- `npm run type-check` — runs `vue-tsc --noEmit`.
- `git diff --check` — detects whitespace errors before committing.

Load `dist/` as an unpacked extension from `chrome://extensions`. Reload the extension after background or manifest builds.

## Coding Style & Naming Conventions

Use TypeScript and Vue SFCs with `<script setup lang="ts">`. Follow four-space indentation, double quotes, semicolons, and trailing commas in multiline structures. Name Vue components in `PascalCase`, functions and variables in `camelCase`, and constants in `UPPER_SNAKE_CASE`. Keep Chrome listeners thin and delegate behavior to testable functions. Avoid `any`; validate messages and storage data at boundaries.

## Testing Guidelines

No automated framework or coverage threshold exists yet. Every change must pass `npm run type-check` and `npm run build`, followed by manual Chrome verification. Test popup rendering, option persistence, service-worker startup, and affected permissions. When a runner is introduced, use `*.test.ts` beside source files or under `tests/`, and add regression tests for bug fixes.

## Commit & Pull Request Guidelines

The repository has no established commit history. Use short imperative subjects, preferably Conventional Commits, such as `feat: add attendance settings`. Keep commits focused. Pull requests should summarize behavior, list validation, link issues, and include screenshots for popup or options changes. Explicitly call out manifest permission, host permission, content-script, or selector changes.

## Security & Configuration

Request only necessary Chrome permissions. Never commit credentials, personal form values, session data, or secrets. Review injected scripts, URLs, and user-controlled selectors carefully; MV3 pages must not depend on remotely hosted executable code.
