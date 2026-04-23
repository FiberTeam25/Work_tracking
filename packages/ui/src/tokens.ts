// Design tokens derived from FieldOps-FTTH-Prototype.html CSS variables
export const colors = {
  bg0: '#0a0e14',
  bg1: '#111827',
  bg2: '#1a2332',
  bg3: '#243044',

  accent: '#ff7a1a',
  accent2: '#00d4ff',

  success: '#32d583',
  warn: '#fdb022',
  danger: '#f04438',
  info: '#0ea5e9',

  ink0: '#f8fafc',
  ink1: '#94a3b8',
  ink2: '#64748b',
  ink3: '#475569',

  border: '#1e293b',
  borderMuted: '#0f172a',
} as const

export const fonts = {
  sans: '"IBM Plex Sans Arabic", "IBM Plex Sans", system-ui, sans-serif',
  mono: '"JetBrains Mono", "Fira Code", monospace',
} as const

export const radii = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const

export const spacing = {
  '0': '0px',
  '1': '4px',
  '2': '8px',
  '3': '12px',
  '4': '16px',
  '5': '20px',
  '6': '24px',
  '8': '32px',
  '10': '40px',
  '12': '48px',
  '16': '64px',
} as const

// Status chip variants (task status → color mapping)
export const statusColors = {
  draft:     { bg: '#1a2332', text: '#94a3b8', border: '#243044' },
  pending:   { bg: '#1c1a0f', text: '#fdb022', border: '#fdb022' },
  approved:  { bg: '#0d1f15', text: '#32d583', border: '#32d583' },
  rejected:  { bg: '#1f0d0d', text: '#f04438', border: '#f04438' },
  invoiced:  { bg: '#0d1625', text: '#00d4ff', border: '#00d4ff' },
} as const

export type StatusColor = keyof typeof statusColors
