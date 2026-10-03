# ADR-005: React, TypeScript and small presentation components

Status: accepted.

React and TypeScript provide typed data boundaries and maintainable interactive search state; Vite provides a compact build pipeline. Route pages compose reusable controls, status states, researcher cards and chart/table components. A dedicated API module isolates HTTP and the explicitly enabled offline preview. Abortable resource loading prevents stale results.

Use ordinary semantic HTML and a shared token-based stylesheet rather than a large UI framework. Recharts handles bar charts, while simple SVG is sufficient for a small theme network. Every visual has a text/table equivalent. A generated complete HTML directory provides useful no-JavaScript content without introducing a second server-rendering framework.

The tradeoff is that interactive routes require JavaScript. Revisit server rendering if public indexing or full progressive enhancement becomes a primary requirement.
