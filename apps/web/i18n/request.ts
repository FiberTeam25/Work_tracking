import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import ar from '../messages/ar.json'
import en from '../messages/en.json'

const messages: Record<string, Record<string, string>> = { ar, en }

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const locale = (cookieStore.get('locale')?.value ?? 'ar') as 'ar' | 'en'
  const validLocale = locale === 'en' ? 'en' : 'ar'

  return {
    locale: validLocale,
    messages: messages[validLocale] ?? ar,
  }
})
