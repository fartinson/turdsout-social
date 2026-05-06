export const routes = {
  home: "/",
  signIn: "/signin",
  signInCheckEmail: "/signin/check-email",
  me: "/me",
  newPost: "/new",
  userProfile: (handle: string) => `/u/${handle}`,
} as const;

