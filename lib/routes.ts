export const routes = {
  home: "/",
  signIn: "/signin",
  signInCheckEmail: "/signin/check-email",
  me: "/me",
  newPost: "/new",
  post: (id: string) => `/p/${id}`,
  userProfile: (handle: string) => `/u/${handle}`,
  page: (slug: string) => `/l/${slug}`,
} as const;
