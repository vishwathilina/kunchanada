/** Destination for a notification. Admins land on /admin for review items. */
export function notificationHref(
  n: { caseId?: string | null; type: string; href?: string },
  role?: string,
) {
  if (n.href) return n.href;
  if (n.caseId) return `/cases/${n.caseId}`;
  if (n.type === "badge_earned") return "/dashboard";
  if (role === "admin" && (n.type === "vet_verified" || n.type === "flag" || n.type === "expense_reviewed")) {
    return "/admin";
  }
  if (n.type === "vet_verified" || n.type === "expense_reviewed") return "/dashboard";
  return "/notifications";
}
