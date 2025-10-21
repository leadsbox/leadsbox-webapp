# LeadsBox Webapp Performance Playbook

This playbook captures the guardrails and repeatable steps that keep the marketing app fast, accessible, and search-friendly.

## Performance Budgets

- **Initial JS**: ≤ 170&nbsp;KB gzipped on `/`
- **Initial CSS**: ≤ 40&nbsp;KB gzipped
- **Hero / LCP image**: ≤ 120&nbsp;KB, served as AVIF or WebP with width/height attributes
- **Core Web Vitals** (mobile Slow 4G profile):
  - FCP ≤ 2.0&nbsp;s
  - LCP ≤ 2.5&nbsp;s
  - CLS ≤ 0.1 (target 0)
  - TBT ≤ 100&nbsp;ms

## Release Checklist

1. `npm run build` – ensure the production bundle compiles without warnings.
2. `npm run analyze:bundle` – inspect `dist/bundle-report.html` and confirm no single chunk regresses beyond the budgets above. Look for duplicated libraries and non-critical bundles in the entry chunk.
3. Lighthouse / PSI – run mobile tests for `/` and `/dashboard` and document metrics in the PR (attach screenshots when metrics change).
4. Verify there are no console errors in the built preview (`npm run preview`).
5. Spot-check that fonts, icons, and analytics load after the main content (network waterfall should show a quiet first paint).

## Implementation Guidelines

- **Code splitting**: lazy-load route modules and heavyweight components (charts, editors, WYSIWYG, integrations). Never import large vendor bundles in shared layout files.
- **Dependencies**: prefer ESM-friendly, tree-shakable packages. Import only the modules you use (`date-fns/format`, individual icons, etc.).
- **Styling**: keep Tailwind `content` globs accurate. Move rarely used utilities from global CSS into component scope.
- **Images & media**: serve responsive sources with `loading="lazy"` for below-the-fold assets. Inline only the minimal critical hero styles; gzip or brotli assets by default.
- **Third-party scripts**: defer analytics/chat widgets until `load` or explicit user interaction. Audit dependencies quarterly and remove unused SDKs.
- **Caching & headers**: static asset responses should include `Cache-Control: public, max-age=31536000, immutable`. Security headers (CSP, HSTS, XFO, COOP/COEP, CORP) must remain in `vercel.json`.

## Monitoring & Tooling

- Add Lighthouse CI or PageSpeed API checks to CI with the budgets above.
- Track bundle size changes with the uploaded `bundle-report.html` artifact and mention regressions in PR summaries.
- For runtime anomalies (spikes in LCP/FCP), correlate with recent deployments and inspect the Network panel for new render-blocking resources.

Keeping this checklist up to date – and running it before every release – ensures the site stays performant without firefighting.
