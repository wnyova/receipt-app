# Verification record

- Integration/unit suite: 20 passing tests.
- Production TypeScript and Vite build checked.
- Browser checked: dashboard renders with empty actual database; product creation persists; order entry computes 40,960 from two 20,000 products, 10% discount, 11% tax and 1,000 fee.
- Independent code review performed. Fixed decimal half-up rounding, currency-specific dashboard aggregation, full restore snapshot validation and invoice sequence validation. Added regression tests.
- Existing drafts keep their original store/currency/rounding configuration. Completed invoices retain archived receipt templates.
- Backups contain database data; images remain separate local files. Full migration requires uploads/.
- Remaining minor: paired receipt labels and amounts retain opposite-edge layout; text alignment primarily affects standalone fields. Width and offset reposition the paired row.
- Not verified: real thermal printer output, native dependency installation on Windows, end-to-end browser completion/physical print. API completion and historical snapshot behavior are tested.
- No public deployment performed. Source repository: https://github.com/wnyova/receipt-app.
