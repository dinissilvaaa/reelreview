// ============================================================================
// constants/roles.ts
// The user roles used for role-based access control (RBAC).
// ============================================================================

export const USER_ROLES = ['user', 'admin'] as const; // 'user' = normal account, 'admin' = can manage everything

export type UserRole = (typeof USER_ROLES)[number]; // Type that only accepts 'user' or 'admin'

/**
 * Type guard: returns true when `value` is a valid role.
 */
export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value); // Must be a known role
}
