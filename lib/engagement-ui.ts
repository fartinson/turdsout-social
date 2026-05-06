/**
 * Central place for vote / bookmark copy. Swap labels here without touching components.
 */
export const engagementUi = {
  voteUp: {
    /** Visible on the button (arrow is primary; this can stay empty) */
    symbol: "▲",
    /** Screen readers + tooltips */
    accessibleName: "Upvote",
  },
  voteDown: {
    symbol: "▼",
    accessibleName: "Downvote",
  },
  bookmark: {
    addAccessibleName: "Bookmark",
    removeAccessibleName: "Remove bookmark",
  },
} as const;
