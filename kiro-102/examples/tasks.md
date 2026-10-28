# Reference tasks: Search loaded posts

Teaching example only. All boxes are intentionally incomplete. Copying this file is not evidence of implementation.

- [ ] 1. Add and check the filtering helper.
  - Check case-insensitive content matches, outer spaces, empty input, no matches, author-only text not matching, order and input immutability.
  - Requirements: 1.1–1.4, 3.1.
- [ ] 2. Add the search controls and correct display states.
  - Keep the source list intact. Add visible label, scope hint and Clear search button; preserve existing card actions.
  - Check loading, error, empty feed, matching and no-match states.
  - Requirements: 2.1–2.6, 3.5.
- [ ] 3. Handle pagination and sorting.
  - Pause the observer during active search; restore it after clearing. Retain query on sort change, reset on reload.
  - Check with more than one page of posts or a simulated browser dataset.
  - Requirements: 1.3, 3.2–3.4.
- [ ] 4. Verify the feature and record evidence.
  - Run typecheck, lint, tests and build.
  - Demonstrate the worksheet cases. Mark cases not exercised as not checked.
  - Map every acceptance criterion to a result. Include the separate Jebat MCP tool result.
  - Requirements: all.
