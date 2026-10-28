# Reference design: Search loaded posts

Teaching example only. This is a proposed approach, not implemented code.

## Data flow

```text
Supabase → existing feed fetch → posts array
                                    |
Search input → query → trim + lowercase
                                    |
                           filter loaded posts
                                    |
                           render visible posts
```

Keep `posts` as the source list. Derive `visiblePosts` from it and the query. Clearing the query then restores the source list without fetching it again.

## Responsibilities

- Add a typed helper in `frontend/src/lib/` that accepts posts and a query. Match `post.content` using a lowercase substring comparison with outer query whitespace removed. Preserve order and avoid mutating the input list.
- Keep query state in `frontend/src/pages/Feed.tsx`.
- Add an associated label, input, scope hint and a real Clear search button using the existing design language.
- Render the derived list while preserving post-card actions and links.
- Disconnect or suspend the infinite-scroll observer while the trimmed query is non-empty. Reattach it to the correct last card when search clears, using current loading/cursor state. Do not add a separate fetch loop.
- Retain the query on a sort change; the existing fetch replaces source posts and the derived filter applies again. A full page reload resets query state.

## Display states

| State | Expected display |
| --- | --- |
| Fetch failed | Existing error remains visible; no misleading no-match result |
| Initial fetch pending | Loading indicator; no empty-feed or no-match message |
| Fetch complete, source list empty, no query | Existing empty-feed message |
| Fetch complete, query active, no matches | “No matching loaded posts” and no post cards |
| Matches present | Matching post cards in source order |
| Query cleared | All source posts; normal load-more resumes |

## Verification

Use Vitest for filtering examples and input immutability. Use manual browser checks, or an added simulated Playwright case, for labels, keyboard control, clear, loading/error states, sorting and observer pause/restore. Cover sort changes while a query is active. The existing coverage gate covers only `config.ts` and `domain.ts`; putting a new helper elsewhere does not automatically give it coverage enforcement.

No new packages, backend schema or hosted configuration are required. Student-created practice posts use the existing app normally.
