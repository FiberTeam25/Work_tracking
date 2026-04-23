import { createServerClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { canSeePrices } from '@ftth/shared'
import type { Database } from '@ftth/db-types'

type ProfileAccess = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'role' | 'can_see_prices'
>

type ContractItemRow = Pick<
  Database['public']['Tables']['contract_items']['Row'],
  | 'id'
  | 'code'
  | 'description_ar'
  | 'description_en'
  | 'unit'
  | 'task_type'
  | 'contract_qty'
  | 'unit_price'
  | 'sort_order'
>

type ContractGroupRow = Pick<
  Database['public']['Tables']['contract_groups']['Row'],
  'id' | 'code' | 'name_ar' | 'name_en' | 'sort_order'
> & {
  items: ContractItemRow[] | null
}

export const revalidate = 300

export default async function ContractPage() {
  const t = await getTranslations('contract')
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profileData } = await supabase
    .from('profiles')
    .select('role, can_see_prices')
    .eq('id', user!.id)
    .single()

  const profile = profileData as ProfileAccess | null
  const showPrices = profile ? canSeePrices(profile.role as any) || profile.can_see_prices : false

  const { data: groupsData } = await supabase
    .from('contract_groups')
    .select(`
      id, code, name_ar, name_en, sort_order,
      items:contract_items(
        id, code, description_ar, description_en, unit,
        task_type, contract_qty, unit_price, sort_order
      )
    `)
    .order('sort_order')

  const groups = (groupsData ?? []) as ContractGroupRow[]

  const formatEGP = (n: number) =>
    new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 2 }).format(n)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-ink-0">{t('title')}</h1>

      {groups.map((group) => {
        const sortedItems = [...(group.items ?? [])].sort((a, b) => a.sort_order - b.sort_order)
        const groupTotal = sortedItems.reduce(
          (sum, item) => sum + (item.contract_qty ?? 0) * (item.unit_price ?? 0),
          0
        )

        return (
          <details key={group.id} className="card" open>
            <summary className="flex items-center justify-between p-4 cursor-pointer select-none">
              <div className="flex items-center gap-3">
                <span className="chip text-accent font-bold">{group.code}</span>
                <span className="font-semibold text-ink-0">{group.name_ar}</span>
              </div>
              {showPrices && (
                <span className="font-mono text-accent-2 text-sm">
                  {formatEGP(groupTotal)} ج.م
                </span>
              )}
            </summary>

            <div className="overflow-x-auto border-t border-line">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bg-2">
                    <th className="px-4 py-2 text-start text-ink-1 font-medium w-16">{t('code')}</th>
                    <th className="px-4 py-2 text-start text-ink-1 font-medium">{t('description')}</th>
                    <th className="px-4 py-2 text-start text-ink-1 font-medium w-20">{t('unit')}</th>
                    <th className="px-4 py-2 text-end text-ink-1 font-medium w-28">{t('contractQty')}</th>
                    {showPrices && (
                      <>
                        <th className="px-4 py-2 text-end text-ink-1 font-medium w-32">{t('unitPrice')}</th>
                        <th className="px-4 py-2 text-end text-ink-1 font-medium w-36">{t('totalValue')}</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((item) => (
                    <tr key={item.id} className="border-t border-line hover:bg-bg-2 transition-colors">
                      <td className="px-4 py-2 font-mono text-accent-2 text-xs">{item.code}</td>
                      <td className="px-4 py-2 text-ink-0">{item.description_ar}</td>
                      <td className="px-4 py-2 text-ink-1">{item.unit}</td>
                      <td className="px-4 py-2 text-end font-mono text-ink-0">
                        {formatEGP(item.contract_qty ?? 0)}
                      </td>
                      {showPrices && (
                        <>
                          <td className="px-4 py-2 text-end font-mono text-ink-0">
                            {item.unit_price != null ? formatEGP(item.unit_price) : '—'}
                          </td>
                          <td className="px-4 py-2 text-end font-mono font-medium text-accent-2">
                            {item.unit_price != null
                              ? formatEGP((item.contract_qty ?? 0) * item.unit_price)
                              : '—'}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )
      })}
    </div>
  )
}
