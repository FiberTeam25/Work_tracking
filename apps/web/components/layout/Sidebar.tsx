'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Database } from '@ftth/db-types'

type Role = Database['public']['Enums']['user_role']

interface NavItem {
  href: string
  label: string
  icon: string
  badge?: string | number
  roles: Role[]
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: 'الرئيسية',
    items: [
      {
        href: '/',
        label: 'Dashboard',
        icon: '▣',
        roles: ['admin', 'project_manager', 'field_supervisor', 'finance'],
      },
      {
        href: '/tasks',
        label: 'التاسكات اليومية',
        icon: '✎',
        badge: 47,
        roles: ['admin', 'project_manager', 'field_supervisor', 'field_technician', 'finance'],
      },
    ],
  },
  {
    section: 'الشبكة',
    items: [
      {
        href: '/network',
        label: 'الكابينات والبوكسات',
        icon: '⬡',
        roles: ['admin', 'project_manager', 'field_supervisor'],
      },
      {
        href: '/map',
        label: 'خريطة الموقع',
        icon: '◉',
        roles: ['admin', 'project_manager', 'field_supervisor'],
      },
    ],
  },
  {
    section: 'المالية',
    items: [
      {
        href: '/contract',
        label: 'بنود العقد',
        icon: '▤',
        badge: 124,
        roles: ['admin', 'project_manager', 'finance'],
      },
      {
        href: '/invoices',
        label: 'الفواتير والمستخلصات',
        icon: '$',
        roles: ['admin', 'project_manager', 'finance'],
      },
      {
        href: '/materials',
        label: 'حصر المواد',
        icon: '◱',
        roles: ['admin', 'project_manager', 'field_supervisor'],
      },
    ],
  },
  {
    section: 'الإدارة',
    items: [
      {
        href: '/teams',
        label: 'الفرق والمشرفين',
        icon: '◈',
        badge: 12,
        roles: ['admin', 'project_manager'],
      },
      {
        href: '/settings',
        label: 'الإعدادات',
        icon: '⚙',
        roles: ['admin'],
      },
    ],
  },
]

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname()

  return (
    <aside
      className="overflow-y-auto py-4"
      style={{
        background: 'var(--bg-1)',
        borderInlineEnd: '1px solid var(--line)',
        gridColumn: 1,
        gridRow: 2,
      }}
    >
      {NAV.map((group) => {
        const visibleItems = group.items.filter((item) =>
          (item.roles as string[]).includes(role)
        )
        if (visibleItems.length === 0) return null

        return (
          <div key={group.section} className="px-4 pb-2">
            <div
              className="text-xs uppercase tracking-widest py-2.5 px-2"
              style={{ color: 'var(--ink-2)' }}
            >
              {group.section}
            </div>

            {visibleItems.map((item) => {
              const isActive =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm mb-px transition-colors"
                  style={{
                    color: isActive ? 'var(--ink-0)' : 'var(--ink-1)',
                    background: isActive ? 'var(--bg-2)' : 'transparent',
                    borderInlineStart: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                    borderRadius: '1px',
                    textDecoration: 'none',
                  }}
                >
                  <span style={{ width: '16px', opacity: 0.8, flexShrink: 0 }}>{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className="text-xs font-mono px-1.5 py-px"
                      style={{
                        background: isActive ? 'var(--accent)' : 'var(--bg-3)',
                        color: isActive ? '#000' : 'var(--ink-1)',
                        borderRadius: '2px',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        )
      })}

      {/* Prototype banner */}
      <div
        className="fixed bottom-0 end-0 text-xs font-bold font-mono tracking-widest uppercase py-1.5 px-4"
        style={{
          background: 'var(--accent)',
          color: '#000',
          clipPath: 'polygon(12% 0, 100% 0, 100% 100%, 0 100%)',
          paddingInlineStart: '22px',
        }}
      >
        v0.1 BETA
      </div>
    </aside>
  )
}
