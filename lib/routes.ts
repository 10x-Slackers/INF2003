export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
} as const;

export function loginRedirect(callbackUrl: string = ROUTES.HOME) {
  return `${ROUTES.LOGIN}?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}
