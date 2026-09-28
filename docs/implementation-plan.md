# Receipt Manager Implementation Plan

Goal: deliver the localhost POS described in specification.md, with genuine SQLite persistence and user-editable thermal receipts.
Architecture: React/Vite UI calls a same-origin Express REST API. SQLite owns all business data. Server recalculates totals and assigns invoice numbers inside transactions. Frontend and print use one receipt renderer.
Tech stack: TypeScript, React Router, Tailwind, Lucide, Express, better-sqlite3, Zod.
Spec: docs/specification.md (user supplied, authoritative).

## Constraints and decisions
- Development 5173 / API 3001; one npm run dev command. Production serves the built app on 3001.
- Loopback-only server, origin/host validation. No cloud, analytics, CDN, or account requirement.
- Money uses integer minor units during calculation and integer cents in persisted order snapshots. API/UI amounts are decimal currency units. Taxes apply after discount, before fees; final rounding is configurable.
- Completed orders are immutable; cancel a completed invoice with explicit confirmation. Reprints preserve store/customer/items/totals and the template snapshot at completion.
- Customer deletion unlinks the reference but retains transaction snapshots. Products are deactivated, not deleted.
- Backups are SQLite .db files; uploaded images must also be copied for full machine migration. Restore validates schema, constraints and application payloads, makes an automatic backup, then atomically replaces business records in a transaction.
- No fabricated sales. Receipt preview uses explicitly labeled sample data only.
- Private GitHub repository receipt-app preferred for this new project; never overwrite another project.

## Task 1: Persistent business API
Files: shared/model.ts, server/database.ts, server/app.ts, server/index.ts, tests/api.test.ts.
Write integration tests first for calculations, unique invoice numbers, restart persistence, completed-order immutability, malformed input, template defaults, backup and restore rollback.
Run npm test (red), implement schema, validation, CRUD, state transitions, snapshots, dashboard and uploads, rerun to green.

## Task 2: Business interface
Files: src/App.tsx, src/components.tsx, src/api.ts, src/pages/*.tsx, src/styles.css.
Implement dashboard date filters and real summaries, product/customer forms and searches, order editing/payment, sales filters/detail and customer history. Check frontend types and exercise journeys in a browser.

## Task 3: Receipt designer and operations
Files: src/Receipt.tsx, src/pages/Designer.tsx, src/pages/Settings.tsx.
One safe renderer with predefined fields, sortable element list, keyboard reorder, properties and instant preview; template CRUD/duplicate/default. Dedicated 58/80mm print route. Settings, image uploads, custom confirmations and backup/restore.

## Task 4: Delivery
Run npm test and npm run build, real-browser smoke tests including mobile and print-only output. Independent review then fix material findings. README includes Windows install, startup, backup, printing and limits. Exclude DB/uploads/dependencies from ZIP and git. Push to authorized GitHub repository and verify remote commit.

## Review focus
- Concurrent invoice creation cannot duplicate invoice numbers.
- Completed sales cannot silently change after product/customer/settings edits.
- Invalid restore leaves existing data intact; restore backup precedes replacement.
- Rounding and fractional quantities must produce equal server, UI and printed totals.
- Browser print contains only the receipt, including long product names and narrow paper.
