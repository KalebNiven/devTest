# Sales Analytics Dashboard — Coding Challenge

## Overview

You've been handed a partially-built **Sales Analytics Dashboard** built with React, Node/Express, and SQLite. The app works — sort of. It has several bugs, missing features, and UX gaps that need to be addressed.

Your job is to fix the bugs, implement the missing features, and polish the user experience. The tasks are organized into three tiers. **Tiers 1 and 2 are required. Tier 3 is a differentiator** — do as much as you can.

**Time budget: 4–6 hours.** We value quality over quantity. A well-implemented subset is better than a rushed attempt at everything.

---

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Setup

```bash
# Install all dependencies (root, server, and client)
npm run install:all

# Seed the database with sample data (~5,000 sales records)
npm run seed

# Start both server and client in development mode
npm run dev
```

The client runs on `http://localhost:5173` and proxies API requests to the server on `http://localhost:3001`.

### Project Structure

```
starter/
├── server/
│   ├── src/
│   │   ├── index.js          # Express app entry point
│   │   ├── db.js             # SQLite database setup
│   │   ├── seed-data.js      # Database seeding script
│   │   └── routes/
│   │       ├── sales.js      # GET /api/sales, /api/sales/summary, /api/sales/filters
│   │       └── export.js     # GET /api/sales/export
│   └── data/                 # SQLite DB (created on seed, gitignored)
├── client/
│   └── src/
│       ├── App.jsx
│       ├── components/
│       │   ├── Dashboard.jsx      # Main layout — orchestrates state
│       │   ├── FiltersPanel.jsx   # Filter controls (search, dropdowns, dates)
│       │   ├── SummaryCards.jsx   # KPI summary cards
│       │   ├── SalesChart.jsx     # Revenue line chart (Recharts)
│       │   ├── SalesTable.jsx     # Data table with sorting and pagination
│       │   ├── DateRangePicker.jsx # Date range inputs
│       │   └── ExportButton.jsx   # CSV export trigger
│       ├── hooks/
│       │   ├── useSalesData.js    # Data fetching hook
│       │   └── useDebounce.js     # Debounce utilities
│       └── utils/
│           └── api.js             # API client functions
└── CHALLENGE.md                   # This file
```

---

## Tier 1 — Bug Fixes (Required, ~1.5 hours)

The application has several bugs. Find and fix them. For each fix, write a brief comment or commit message explaining **what was wrong and why your fix is correct**.

### 1.1 Infinite Re-render Loop
The dashboard enters an infinite fetch loop when it loads. Open the browser console — you'll see requests firing continuously. The data loads, then reloads, then reloads again... Find the root cause and fix it.

**Hint:** The issue involves the `useSalesData` hook and how its dependencies are structured.

### 1.2 Stale Search Results
Type a long search term quickly (e.g., "wireless headphones"). Sometimes the results shown don't match what you typed — they correspond to an intermediate value. This is a stale closure bug in the debounce implementation.

**Hint:** Look at `useDebouncedCallback` in `useDebounce.js`.

### 1.3 Pagination Not Resetting
Apply a filter (e.g., select a specific category), then navigate to page 3. Now change or clear the filter. The page number stays at 3, which may be beyond the available pages — resulting in an empty table.

### 1.4 Chart Not Updating
Change the date range filter. The summary cards update, but the chart continues showing the old data. The chart only shows the correct data on initial load.

**Hint:** Look at how `chartData` is memoized in `SalesChart.jsx`.

### 1.5 N+1 Query
Open the server code in `routes/sales.js`. The main sales query fetches data with a JOIN, but then loops over each row to fetch the category name individually. This is a classic N+1 query pattern — it works, but performs terribly at scale.

Fix it to use a single query with a JOIN.

### 1.6 SQL Injection Vulnerability
The `sortBy` query parameter in `GET /api/sales` is interpolated directly into the SQL query string. This allows SQL injection via the sort column.

Fix this with a whitelist of allowed column names. **Note:** Parameterized queries don't work for column names — you must validate the input.

---

## Tier 2 — Feature Implementation (Required, ~2 hours)

### 2.1 URL Query Parameter Sync
Currently, filter state lives only in React state. If the user refreshes the page, all filters are lost. If they use the browser back button, nothing happens.

Implement **bidirectional sync** between the filter state and URL query parameters:
- When the user changes a filter, update the URL
- When the page loads with query parameters, initialize filters from the URL
- Browser back/forward should navigate between filter states
- Handle edge cases: invalid parameters, empty values, etc.

### 2.2 CSV Export with Progress and Cancellation
The current export button triggers a download but provides no feedback. Implement:
- A **progress indicator** showing how much of the export has been downloaded (use the `X-Total-Rows` response header and streaming)
- A **cancel button** that aborts the download mid-stream (use `AbortController`)
- **Error handling** with a user-visible error message (not just `console.error`)

You will also need to fix the **race condition** on the server-side export endpoint (`routes/export.js`) — it writes to a shared temp file that corrupts when concurrent requests hit it.

### 2.3 Timezone-Aware Date Grouping
The revenue chart groups sales by date, but the server-side query uses SQLite's `date()` function, which doesn't correctly handle ISO dates with timezone offsets.

For example, a sale recorded as `2024-03-15T23:00:00-05:00` is actually `2024-03-16T04:00:00Z` in UTC, but `date()` strips the time and returns `2024-03-15`.

Fix the grouping so that dates are correctly normalized before aggregation. You can choose to fix this server-side, client-side, or both — but the chart must show accurate daily totals.

### 2.4 Error Handling
The app has minimal error handling. Implement:
- **React Error Boundaries** to catch rendering errors without crashing the whole page
- **Per-component error states** (e.g., if the summary API fails, show an error in the summary cards area, not a full-page error)
- **Retry functionality** — let users retry failed requests
- **Meaningful error messages** based on the type of failure (network error vs. server error vs. timeout)

---

## Tier 3 — UX & Polish (Differentiator, ~1.5 hours)

These tasks have deliberately vague specs. We're evaluating your design judgment and attention to detail.

### 3.1 Responsive Layout
The dashboard should work well on mobile devices. Consider:
- How should the data table transform for small screens?
- How should the filters panel behave on mobile?
- What about the chart and summary cards?

There is no specific mockup — use your judgment.

### 3.2 Accessible Date Range Picker
The current date range picker uses basic `<input type="date">` elements. Make it accessible:
- Full keyboard navigation
- Proper ARIA labels and roles
- Screen reader announcements when dates change
- Focus management

### 3.3 Loading Skeletons
Replace the generic loading states with **skeleton screens** that match the actual content layout. The skeletons should give users an accurate preview of what the content will look like.

### 3.4 Empty States
When filters produce zero results, show a helpful empty state that:
- Explains why there are no results
- Suggests clearing or adjusting specific filters
- Maintains the page layout (no layout shift)

---

## Submission

1. Create a **Git repository** with your solution
2. Make **atomic commits** that correspond to individual tasks (e.g., "Fix 1.1: Resolve infinite re-render loop")
3. Include a brief `NOTES.md` at the root explaining any tradeoffs or decisions you made
4. Ensure the app **builds and runs** with the setup instructions above

---

## Evaluation Criteria

We will evaluate your submission on:

| Category | Weight | What we look for |
|---|---|---|
| **Bug Fixes** | 30% | Correct root cause identification; fixes address the problem, not the symptom |
| **Feature Implementation** | 35% | Completeness, edge case handling, proper use of APIs |
| **UX & Polish** | 25% | Design taste, accessibility, responsive behavior, loading states |
| **Code Quality** | 10% | Clean commits, consistency with existing code style, no regressions |

Good luck!
