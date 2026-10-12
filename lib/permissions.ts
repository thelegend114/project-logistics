export type UserRole =
  | "owner"
  | "admin"
  | "dispatcher"
  | "safety"
  | "accounting"
  | "maintenance"
  | "driver"
  | "customer"
  | "broker";

export const rolePermissions: Record<UserRole, string[]> = {
  owner: [
    "/",
    "/operations",
    "/loads",
    "/dispatch",
    "/drivers",
    "/drive",
    "/fleet",
    "/compliance",
    "/ifta",
    "/documents",
    "/ai",
    "/finance",
    "/factoring",
    "/users",
    "/settings",
  ],

  admin: [
    "/",
    "/operations",
    "/loads",
    "/dispatch",
    "/drivers",
    "/drive",
    "/fleet",
    "/compliance",
    "/ifta",
    "/documents",
    "/ai",
    "/finance",
    "/factoring",
    "/users",
    "/settings",
  ],

  dispatcher: [
    "/",
    "/operations",
    "/loads",
    "/dispatch",
    "/drivers",
    "/fleet",
    "/documents",
    "/ai",
  ],

  safety: [
    "/",
    "/drivers",
    "/fleet",
    "/compliance",
    "/ifta",
    "/documents",
  ],

  accounting: [
    "/",
    "/finance",
    "/factoring",
    "/documents",
  ],

  maintenance: [
    "/",
    "/fleet",
    "/documents",
  ],

  driver: [
    "/drive",
  ],

  customer: [
    "/",
    "/documents",
  ],

  broker: [
    "/",
    "/loads",
    "/documents",
  ],
};

export function canAccessRoute(
  role: string | null | undefined,
  pathname: string
): boolean {
  if (!role) {
    return false;
  }

  const normalizedRole = role.toLowerCase() as UserRole;
  const allowedRoutes = rolePermissions[normalizedRole];

  if (!allowedRoutes) {
    return false;
  }

  return allowedRoutes.some((route) => {
    if (route === "/") {
      return pathname === "/";
    }

    return (
      pathname === route ||
      pathname.startsWith(`${route}/`)
    );
  });
}

