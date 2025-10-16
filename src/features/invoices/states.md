## Invoices – Loading & Empty States

- **Initial load**: `InvoiceSummarySkeleton` (three metric cards) and `InvoicesTableSkeleton` (table shimmer rows) render for API requests that exceed 200 ms.
- **Empty state**: `EmptyState` card prompts users to create their first invoice and links to support documentation.
- **Invoice detail loading**: while a row is selected, `InvoiceDetail` renders a local skeleton (title, meta rows, and preview placeholder) until the detail query resolves.
- **Receipt detail**: `ReceiptPage` shows skeletons for header/meta sections followed by an iframe placeholder; errors surface via `Alert`.
- **Optimistic feedback**: verifying payments keeps the detail view visible and shows an inline banner with receipt info once the mutation completes.
