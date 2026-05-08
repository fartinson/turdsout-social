export const routes = {
  home: "/",
  signIn: "/signin",
  signInCheckEmail: "/signin/check-email",
  me: "/me",
  newPost: "/new",
  donate: "/donate",
  post: (id: string) => `/t/${id}`,
  userProfile: (handle: string) => `/u/${handle}`,
  page: (slug: string) => `/p/${slug}`,
} as const;
