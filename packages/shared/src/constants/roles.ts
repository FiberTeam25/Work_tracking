export const USER_ROLES = ['admin', 'project_manager', 'field_supervisor', 'field_technician', 'finance'] as const
export type UserRole = typeof USER_ROLES[number]

export const ROLES_WITH_PRICES: UserRole[] = ['admin', 'project_manager', 'field_supervisor', 'finance']
export const ROLES_THAT_APPROVE: UserRole[] = ['admin', 'project_manager', 'field_supervisor']
export const ROLES_THAT_INVOICE: UserRole[] = ['admin', 'project_manager', 'finance']

export function canSeePrices(role: UserRole): boolean {
  return ROLES_WITH_PRICES.includes(role)
}

export function canApprove(role: UserRole): boolean {
  return ROLES_THAT_APPROVE.includes(role)
}

export function canManageInvoices(role: UserRole): boolean {
  return ROLES_THAT_INVOICE.includes(role)
}
