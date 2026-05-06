/**
 * Central place for vote / bookmark copy. Swap labels here without touching components.
 */
export const engagementUi = {
  voteUp: {
    /** Screen readers + tooltips */
    accessibleName: "Upvote",
  },
  voteDown: {
    accessibleName: "Downvote",
  },
  bookmark: {
    addAccessibleName: "Bookmark",
    removeAccessibleName: "Remove bookmark",
  },
} as const;
