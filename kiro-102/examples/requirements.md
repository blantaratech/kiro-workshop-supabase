# Reference requirements: Search loaded posts

Teaching example only. Generate and review your own Kiro spec first.

## Requirement 1: Find text in loaded posts

**User story:** As a reader, I want to search loaded post content so I can find a post quickly.

### Acceptance criteria

1. WHEN a reader enters a non-empty query, THE feed SHALL show only loaded posts whose content contains the trimmed query, ignoring letter case.
2. WHEN the query is empty or contains only whitespace, THE feed SHALL show all loaded posts.
3. WHEN filtering produces matches, THE feed SHALL preserve their existing order.
4. THE search SHALL match post content only, not author names or other fields.

## Requirement 2: Clear and understandable controls

### Acceptance criteria

1. THE search input SHALL have a visible, associated label, “Search loaded posts”.
2. THE feed SHALL explain that the filter searches loaded posts only.
3. WHEN the reader activates “Clear search”, THE query SHALL become empty and all loaded posts SHALL return.
4. THE input and Clear search control SHALL be operable using the keyboard.
5. WHEN the query is non-empty and no loaded posts match, after loading has finished without an error, THE feed SHALL show “No matching loaded posts”.
6. THE feed SHALL distinguish no matches from the existing loading, fetch-error and empty-feed states. A fetch error must remain visible and not be replaced by a no-match message.

## Requirement 3: Keep the exercise bounded

### Acceptance criteria

1. THE implementation SHALL use the posts already loaded in page state, without adding search API calls or changing the database, grants or RLS policies.
2. WHILE a non-empty trimmed query is active, THE feed SHALL pause automatic load-more; clearing it SHALL restore the normal load-more mechanism.
3. WHEN the reader switches sorting, THE feed SHALL retain the query and apply it to the resulting loaded posts in the selected sort order, with the existing loading state during refetch.
4. WHEN the reader fully reloads the page, THE search query SHALL reset to empty.
5. THE feature SHALL preserve the existing post rendering, navigation and like actions on visible posts.

These are classroom requirements chosen for a small exercise. Database-wide search, fuzzy matching, saved queries and author search are out of scope.
