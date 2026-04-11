# Repository Guidelines

## Project Structure & Module Organization
This repository is a static frontend loan-analysis app. `src/lib/loanEngine.ts` contains the core repayment and IRR logic; keep financial rules there instead of burying them in UI components. `src/components/` holds presentation pieces such as metric cards, charts, and tables. `src/App.tsx` wires the form, comparison view, and schedule output together. GitHub Pages deployment lives in `.github/workflows/deploy.yml`.

## Build, Test, and Development Commands
- `npm install` installs frontend dependencies and creates `package-lock.json`.
- `npm run dev` starts the local Vite development server.
- `npm run test` runs the Vitest suite for the calculation engine.
- `npm run build` type-checks and builds the production bundle into `dist/`.

## Coding Style & Naming Conventions
Use TypeScript with strict typing and React function components. Prefer `camelCase` for variables and helpers, `PascalCase` for components, and keep repayment method ids stable (`annuity`, `equal-principal`, `flat-interest`, `interest-only`, `bullet`). Financial calculations should use `decimal.js`; avoid `number` math for money or rates except lightweight chart rendering. Keep UI copy in Chinese where it is user-facing.

## Testing Guidelines
Place engine and formula tests beside the source in `src/lib/*.test.ts`. Cover at least one normal case, one edge case, and one fee-sensitive case for every new repayment rule. When changing amortization logic, verify `totalInterest`, last-period balance, and effective annual rate. Run `npm run test` before every commit and `npm run build` before opening a pull request.

## Commit & Pull Request Guidelines
Follow the repository’s existing short, imperative Chinese commit style, for example `重构年化率计算引擎`. Keep commits scoped to one logical change. Pull requests should describe the financial rule or UI behavior changed, list the verification commands run, and include screenshots for visual updates. If deployment behavior changes, mention any required updates to `vite.config.ts` or the Pages workflow.
