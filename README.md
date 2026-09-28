# Receipt Manager

A local POS, invoice manager, and thermal receipt designer. React + TypeScript + Vite frontend, Express API, and SQLite persistence. No cloud account or internet connection is required after installation.

**Ubuntu:** see [Panduan instalasi Ubuntu](docs/UBUNTU.md). No deployment is performed automatically.

## Requirements

- Windows 10/11, macOS, or Linux.
- Node.js **22.13+** (Node 24 LTS recommended), npm, and a modern browser.
- Internet is needed for the initial `npm install`. Images and fonts have no CDN dependencies.
- Install your thermal printer driver separately. Browser printing supports 58 mm and 80 mm templates.

## Start on Windows (CMD)

Extract `receipt-app.zip`, open CMD in the extracted directory, then run:

```cmd
cd receipt-app
npm install
npm run dev
```

Open **http://localhost:5173**. A single command starts both the web interface and the API on **http://localhost:3001**. Keep the CMD window open. Press Ctrl+C to stop. Data is retained after stopping or restarting the computer; the application does not autostart.

`better-sqlite3` normally downloads a prebuilt binary. If installation reports a native build error, use a supported Node LTS version matching your Windows architecture, then reinstall. An unsupported architecture may require Python and Visual Studio Build Tools (Desktop development with C++).

## Production build

```cmd
npm run build
npm start
```

Open **http://localhost:3001**. Express serves both the built frontend and the API. Run these commands from the project root. `npm start` requires a successful build first.

Both modes bind to the local device. Do not expose this unauthenticated app through port forwarding, a public reverse proxy, or a shared network.

## First use

1. Open **Pengaturan → Informasi aplikasi**, enter your shop details, optionally upload a logo, and save.
2. Add products with unique codes, prices, units, and categories.
3. Add customers if needed; anonymous sales use **Pelanggan umum**.
4. Open **Pesanan → Pesanan baru**, add products, quantities, and any discount/tax/fees.
5. Save an in-progress order or select a payment method and enter the paid amount.
6. Choose **Selesaikan pembayaran** and confirm. Underpaid orders cannot complete.
7. Open **Cetak struk**. Choose the printer and paper size in the browser dialog.

There are no seeded sales or products. Dashboard totals come from completed transactions in SQLite. Receipt Designer uses clearly labeled example data for preview only.

## Orders and calculations

- Statuses: Draft, Menunggu Pembayaran, Diproses, Selesai, Dibatalkan.
- Payment methods: Cash, Transfer, QRIS, Debit, Credit, Other. These **record** a payment made outside the app; no bank or QRIS payment processing is performed.
- Each line = quantity × price, rounded to two decimals. Discount applies to the subtotal; tax applies after the discount; fees are added afterward. The final total is rounded to the configured increment.
- Decimal-safe multiplication rounds half-up before calculations use integer minor units to avoid accumulating floating-point totals. The server recalculates every order and ignores totals supplied by a browser.
- Invoice numbers use a global, monotonically increasing sequence assigned in a database transaction. They do not reset monthly, and canceled numbers are never reused.
- Completed orders are immutable. Cancellation preserves the invoice and excludes it from sales totals. Cancellation does not initiate a refund.
- Completed receipts retain a snapshot of the transaction, customer, store information, and template. Editing a product or deleting a customer does not rewrite the historical invoice.
- Logo and product images are local file references. Preserve `uploads/` to keep old logos printable.
- Dashboard monetary statistics are filtered by the selected currency; historical currencies are never added together. Each invoice retains its currency. Changing the current currency does not convert earlier invoices or product prices. For a single shop, set currency before entering real transactions.

## Receipt Designer

Go to **Pengaturan → Printer & struk → Receipt Designer**.

- Create, duplicate, rename, delete, and choose a default template.
- Only one template is default; select another default before deleting the current one.
- Drag elements to change their order. Arrow buttons provide keyboard/touch alternatives.
- Click an element in the list or preview to edit visibility, typeface, size, color, bold, alignment, margin, padding, horizontal position, and width.
- Header, footer, thank-you text, and QR content support predefined variables: `{{store_name}}`, `{{invoice_number}}`, `{{customer_name}}`, `{{items}}`, `{{grand_total}}`.
- QR defaults to the invoice number. It is not a generated payment QRIS code.
- Save the template before leaving the designer. Saved templates are stored in SQLite.
- Colored elements appear as grayscale on monochrome thermal printers.

The receipt layout uses normal document flow, not unrestricted absolute positioning. Horizontal offset/width/alignment and vertical spacing provide positioning that adapts to changing item counts.

## Printing

Only the dedicated receipt area is included in print output. Sidebar, navigation, buttons, editor, and app backgrounds are excluded.

1. Install and select the thermal printer driver.
2. Choose 58 mm or 80 mm paper in both the app and driver.
3. Use **100% scale**, **no margins**, and disable browser **headers and footers**.
4. Print a test receipt and adjust driver printable width if necessary.

Browser `@page` support and thermal roll length differ by driver. The app requests the selected width; the driver remains authoritative. It cannot silently select a printer, send raw ESC/POS commands, operate a cash drawer, or confirm a physical print succeeded. Printing does not mark an order paid. A canceled invoice is visibly labeled **DIBATALKAN**.

## Backup and recovery

All business data is stored at:

```text
data/receipt.db
uploads/logos/
uploads/products/
```

Use **Pengaturan → Backup & restore → Unduh backup** to download a consistent `.db` snapshot, including when the app is running. Do not copy only a live `receipt.db` file manually: SQLite may still have committed data in its WAL sidecar.

For full migration, also copy the `uploads/` directory. Database backups do not embed uploaded images. Keep backups on a separate drive.

To restore:

1. Choose a `.db` backup from this application (maximum 100 MB).
2. Confirm replacement using the in-app confirmation dialog.
3. The app validates SQLite integrity, schema version, application records, and foreign keys.
4. It saves the current database to `data/backups/before-restore-*.db`.
5. It replaces records in one transaction. If replacement fails, the old data remains.

A backup is not encrypted. Treat it as private business data. Restore an automatic backup through the same interface if you selected the wrong file. Stop other work during a restore. Old backup files accumulate in `data/backups`; manage retention yourself.

## Security

- Prepared statements, foreign keys, database constraints, and transactions.
- Zod validation on both frontend forms and API inputs.
- Loopback binding, Host/Origin checks, cross-site request rejection; no cloud auth.
- Images limited to PNG/JPEG/WEBP, 5 MB, with extension, MIME, and signature checks; randomized filenames.
- React escaping; templates cannot execute JavaScript or inject HTML.
- Runtime files, databases, uploads, and environment files are excluded from git and release packages.

## Development

```cmd
npm test
npm run build
npm run format
```

API routes: `/api/products`, `/api/customers`, `/api/orders`, `/api/sales`, `/api/receipt-templates`, `/api/settings`, `/api/uploads`, `/api/dashboard`, `/api/backup`, `/api/restore`.

```text
src/          React pages, shared controls, receipt rendering
shared/       Validation schemas, types, and money calculation
server/       Express API, SQLite initialization, local entry point
scripts/      Single-command development launcher
tests/        Database/API integration and money tests
docs/         Original specification, implementation plan, QA notes
```

Dates follow the machine's local timezone. Back up before updating. Never remove `data/` or `uploads/` when replacing source files. `npm install` followed by `npm run build` refreshes a production installation.
