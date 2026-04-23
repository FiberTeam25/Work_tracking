export function formatNumber(n: number, decimals: number = 0): string {
  const value = decimals === 0 ? Math.trunc(n) : n
  return value.toLocaleString('ar-EG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatEGP(n: number): string {
  return `${formatNumber(n, 2)} ج.م`
}

export function formatMeters(n: number): string {
  return `${formatNumber(n)} م`
}

export function formatDateAr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateEn(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
