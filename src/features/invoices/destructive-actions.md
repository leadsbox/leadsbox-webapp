## Invoices – Destructive Actions

- **Mark as paid** (`VerifyInvoiceButton`): uses the global `confirm` helper with destructive styling; once confirmed the invoice status is updated to `PAID` and a receipt is issued. _Undo unavailable._
- **Delete invoice**: _Not implemented_. If deletion is introduced, it must use the confirm dialog before removing records.
- **Receipt management**: issuing receipts is part of the verify-flow above. Receipts cannot be revoked from the UI yet; any future revoke must go through `confirm`.

All other interactions on this screen (creating invoices, refreshing data, copying receipt links) are non-destructive and do not require confirmation.
