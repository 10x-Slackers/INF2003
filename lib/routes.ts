export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
} as const;

export function loginRedirect(callbackUrl: string): string {
  if (!callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return ROUTES.LOGIN;
  }
  return `${ROUTES.LOGIN}?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}
