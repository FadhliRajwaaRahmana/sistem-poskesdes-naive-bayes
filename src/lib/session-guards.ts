export function hasAdminRole(role: string | null | undefined) {
  return role === "ADMIN";
}

export function hasUserRole(role: string | null | undefined) {
  return role === "USER";
}

export function isAuthenticated(role: string | null | undefined) {
  return role === "ADMIN" || role === "USER";
}
